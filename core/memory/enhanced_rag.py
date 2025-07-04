"""
Enhanced RAG Memory System with ChatGPT-like optimizations
Implements conversation summarization, context window management, and rate limiting
"""

import json
import time
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from collections import defaultdict
import threading
import asyncio

# Lazy imports for heavy dependencies
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

# SentenceTransformer and FAISS will be imported lazily in _ensure_model_loaded

logger = logging.getLogger(__name__)

@dataclass
class ConversationSummary:
    """Summarized conversation chunk"""
    id: str
    original_messages: List[str]
    summary: str
    importance_score: float
    timestamp: datetime
    participants: List[str]
    topics: List[str]
    embedding: Optional[Any] = None  # Changed from np.ndarray to Any for lazy loading

@dataclass
class ContextWindow:
    """Managed context window for efficient memory access"""
    recent_messages: List[Dict]
    relevant_summaries: List[ConversationSummary]
    total_tokens: int
    max_tokens: int = 4000

class RateLimiter:
    """Rate limiter for API calls"""
    
    def __init__(self, max_requests: int = 60, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        with self.lock:
            now = time.time()
            # Remove old requests outside time window
            self.requests = [req_time for req_time in self.requests if now - req_time < self.time_window]
            
            if len(self.requests) >= self.max_requests:
                # Wait until we can make another request
                oldest_request = min(self.requests)
                wait_time = self.time_window - (now - oldest_request) + 1
                if wait_time > 0:
                    logger.info(f"Rate limit reached, waiting {wait_time:.1f}s")
                    time.sleep(wait_time)
            
            self.requests.append(now)

class EnhancedRAGManager:
    """Enhanced RAG manager with ChatGPT-like memory optimizations"""
    
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        """Initialize enhanced RAG manager"""
        self.embedding_model_name = embedding_model
        self.embedding_model = None
        self.embedding_dim = None
        self._model_initialized = False
        
        # FAISS indexes (will be initialized when model loads)
        self.message_index = None
        self.summary_index = None
        
        # Memory storage
        self.raw_messages: Dict[str, Dict] = {}
        self.conversation_summaries: Dict[str, ConversationSummary] = {}
        self.project_memories: Dict[str, List[str]] = {}
        
        # Context management
        self.context_windows: Dict[str, ContextWindow] = {}
        self.conversation_buffers: Dict[str, List[Dict]] = defaultdict(list)
        
        # Rate limiting
        self.rate_limiter = RateLimiter(max_requests=45, time_window=60)  # Conservative limit
        
        # Configuration
        self.max_context_tokens = 3000
        self.summary_threshold = 10  # Summarize after 10 messages
        self.max_raw_messages = 50  # Keep max 50 raw messages per conversation
        
        # Caching
        self.embedding_cache: Dict[str, Any] = {}  # Changed from np.ndarray to Any
        self.summary_cache: Dict[str, str] = {}
        
    def _get_embedding_cached(self, text: str) -> Any:  # Changed return type for lazy loading
        """Get embedding with caching"""
        # Use hash of text as cache key
        cache_key = hashlib.md5(text.encode()).hexdigest()
        
        if cache_key not in self.embedding_cache:
            self.embedding_cache[cache_key] = self.embedding_model.encode([text])[0]
        
        return self.embedding_cache[cache_key]
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text.split()) * 1.3  # Rough estimate
    
    def _should_summarize_conversation(self, conversation_id: str) -> bool:
        """Check if conversation should be summarized"""
        if conversation_id not in self.conversation_buffers:
            return False
        
        buffer = self.conversation_buffers[conversation_id]
        return len(buffer) >= self.summary_threshold
    
    def _summarize_conversation_chunk(self, messages: List[Dict]) -> ConversationSummary:
        """Summarize a chunk of conversation messages"""
        if not messages:
            return None
        
        # Extract participants and topics
        participants = list(set(msg.get("sender", "") for msg in messages))
        
        # Create summary text
        message_texts = []
        for msg in messages:
            sender = msg.get("sender", "User")
            content = msg.get("message", "")
            message_texts.append(f"{sender}: {content}")
        
        full_text = "\n".join(message_texts)
        
        # Simple extractive summarization (in production, use LLM)
        summary = self._create_extractive_summary(full_text)
        
        # Calculate importance score
        importance_score = self._calculate_importance_score(messages)
        
        # Extract topics (simple keyword extraction)
        topics = self._extract_topics(full_text)
        
        # Create summary object
        summary_obj = ConversationSummary(
            id=f"summary_{int(time.time())}_{hash(full_text) % 10000}",
            original_messages=[msg.get("message", "") for msg in messages],
            summary=summary,
            importance_score=importance_score,
            timestamp=datetime.now(),
            participants=participants,
            topics=topics
        )
        
        # Generate embedding for summary
        summary_obj.embedding = self._get_embedding_cached(summary)
        
        return summary_obj
    
    def _create_extractive_summary(self, text: str) -> str:
        """Create extractive summary (simplified version)"""
        sentences = text.split('. ')
        if len(sentences) <= 3:
            return text
        
        # Simple scoring based on length and position
        scores = []
        for i, sentence in enumerate(sentences):
            # Prefer longer sentences and those at the beginning
            score = len(sentence.split()) * (1.0 - i / len(sentences) * 0.5)
            scores.append((score, sentence))
        
        # Take top 3 sentences
        top_sentences = sorted(scores, reverse=True)[:3]
        summary = '. '.join([sent for _, sent in top_sentences])
        
        return summary[:500]  # Limit summary length
    
    def _calculate_importance_score(self, messages: List[Dict]) -> float:
        """Calculate importance score for messages"""
        # Simple scoring based on message characteristics
        score = 0.0
        
        for msg in messages:
            content = msg.get("message", "").lower()
            
            # High importance keywords
            important_keywords = [
                "critical", "urgent", "important", "deadline", "issue", "problem",
                "decision", "milestone", "requirement", "architecture", "design"
            ]
            
            score += sum(1 for keyword in important_keywords if keyword in content)
            
            # Message length bonus
            score += min(len(content.split()) / 20, 1.0)
        
        return min(score / len(messages), 1.0) if messages else 0.0
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from text (simplified)"""
        # Simple keyword-based topic extraction
        topic_keywords = {
            "database": ["database", "sql", "query", "schema", "table"],
            "api": ["api", "endpoint", "request", "response", "rest"],
            "security": ["security", "auth", "authentication", "authorization"],
            "performance": ["performance", "optimization", "speed", "cache"],
            "ui": ["ui", "interface", "design", "user", "frontend"],
            "testing": ["test", "testing", "qa", "quality", "bug"],
            "deployment": ["deploy", "deployment", "production", "server"],
            "planning": ["plan", "planning", "schedule", "timeline", "milestone"]
        }
        
        text_lower = text.lower()
        topics = []
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def add_message(self, 
                   content: str, 
                   project_id: str,
                   conversation_id: str,
                   sender: str,
                   agent_id: Optional[str] = None,
                   message_type: str = "general") -> str:
        """Add message with intelligent buffering and summarization"""
        
        # Create message object
        message_id = f"msg_{int(time.time())}_{hash(content) % 10000}"
        message = {
            "id": message_id,
            "content": content,
            "project_id": project_id,
            "conversation_id": conversation_id,
            "sender": sender,
            "agent_id": agent_id,
            "message_type": message_type,
            "timestamp": datetime.now().isoformat(),
            "tokens": self._estimate_tokens(content)
        }
        
        # Store raw message
        self.raw_messages[message_id] = message
        
        # Add to conversation buffer
        self.conversation_buffers[conversation_id].append(message)
        
        # Check if we need to summarize
        if self._should_summarize_conversation(conversation_id):
            self._process_conversation_buffer(conversation_id)
        
        # Update project memory index
        if project_id not in self.project_memories:
            self.project_memories[project_id] = []
        self.project_memories[project_id].append(message_id)
        
        # Add to FAISS index
        embedding = self._get_embedding_cached(content)
        self.message_index.add(embedding.reshape(1, -1))
        
        return message_id
    
    def _process_conversation_buffer(self, conversation_id: str):
        """Process conversation buffer - summarize old messages"""
        buffer = self.conversation_buffers[conversation_id]
        
        if len(buffer) < self.summary_threshold:
            return
        
        # Take first half of buffer for summarization
        to_summarize = buffer[:len(buffer)//2]
        remaining = buffer[len(buffer)//2:]
        
        # Create summary
        summary = self._summarize_conversation_chunk(to_summarize)
        
        if summary:
            # Store summary
            self.conversation_summaries[summary.id] = summary
            
            # Add summary to FAISS index
            if summary.embedding is not None:
                self.summary_index.add(summary.embedding.reshape(1, -1))
            
            logger.info(f"Summarized {len(to_summarize)} messages for conversation {conversation_id}")
        
        # Update buffer with remaining messages
        self.conversation_buffers[conversation_id] = remaining
    
    def get_context_window(self, 
                          project_id: str,
                          conversation_id: str,
                          query: str,
                          max_tokens: int = 3000) -> ContextWindow:
        """Get optimized context window for query"""
        
        # Get recent messages from buffer
        recent_messages = self.conversation_buffers.get(conversation_id, [])[-10:]
        
        # Get relevant summaries using semantic search
        relevant_summaries = self._search_relevant_summaries(
            query, project_id, limit=5
        )
        
        # Build context window
        context_window = ContextWindow(
            recent_messages=recent_messages,
            relevant_summaries=relevant_summaries,
            total_tokens=0,
            max_tokens=max_tokens
        )
        
        # Calculate total tokens
        for msg in recent_messages:
            context_window.total_tokens += msg.get("tokens", 0)
        
        for summary in relevant_summaries:
            context_window.total_tokens += self._estimate_tokens(summary.summary)
        
        # Trim if exceeds max tokens
        if context_window.total_tokens > max_tokens:
            context_window = self._trim_context_window(context_window, max_tokens)
        
        return context_window
    
    def _search_relevant_summaries(self, 
                                  query: str, 
                                  project_id: str,
                                  limit: int = 5) -> List[ConversationSummary]:
        """Search for relevant conversation summaries"""
        
        if not self.conversation_summaries:
            return []
        
        # Get query embedding
        query_embedding = self._get_embedding_cached(query)
        
        # Search in summary index
        try:
            similarities, indices = self.summary_index.search(
                query_embedding.reshape(1, -1), 
                min(limit, len(self.conversation_summaries))
            )
            
            # Get summaries
            summary_ids = list(self.conversation_summaries.keys())
            relevant_summaries = []
            
            for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
                if idx < len(summary_ids) and similarity > 0.3:  # Threshold for relevance
                    summary_id = summary_ids[idx]
                    relevant_summaries.append(self.conversation_summaries[summary_id])
            
            return relevant_summaries
            
        except Exception as e:
            logger.error(f"Error searching summaries: {e}")
            return []
    
    def _trim_context_window(self, context_window: ContextWindow, max_tokens: int) -> ContextWindow:
        """Trim context window to fit token limit"""
        
        # Prioritize recent messages
        trimmed_messages = []
        trimmed_summaries = []
        current_tokens = 0
        
        # First, add recent messages (highest priority)
        for msg in reversed(context_window.recent_messages):
            msg_tokens = msg.get("tokens", 0)
            if current_tokens + msg_tokens <= max_tokens * 0.7:  # 70% for recent messages
                trimmed_messages.insert(0, msg)
                current_tokens += msg_tokens
            else:
                break
        
        # Then add relevant summaries
        for summary in context_window.relevant_summaries:
            summary_tokens = self._estimate_tokens(summary.summary)
            if current_tokens + summary_tokens <= max_tokens:
                trimmed_summaries.append(summary)
                current_tokens += summary_tokens
            else:
                break
        
        return ContextWindow(
            recent_messages=trimmed_messages,
            relevant_summaries=trimmed_summaries,
            total_tokens=current_tokens,
            max_tokens=max_tokens
        )
    
    def generate_enhanced_context(self, 
                                 project_id: str,
                                 conversation_id: str,
                                 query: str,
                                 agent_id: Optional[str] = None) -> str:
        """Generate enhanced context string for LLM"""
        
        # Get optimized context window
        context_window = self.get_context_window(project_id, conversation_id, query)
        
        # Build context string
        context_parts = []
        
        # Add relevant summaries first
        if context_window.relevant_summaries:
            context_parts.append("RELEVANT CONTEXT FROM PAST CONVERSATIONS:")
            for summary in context_window.relevant_summaries:
                topics_str = ", ".join(summary.topics) if summary.topics else "general"
                context_parts.append(f"[{summary.timestamp.strftime('%Y-%m-%d')}] Topics: {topics_str}")
                context_parts.append(f"Summary: {summary.summary}")
                context_parts.append("")
        
        # Add recent messages
        if context_window.recent_messages:
            context_parts.append("RECENT CONVERSATION:")
            for msg in context_window.recent_messages:
                sender = msg.get("sender", "User")
                content = msg.get("content", "")
                context_parts.append(f"{sender}: {content}")
            context_parts.append("")
        
        # Add token usage info
        context_parts.append(f"[Context: {context_window.total_tokens} tokens]")
        
        return "\n".join(context_parts)
    
    def batch_add_messages(self, messages: List[Dict]) -> List[str]:
        """Add multiple messages in batch for efficiency"""
        message_ids = []
        
        for msg_data in messages:
            message_id = self.add_message(
                content=msg_data["content"],
                project_id=msg_data["project_id"],
                conversation_id=msg_data["conversation_id"],
                sender=msg_data["sender"],
                agent_id=msg_data.get("agent_id"),
                message_type=msg_data.get("message_type", "general")
            )
            message_ids.append(message_id)
        
        return message_ids
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory system statistics"""
        total_messages = len(self.raw_messages)
        total_summaries = len(self.conversation_summaries)
        total_projects = len(self.project_memories)
        
        # Calculate token usage
        total_tokens = sum(msg.get("tokens", 0) for msg in self.raw_messages.values())
        
        return {
            "total_messages": total_messages,
            "total_summaries": total_summaries,
            "total_projects": total_projects,
            "total_tokens": total_tokens,
            "cache_size": len(self.embedding_cache),
            "memory_efficiency": f"{total_summaries / max(total_messages, 1):.2%}"
        }
    
    def cleanup_old_data(self, days_old: int = 30):
        """Clean up old data to manage memory"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        # Clean old messages
        old_message_ids = [
            msg_id for msg_id, msg in self.raw_messages.items()
            if datetime.fromisoformat(msg["timestamp"]) < cutoff_date
        ]
        
        for msg_id in old_message_ids:
            del self.raw_messages[msg_id]
        
        # Clean old summaries
        old_summary_ids = [
            summary_id for summary_id, summary in self.conversation_summaries.items()
            if summary.timestamp < cutoff_date
        ]
        
        for summary_id in old_summary_ids:
            del self.conversation_summaries[summary_id]
        
        logger.info(f"Cleaned {len(old_message_ids)} old messages and {len(old_summary_ids)} old summaries")
    
    def wait_for_rate_limit(self):
        """Wait for rate limit before making API call"""
        self.rate_limiter.wait_if_needed()
