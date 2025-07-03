"""
ChatGPT-like Agent Manager with Advanced Memory Optimizations
Implements API key rotation, smart caching, batch processing, and memory cleanup
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta
from ..config import settings
from ..persona_behavior import PersonaBehaviorManager
from ..memory.enhanced_rag import EnhancedRAGManager
from .manager import AgentPersona  # Import from manager module
import logging
import time
import threading
import hashlib
import json
from functools import lru_cache
from collections import defaultdict, deque
import random

logger = logging.getLogger(__name__)

class APIKeyRotator:
    """Manages API key rotation to avoid rate limits"""
    
    def __init__(self):
        self.google_keys = self._load_google_keys()
        self.openai_keys = self._load_openai_keys()
        self.anthropic_keys = self._load_anthropic_keys()
        
        self.current_google_index = 0
        self.current_openai_index = 0
        self.current_anthropic_index = 0
        
        self.key_usage_counts = defaultdict(int)
        self.key_last_used = defaultdict(float)
        self.max_requests_per_key = 50  # Per hour
        
    def _load_google_keys(self) -> List[str]:
        """Load Google API keys from settings"""
        keys = []
        if hasattr(settings, 'google_api_key') and settings.google_api_key:
            keys.append(settings.google_api_key)
        if hasattr(settings, 'google_api_key_2') and settings.google_api_key_2:
            keys.append(settings.google_api_key_2)
        if hasattr(settings, 'google_api_key_3') and settings.google_api_key_3:
            keys.append(settings.google_api_key_3)
        return [key for key in keys if key and key != "your-second-google-api-key" and key != "your-third-google-api-key"]
    
    def _load_openai_keys(self) -> List[str]:
        """Load OpenAI API keys from settings"""
        keys = []
        if hasattr(settings, 'openai_api_key') and settings.openai_api_key:
            keys.append(settings.openai_api_key)
        if hasattr(settings, 'openai_api_key_2') and settings.openai_api_key_2:
            keys.append(settings.openai_api_key_2)
        if hasattr(settings, 'openai_api_key_3') and settings.openai_api_key_3:
            keys.append(settings.openai_api_key_3)
        return [key for key in keys if key and key != "your-openai-key" and key != "your-second-openai-key" and key != "your-third-openai-key"]
    
    def _load_anthropic_keys(self) -> List[str]:
        """Load Anthropic API keys from settings"""
        keys = []
        if hasattr(settings, 'anthropic_api_key') and settings.anthropic_api_key:
            keys.append(settings.anthropic_api_key)
        if hasattr(settings, 'anthropic_api_key_2') and settings.anthropic_api_key_2:
            keys.append(settings.anthropic_api_key_2)
        if hasattr(settings, 'anthropic_api_key_3') and settings.anthropic_api_key_3:
            keys.append(settings.anthropic_api_key_3)
        return [key for key in keys if key and key != "your-anthropic-key" and key != "your-second-anthropic-key" and key != "your-third-anthropic-key"]
    
    def get_google_key(self) -> Optional[str]:
        """Get next available Google API key"""
        if not self.google_keys:
            return None
            
        # Find key with lowest usage in last hour
        current_time = time.time()
        available_keys = []
        
        for i, key in enumerate(self.google_keys):
            last_used = self.key_last_used.get(f"google_{i}", 0)
            if current_time - last_used > 3600:  # Reset hourly
                self.key_usage_counts[f"google_{i}"] = 0
            
            if self.key_usage_counts[f"google_{i}"] < self.max_requests_per_key:
                available_keys.append((i, key))
        
        if not available_keys:
            # All keys exhausted, wait or use round-robin
            logger.warning("All Google API keys exhausted, using round-robin")
            self.current_google_index = (self.current_google_index + 1) % len(self.google_keys)
            key_id = f"google_{self.current_google_index}"
        else:
            # Use key with lowest usage
            available_keys.sort(key=lambda x: self.key_usage_counts[f"google_{x[0]}"])
            self.current_google_index, _ = available_keys[0]
            key_id = f"google_{self.current_google_index}"
        
        # Update usage tracking
        self.key_usage_counts[key_id] += 1
        self.key_last_used[key_id] = current_time
        
        return self.google_keys[self.current_google_index]
    
    def get_openai_key(self) -> Optional[str]:
        """Get next available OpenAI API key"""
        if not self.openai_keys:
            return None
        
        self.current_openai_index = (self.current_openai_index + 1) % len(self.openai_keys)
        key_id = f"openai_{self.current_openai_index}"
        self.key_usage_counts[key_id] += 1
        self.key_last_used[key_id] = time.time()
        
        return self.openai_keys[self.current_openai_index]
    
    def get_anthropic_key(self) -> Optional[str]:
        """Get next available Anthropic API key"""
        if not self.anthropic_keys:
            return None
        
        self.current_anthropic_index = (self.current_anthropic_index + 1) % len(self.anthropic_keys)
        key_id = f"anthropic_{self.current_anthropic_index}"
        self.key_usage_counts[key_id] += 1
        self.key_last_used[key_id] = time.time()
        
        return self.anthropic_keys[self.current_anthropic_index]

class SmartCache:
    """LRU cache with TTL for embeddings and responses"""
    
    def __init__(self, max_size: int = 1000, ttl_hours: int = 24):
        self.max_size = max_size
        self.ttl_seconds = ttl_hours * 3600
        self.cache = {}
        self.access_times = deque()
        self.lock = threading.Lock()
    
    def _generate_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def get(self, text: str):
        """Get cached item"""
        with self.lock:
            key = self._generate_key(text)
            
            if key in self.cache:
                item, timestamp = self.cache[key]
                
                # Check TTL
                if time.time() - timestamp < self.ttl_seconds:
                    # Update access time
                    self.access_times.append((key, time.time()))
                    return item
                else:
                    # Expired
                    del self.cache[key]
            
            return None
    
    def put(self, text: str, value):
        """Put item in cache"""
        with self.lock:
            key = self._generate_key(text)
            current_time = time.time()
            
            # Remove old items if cache is full
            while len(self.cache) >= self.max_size:
                if self.access_times:
                    old_key, _ = self.access_times.popleft()
                    if old_key in self.cache:
                        del self.cache[old_key]
                else:
                    # Emergency cleanup
                    oldest_key = min(self.cache.keys(), 
                                   key=lambda k: self.cache[k][1])
                    del self.cache[oldest_key]
            
            self.cache[key] = (value, current_time)
            self.access_times.append((key, current_time))
    
    def clear_expired(self):
        """Clear expired items"""
        with self.lock:
            current_time = time.time()
            expired_keys = [
                key for key, (_, timestamp) in self.cache.items()
                if current_time - timestamp >= self.ttl_seconds
            ]
            
            for key in expired_keys:
                del self.cache[key]
            
            # Clean access times
            self.access_times = deque([
                (key, access_time) for key, access_time in self.access_times
                if key in self.cache and current_time - access_time < self.ttl_seconds
            ])

class BatchProcessor:
    """Batch multiple operations for efficiency"""
    
    def __init__(self, batch_size: int = 10, max_wait_time: float = 2.0):
        self.batch_size = batch_size
        self.max_wait_time = max_wait_time
        self.pending_operations = []
        self.last_batch_time = time.time()
        self.lock = threading.Lock()
        
    def add_operation(self, operation_type: str, data: Dict) -> str:
        """Add operation to batch queue"""
        with self.lock:
            operation_id = str(uuid.uuid4())
            self.pending_operations.append({
                "id": operation_id,
                "type": operation_type,
                "data": data,
                "timestamp": time.time()
            })
            
            # Check if we should process batch
            should_process = (
                len(self.pending_operations) >= self.batch_size or
                time.time() - self.last_batch_time > self.max_wait_time
            )
            
            if should_process:
                self._process_batch()
            
            return operation_id
    
    def _process_batch(self):
        """Process current batch of operations"""
        if not self.pending_operations:
            return
        
        batch = self.pending_operations.copy()
        self.pending_operations.clear()
        self.last_batch_time = time.time()
        
        # Group by operation type
        grouped_operations = defaultdict(list)
        for op in batch:
            grouped_operations[op["type"]].append(op)
        
        # Process each group
        for op_type, operations in grouped_operations.items():
            try:
                if op_type == "embedding_generation":
                    self._batch_generate_embeddings(operations)
                elif op_type == "memory_storage":
                    self._batch_store_memories(operations)
                # Add more batch operation types as needed
            except Exception as e:
                logger.error(f"Error processing batch {op_type}: {e}")
    
    def _batch_generate_embeddings(self, operations: List[Dict]):
        """Generate embeddings in batch"""
        # Implementation for batch embedding generation
        logger.info(f"Batch generating embeddings for {len(operations)} operations")
    
    def _batch_store_memories(self, operations: List[Dict]):
        """Store memories in batch"""
        # Implementation for batch memory storage
        logger.info(f"Batch storing memories for {len(operations)} operations")

class EnhancedAgentManager:
    """Enhanced Agent Manager with ChatGPT-like optimizations"""
    
    def __init__(self):
        # Initialize basic components
        self.agents: Dict[str, 'AgentPersona'] = self._initialize_agents()
        self.conversation_history: Dict[str, List[Dict]] = {}
        self.persona_behavior_manager = PersonaBehaviorManager()
        
        # Enhanced components
        self.enhanced_rag = EnhancedRAGManager()
        self.api_key_rotator = APIKeyRotator()
        self.smart_cache = SmartCache(
            max_size=getattr(settings, 'memory_cache_size', 1000)
        )
        self.batch_processor = BatchProcessor(
            batch_size=getattr(settings, 'memory_batch_size', 10)
        )
        
        # Configuration
        self.enable_optimizations = True
        self.cleanup_interval_hours = 6
        self.last_cleanup = time.time()
        
        # Initialize RAG-based personality and relationship context
        self._initialize_rag_context()
        
        # Start background tasks
        self._start_background_tasks()
    
    def _start_background_tasks(self):
        """Start background maintenance tasks"""
        def cleanup_task():
            while True:
                try:
                    time.sleep(self.cleanup_interval_hours * 3600)  # Sleep for hours
                    self._perform_maintenance()
                except Exception as e:
                    logger.error(f"Error in cleanup task: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
        cleanup_thread.start()
    
    def _perform_maintenance(self):
        """Perform periodic maintenance"""
        logger.info("Starting periodic maintenance...")
        
        try:
            # Clean expired cache items
            self.smart_cache.clear_expired()
            
            # Clean old memories
            cleanup_days = getattr(settings, 'memory_cleanup_days', 7)
            self.enhanced_rag.cleanup_old_data(cleanup_days)
            
            # Process any pending batches
            self.batch_processor._process_batch()
            
            # Log memory stats
            stats = self.enhanced_rag.get_memory_stats()
            logger.info(f"Memory stats: {stats}")
            
        except Exception as e:
            logger.error(f"Error during maintenance: {e}")
    
    def _initialize_agents(self) -> Dict[str, 'AgentPersona']:
        """Initialize realistic workplace AI agents"""
        # Import here to avoid circular imports
        from . import AgentPersona
        
        agents = {
            "manager_001": AgentPersona(
                id="manager_001",
                name="Sarah Johnson",
                role="Project Manager",
                personality="Friendly team leader who knows everyone personally. Always checks in on team members and connects people. Makes sure everyone feels included and valued. Naturally warm and supportive in conversations.",
                background="5 years managing this team. Knows everyone's strengths, working styles, and personal interests. Great at facilitating introductions and team building.",
                skills=["Team Leadership", "Project Coordination", "People Management", "Communication"]
            ),
            "developer_001": AgentPersona(
                id="developer_001", 
                name="Alex Chen",
                role="Senior Developer",
                personality="Experienced mentor who loves sharing knowledge with the team. Naturally encouraging and helpful. Always willing to help colleagues and explain technical concepts clearly. Patient and thorough in explanations.",
                background="8 years with the company, started as junior developer. Known for being patient with questions and helping onboard new team members.",
                skills=["Full-stack Development", "Mentoring", "Code Reviews", "Architecture"]
            ),
            "qa_001": AgentPersona(
                id="qa_001",
                name="David Kim", 
                role="QA Engineer",
                personality="Thorough but friendly quality advocate. Uses collaborative language and focuses on team success. Builds strong relationships with developers through diplomatic communication.",
                background="6 years in QA, known for catching issues early and suggesting improvements diplomatically. Well-respected by the development team.",
                skills=["Quality Assurance", "Test Planning", "Bug Reporting", "Process Improvement"]
            ),
            "designer_001": AgentPersona(
                id="designer_001",
                name="Emma Wilson",
                role="UX Designer", 
                personality="Creative collaborator who loves brainstorming with the team. Naturally curious and enthusiastic about user-centered design. Great at explaining design decisions clearly.",
                background="4 years designing user experiences. Known for being open to feedback and making design accessible to non-designers.",
                skills=["UX Design", "User Research", "Prototyping", "Design Systems"]
            ),
            "analyst_001": AgentPersona(
                id="analyst_001",
                name="Lisa Zhang",
                role="Business Analyst",
                personality="Bridge-builder between business and tech teams. Uses clear communication and excellent at translating requirements. Natural connector who helps teams understand each other.",
                background="7 years as BA, started in business operations. Known for asking the right questions and keeping projects aligned with business goals.",
                skills=["Requirements Analysis", "Process Mapping", "Stakeholder Management", "Documentation"]
            )
        }
        return agents
    
    @lru_cache(maxsize=100)
    def _get_cached_embedding(self, text: str):
        """Get embedding with caching"""
        # Check smart cache first
        cached_embedding = self.smart_cache.get(text)
        if cached_embedding is not None:
            return cached_embedding
        
        # Generate new embedding
        embedding = self.enhanced_rag._get_embedding_cached(text)
        
        # Cache it
        self.smart_cache.put(text, embedding)
        
        return embedding
    
    def chat_with_agent_optimized(self, 
                                agent_id: str, 
                                message: str, 
                                project_id: str = "default",
                                use_batch_processing: bool = True) -> str:
        """Optimized chat with advanced memory and caching"""
        
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        agent = self.agents[agent_id]
        
        try:
            # Wait for rate limit
            self.enhanced_rag.wait_for_rate_limit()
            
            # Generate optimized context
            if self.enable_optimizations:
                context = self.enhanced_rag.generate_enhanced_context(
                    project_id=project_id,
                    conversation_id=agent_id,
                    query=message,
                    agent_id=agent_id
                )
            else:
                context = self._build_basic_context(agent_id)
            
            # Build system prompt
            system_prompt = self._build_enhanced_system_prompt(agent, context)
            
            # Call model with key rotation
            response = self._call_model_with_rotation(system_prompt, message)
            
            # Store conversation in enhanced RAG
            if use_batch_processing:
                # Add to batch queue
                self.batch_processor.add_operation("memory_storage", {
                    "user_message": message,
                    "agent_response": response,
                    "project_id": project_id,
                    "agent_id": agent_id,
                    "conversation_id": agent_id
                })
            else:
                # Store immediately
                self._store_conversation_memory(message, response, project_id, agent_id)
            
            # Clean response
            cleaned_response = self._clean_agent_response(agent, response)
            
            return cleaned_response
            
        except Exception as e:
            logger.error(f"Error in optimized chat: {e}")
            return "I'm experiencing some technical difficulties. Please try again in a moment."
    
    def _call_model_with_rotation(self, system_prompt: str, user_message: str) -> str:
        """Call model API with key rotation"""
        
        # Try Google Gemini with rotation
        google_key = self.api_key_rotator.get_google_key()
        if google_key:
            try:
                return self._call_google_gemini_with_key(system_prompt, user_message, google_key)
            except Exception as e:
                logger.warning(f"Google API failed with rotated key: {e}")
        
        # Try OpenAI with rotation
        openai_key = self.api_key_rotator.get_openai_key()
        if openai_key:
            try:
                return self._call_openai_with_key(system_prompt, user_message, openai_key)
            except Exception as e:
                logger.warning(f"OpenAI API failed with rotated key: {e}")
        
        # Try Anthropic with rotation
        anthropic_key = self.api_key_rotator.get_anthropic_key()
        if anthropic_key:
            try:
                return self._call_anthropic_with_key(system_prompt, user_message, anthropic_key)
            except Exception as e:
                logger.warning(f"Anthropic API failed with rotated key: {e}")
        
        raise Exception("All API keys exhausted or unavailable")
    
    def _call_google_gemini_with_key(self, system_prompt: str, user_message: str, api_key: str) -> str:
        """Call Google Gemini with specific API key"""
        import requests
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{getattr(settings, 'gemini_model', 'gemini-1.5-flash')}:generateContent?key={api_key}"
        
        combined_prompt = f"{system_prompt}\n\nUser: {user_message}\n\nAssistant:"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": combined_prompt
                }]
            }],
            "generationConfig": {
                "temperature": getattr(settings, 'custom_model_temperature', 0.7),
                "maxOutputTokens": getattr(settings, 'custom_model_max_tokens', 150),
                "topP": 0.8,
                "topK": 10
            }
        }
        
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                if "content" in result["candidates"][0]:
                    if "parts" in result["candidates"][0]["content"]:
                        return result["candidates"][0]["content"]["parts"][0]["text"]
        
        raise Exception(f"Gemini API failed: {response.status_code}")
    
    def _call_openai_with_key(self, system_prompt: str, user_message: str, api_key: str) -> str:
        """Call OpenAI with specific API key"""
        import requests
        
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": getattr(settings, 'custom_model_max_tokens', 150),
            "temperature": getattr(settings, 'custom_model_temperature', 0.7)
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        
        raise Exception(f"OpenAI API failed: {response.status_code}")
    
    def _call_anthropic_with_key(self, system_prompt: str, user_message: str, api_key: str) -> str:
        """Call Anthropic with specific API key"""
        import requests
        
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": getattr(settings, 'custom_model_max_tokens', 150),
            "messages": [
                {"role": "user", "content": f"{system_prompt}\n\n{user_message}"}
            ]
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result["content"][0]["text"]
        
        raise Exception(f"Anthropic API failed: {response.status_code}")
    
    def _store_conversation_memory(self, user_message: str, agent_response: str, 
                                 project_id: str, agent_id: str):
        """Store conversation in memory system"""
        try:
            # Store user message
            self.enhanced_rag.add_message(
                content=user_message,
                project_id=project_id,
                conversation_id=agent_id,
                sender="user",
                message_type="chat"
            )
            
            # Store agent response
            self.enhanced_rag.add_message(
                content=agent_response,
                project_id=project_id,
                conversation_id=agent_id,
                sender=self.agents[agent_id].name,
                agent_id=agent_id,
                message_type="response"
            )
            
        except Exception as e:
            logger.error(f"Failed to store conversation memory: {e}")
    
    def _build_basic_context(self, agent_id: str) -> str:
        """Build basic context (fallback)"""
        if agent_id not in self.conversation_history:
            return "This is the start of a new conversation."
        
        history = self.conversation_history[agent_id][-5:]  # Last 5 messages
        context_lines = []
        for msg in history:
            if msg["sender"] == "user":
                context_lines.append(f"User: {msg['message']}")
            else:
                context_lines.append(f"You: {msg['message']}")
        
        return "\n".join(context_lines)
    
    def _build_enhanced_system_prompt(self, agent, context: str) -> str:
        """Build enhanced system prompt with RAG-based personality and relationship context"""
        
        # RAG system already provides comprehensive context including:
        # - Emotional states from past conversations
        # - Relationship dynamics with other agents
        # - Personality traits learned from interactions
        # - Conversation history and emotional patterns
        
        # Build the enhanced prompt
        return f"""You are {agent.name}, a {agent.role} working with a close-knit team.

YOUR CHARACTER:
{agent.personality}

BACKGROUND & EXPERTISE:
{agent.background}
Skills: {', '.join(agent.skills)}

CONVERSATION CONTEXT & MEMORY:
{context}

RESPONSE GUIDELINES:
- You are {agent.name}, NOT an AI assistant - respond as this real person
- NEVER start with artificial greetings like "Hey there! [Name] here"
- DO NOT include your name in the response - the UI shows who is speaking
- Keep responses conversational and natural (2-4 sentences typically)
- Show familiarity with your teammates based on conversation history
- Express genuine emotions and reactions based on past interactions and current context
- Your personality, relationships, and emotional state are preserved in conversation memory
- Use natural, authentic language - not corporate or robotic speak
- Always finish your complete thought. Never end abruptly or mid-sentence

CRITICAL FORMATTING:
- DO NOT start with your name or artificial greetings
- Jump straight into your natural response to the message
- The UI already shows you are the sender - focus on the content"""
    
    def _clean_agent_response(self, agent, response: str) -> str:
        """Clean up agent response"""
        if not response:
            return response
            
        # Remove artificial patterns
        artificial_patterns = [
            f"Hey there! {agent.name} here.",
            f"Hi! {agent.name} here.",
            f"Hello! {agent.name} here.",
            f"{agent.name} here!",
        ]
        
        cleaned_response = response.strip()
        
        for pattern in artificial_patterns:
            if cleaned_response.lower().startswith(pattern.lower()):
                cleaned_response = cleaned_response[len(pattern):].strip()
                break
        
        # Fix encoding issues
        cleaned_response = cleaned_response.replace('â', '–')
        cleaned_response = cleaned_response.replace('â€™', "'")
        cleaned_response = cleaned_response.replace('â€œ', '"')
        cleaned_response = cleaned_response.replace('â€', '"')
        
        return cleaned_response if cleaned_response else "I'm not sure how to respond to that right now."
    
    def get_memory_analytics(self) -> Dict[str, Any]:
        """Get comprehensive memory analytics"""
        rag_stats = self.enhanced_rag.get_memory_stats()
        
        return {
            "rag_memory": rag_stats,
            "cache_stats": {
                "cache_size": len(self.smart_cache.cache),
                "max_cache_size": self.smart_cache.max_size,
                "cache_efficiency": len(self.smart_cache.cache) / self.smart_cache.max_size
            },
            "api_key_stats": {
                "google_keys": len(self.api_key_rotator.google_keys),
                "openai_keys": len(self.api_key_rotator.openai_keys),
                "anthropic_keys": len(self.api_key_rotator.anthropic_keys),
                "total_api_usage": sum(self.api_key_rotator.key_usage_counts.values())
            },
            "batch_processor": {
                "pending_operations": len(self.batch_processor.pending_operations),
                "batch_size": self.batch_processor.batch_size
            }
        }
    
    def force_cleanup(self):
        """Force immediate cleanup and maintenance"""
        self._perform_maintenance()
    
    # Backward compatibility methods
    def chat_with_agent(self, agent_id: str, message: str, project_id: str = None, **kwargs) -> str:
        """Backward compatible chat method"""
        return self.chat_with_agent_optimized(agent_id, message, project_id or "default")
    
    def get_available_agents(self) -> List[Dict]:
        """Get list of all available agents"""
        return [
            {
                "id": agent.id,
                "name": agent.name,
                "role": agent.role,
                "is_available": agent.is_available
            }
            for agent in self.agents.values()
        ]
    
    def _initialize_rag_context(self):
        """Initialize RAG-based personality and relationship context"""
        try:
            # The RAG system automatically learns and maintains:
            # - Agent personalities from conversation patterns
            # - Relationship dynamics from interaction history
            # - Emotional states from past conversations
            # - Workplace dynamics from team interactions
            
            # Pre-seed some basic personality context for new agents
            agent_contexts = {
                "manager_001": "Sarah is a diplomatic team manager who balances leadership with mentorship. She tends to be deadline-conscious but supportive.",
                "developer_001": "Alex is a perfectionist senior developer who communicates directly. He values technical excellence and can be blunt when discussing code quality.",
                "qa_001": "David is a methodical QA engineer focused on process improvement. He's detail-oriented and sometimes has tension with developers over bug reports.",
                "designer_001": "Emma is an optimistic designer with creative energy. She's social and collaborative, working well with both developers and stakeholders.",
                "analyst_001": "Lisa is a diplomatic business analyst who focuses on data-driven decisions. She's quietly focused and sometimes competes with QA over process ownership."
            }
            
            # Store initial context in RAG for new conversations
            for agent_id, context in agent_contexts.items():
                if agent_id in self.agents:
                    self.enhanced_rag.store_conversation_memory(
                        project_id="personality_init",
                        conversation_id=agent_id,
                        user_message="System initialization",
                        agent_response=f"Personality context: {context}",
                        agent_id=agent_id
                    )
            
            logger.info("RAG-based personality context initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing RAG context: {e}")
