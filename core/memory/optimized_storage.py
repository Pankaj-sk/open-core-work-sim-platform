"""
Optimized Memory Storage System for SimWorld
Provides efficient caching and batch operations for better performance
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
from threading import Lock
import hashlib

class OptimizedMemoryStorage:
    """Optimized memory storage with efficient caching and batch operations"""
    
    def __init__(self, max_cache_size: int = 10000, batch_size: int = 100):
        self.max_cache_size = max_cache_size
        self.batch_size = batch_size
        
        # Memory caches
        self._conversation_cache = {}
        self._project_cache = {}
        self._agent_context_cache = {}
        
        # Write batching
        self._write_queue = deque()
        self._write_lock = Lock()
        self._last_batch_write = time.time()
        
        # Performance tracking
        self._cache_hits = 0
        self._cache_misses = 0
        self._write_batches = 0
        
        # LRU tracking
        self._access_order = deque()
        self._access_times = {}
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation with caching"""
        # Check cache first
        if conversation_id in self._conversation_cache:
            self._update_access_time(f"conv_{conversation_id}")
            self._cache_hits += 1
            return self._conversation_cache[conversation_id]
        
        self._cache_misses += 1
        # Would load from persistent storage here
        return None
    
    def cache_conversation(self, conversation_id: str, conversation_data: Dict):
        """Cache conversation data efficiently"""
        cache_key = f"conv_{conversation_id}"
        
        # Add to cache
        self._conversation_cache[conversation_id] = conversation_data
        self._update_access_time(cache_key)
        
        # Manage cache size
        self._cleanup_cache_if_needed()
    
    def _cleanup_cache_if_needed(self):
        """Clean up cache if it exceeds max size using LRU eviction"""
        if len(self._conversation_cache) > self.max_cache_size:
            # Remove 10% of oldest entries
            num_to_remove = max(1, int(self.max_cache_size * 0.1))
            
            # Sort by access time and remove oldest
            sorted_items = sorted(
                self._access_times.items(), 
                key=lambda x: x[1]
            )
            
            for i in range(min(num_to_remove, len(sorted_items))):
                cache_key = sorted_items[i][0]
                if cache_key.startswith("conv_"):
                    conv_id = cache_key[5:]  # Remove "conv_" prefix
                    if conv_id in self._conversation_cache:
                        del self._conversation_cache[conv_id]
                elif cache_key.startswith("agent_"):
                    if cache_key in self._agent_context_cache:
                        del self._agent_context_cache[cache_key]
                
                # Remove from tracking
                del self._access_times[cache_key]
    
    def _update_access_time(self, cache_key: str):
        """Update access time for LRU tracking"""
        import time
        self._access_times[cache_key] = time.time()
        
        # Also update access order for efficient LRU
        if cache_key in self._access_order:
            self._access_order.remove(cache_key)
        self._access_order.append(cache_key)
        
        # Limit access order tracking
        if len(self._access_order) > self.max_cache_size * 2:
            # Remove oldest half
            for _ in range(len(self._access_order) // 2):
                old_key = self._access_order.popleft()
                if old_key in self._access_times:
                    del self._access_times[old_key]
    
    def batch_add_memory(self, memories: List[Dict]):
        """Add multiple memories efficiently in batch"""
        with self._write_lock:
            self._write_queue.extend(memories)
            
            # Process batch if queue is full or enough time has passed
            if (len(self._write_queue) >= self.batch_size or 
                time.time() - self._last_batch_write > 5.0):  # 5 second timeout
                self._process_write_batch()
    
    def _process_write_batch(self):
        """Process queued writes in batch"""
        if not self._write_queue:
            return
        
        batch = []
        while self._write_queue and len(batch) < self.batch_size:
            batch.append(self._write_queue.popleft())
        
        # Process batch (would write to persistent storage)
        print(f"[MEMORY] Processing batch of {len(batch)} memories")
        self._write_batches += 1
        self._last_batch_write = time.time()
        
        # Update caches with new data
        for memory in batch:
            if 'conversation_id' in memory:
                conv_id = memory['conversation_id']
                if conv_id in self._conversation_cache:
                    # Update cached conversation with new memory
                    self._conversation_cache[conv_id].setdefault('memories', []).append(memory)
    
    def get_agent_context(self, agent_id: str, project_id: str) -> Dict:
        """Get cached agent context for faster responses"""
        cache_key = f"agent_{agent_id}_{project_id}"
        
        if cache_key in self._agent_context_cache:
            self._update_access_time(cache_key)
            self._cache_hits += 1
            return self._agent_context_cache[cache_key]
        
        self._cache_misses += 1
        # Generate and cache context
        context = self._generate_agent_context(agent_id, project_id)
        
        self._agent_context_cache[cache_key] = context
        self._update_access_time(cache_key)
        self._cleanup_cache_if_needed()
        
        return context
    
    def _generate_agent_context(self, agent_id: str, project_id: str) -> Dict:
        """Generate agent context from memories"""
        # This would fetch relevant memories and build context
        return {
            "agent_id": agent_id,
            "project_id": project_id,
            "recent_conversations": [],
            "key_decisions": [],
            "current_tasks": [],
            "generated_at": time.time()
        }
    
    def _update_access_time(self, cache_key: str):
        """Update LRU access tracking"""
        current_time = time.time()
        
        # Remove from current position if exists
        if cache_key in self._access_times:
            # Find and remove from access_order
            try:
                self._access_order.remove(cache_key)
            except ValueError:
                pass
        
        # Add to end (most recent)
        self._access_order.append(cache_key)
        self._access_times[cache_key] = current_time
    
    def _cleanup_cache_if_needed(self):
        """Clean up cache using LRU if size exceeds limit"""
        total_cache_items = (len(self._conversation_cache) + 
                           len(self._project_cache) + 
                           len(self._agent_context_cache))
        
        if total_cache_items > self.max_cache_size:
            # Remove oldest 10% of items
            items_to_remove = int(self.max_cache_size * 0.1)
            
            for _ in range(items_to_remove):
                if not self._access_order:
                    break
                
                oldest_key = self._access_order.popleft()
                
                # Remove from appropriate cache
                if oldest_key.startswith("conv_"):
                    conv_id = oldest_key[5:]  # Remove "conv_" prefix
                    self._conversation_cache.pop(conv_id, None)
                elif oldest_key.startswith("proj_"):
                    proj_id = oldest_key[5:]  # Remove "proj_" prefix
                    self._project_cache.pop(proj_id, None)
                elif oldest_key.startswith("agent_"):
                    self._agent_context_cache.pop(oldest_key, None)
                
                self._access_times.pop(oldest_key, None)
    
    def get_performance_stats(self) -> Dict:
        """Get performance statistics"""
        total_requests = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "write_batches": self._write_batches,
            "pending_writes": len(self._write_queue),
            "cached_conversations": len(self._conversation_cache),
            "cached_projects": len(self._project_cache),
            "cached_agent_contexts": len(self._agent_context_cache),
            "total_cache_size": (len(self._conversation_cache) + 
                               len(self._project_cache) + 
                               len(self._agent_context_cache))
        }
    
    def force_flush_writes(self):
        """Force process all pending writes"""
        with self._write_lock:
            while self._write_queue:
                self._process_write_batch()
    
    def clear_cache(self, cache_type: Optional[str] = None):
        """Clear specific cache or all caches"""
        if cache_type == "conversations" or cache_type is None:
            self._conversation_cache.clear()
        if cache_type == "projects" or cache_type is None:
            self._project_cache.clear()
        if cache_type == "agents" or cache_type is None:
            self._agent_context_cache.clear()
        
        if cache_type is None:
            self._access_order.clear()
            self._access_times.clear()
    
    def clear_all_memory(self):
        """ADMIN: Clear all optimized storage memory"""
        self.clear_cache()
        self._write_queue.clear()
        print("OptimizedMemoryStorage: All memory and caches cleared")
    
    def clear_project_memory(self, project_id: str):
        """ADMIN: Clear memory for a specific project"""
        # Remove project-specific conversations from cache
        to_remove = []
        for conv_id, conv_data in self._conversation_cache.items():
            if conv_data.get('project_id') == project_id:
                to_remove.append(conv_id)
        
        for conv_id in to_remove:
            self._conversation_cache.pop(conv_id, None)
        
        # Remove project-specific agent contexts
        to_remove_agents = []
        for cache_key in self._agent_context_cache.keys():
            if f"_{project_id}" in cache_key:
                to_remove_agents.append(cache_key)
        
        for cache_key in to_remove_agents:
            self._agent_context_cache.pop(cache_key, None)
        
        print(f"OptimizedMemoryStorage: Memory cleared for project {project_id}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate_percent": round(hit_rate, 2),
            "total_requests": total_requests,
            "cache_size": len(self._conversation_cache),
            "max_cache_size": self.max_cache_size,
            "write_batches_processed": self._write_batches,
            "pending_writes": len(self._write_queue),
            "agent_contexts_cached": len(self._agent_context_cache)
        }

# Global instance for the application
optimized_storage = OptimizedMemoryStorage()
