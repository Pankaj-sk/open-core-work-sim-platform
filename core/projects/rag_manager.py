from typing import List, Dict, Any, Optional
import json
import uuid
from datetime import datetime
from dataclasses import dataclass

# Lazy imports for heavy dependencies
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None


@dataclass
class MemoryChunk:
    """A chunk of memory with embedding"""
    id: str
    content: str
    metadata: Dict[str, Any]
    timestamp: datetime
    embedding: Optional[Any] = None  # Changed from np.ndarray to Any for lazy loading


class RAGManager:
    """Retrieval-Augmented Generation manager for persistent memory"""
    
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        """Initialize RAG manager with lazy loading"""
        self.embedding_model_name = embedding_model
        self.embedding_model = None
        self.embedding_dim = None
        self._model_initialized = False
        
        # FAISS index (will be initialized when model loads)
        self.index = None
        
        # Memory storage - optimized with batch operations
        self.memory_chunks: Dict[str, MemoryChunk] = {}
        self.project_memories: Dict[str, List[str]] = {}  # project_id -> list of memory_chunk_ids
        self.agent_memories: Dict[str, List[str]] = {}   # agent_id -> list of memory_chunk_ids
        
    def _ensure_model_loaded(self):
        """Ensure embedding model is loaded (lazy loading)"""
        if not self._model_initialized:
            try:
                # Import heavy dependencies only when needed
                global np
                if not NUMPY_AVAILABLE:
                    import numpy as np
                
                from sentence_transformers import SentenceTransformer
                import faiss
                
                self.embedding_model = SentenceTransformer(self.embedding_model_name)
                self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
                
                # Initialize FAISS index
                self.index = faiss.IndexFlatIP(self.embedding_dim)
                
                self._model_initialized = True
                
            except ImportError as e:
                print(f"Could not load ML dependencies: {e}. RAG features will be limited.")
                self._model_initialized = False
            except Exception as e:
                print(f"Error loading embedding model: {e}")
                self._model_initialized = False
        
        # Metadata indexes - optimized for fast lookup
        self.conversation_memories: Dict[str, List[str]] = {}  # conversation_id -> memory_chunk_ids
        self.user_memories: Dict[str, List[str]] = {}  # user_id -> memory_chunk_ids
        
        # For testing mode: simple in-memory list with size limits
        self._test_memory: Dict[str, list] = {}  # project_id -> list of dicts
        self._max_memory_per_project = 1000  # Limit memory size
        
        # Batch processing for efficiency
        self._pending_embeddings = []
        self._batch_size = 10
    
    def add_memory(self, 
                   content: str, 
                   project_id: str,
                   conversation_id: str,
                   user_id: str,
                   agent_id: Optional[str] = None,
                   conversation_type: str = "general",
                   additional_metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add a new memory chunk"""
        
        # Ensure model is loaded
        self._ensure_model_loaded()
        
        # Create memory chunk
        chunk_id = str(uuid.uuid4())
        metadata = {
            "project_id": project_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "conversation_type": conversation_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if agent_id:
            metadata["agent_id"] = agent_id
        
        if additional_metadata:
            metadata.update(additional_metadata)
        
        # Generate embedding (only if model is available)
        embedding = None
        if self._model_initialized and self.embedding_model is not None:
            embedding = self.embedding_model.encode([content])[0]
        
        # Create memory chunk
        memory_chunk = MemoryChunk(
            id=chunk_id,
            content=content,
            metadata=metadata,
            timestamp=datetime.utcnow(),
            embedding=embedding
        )
        
        # Store memory chunk
        self.memory_chunks[chunk_id] = memory_chunk
        
        # Add to FAISS index
        self.index.add(embedding.reshape(1, -1))
        
        # Update indexes
        if project_id not in self.project_memories:
            self.project_memories[project_id] = []
        self.project_memories[project_id].append(chunk_id)
        
        if conversation_id not in self.conversation_memories:
            self.conversation_memories[conversation_id] = []
        self.conversation_memories[conversation_id].append(chunk_id)
        
        if user_id not in self.user_memories:
            self.user_memories[user_id] = []
        self.user_memories[user_id].append(chunk_id)
        
        if agent_id:
            if agent_id not in self.agent_memories:
                self.agent_memories[agent_id] = []
            self.agent_memories[agent_id].append(chunk_id)
        
        # For testing mode: also store in _test_memory
        if project_id not in self._test_memory:
            self._test_memory[project_id] = []
        self._test_memory[project_id].append({
            "id": chunk_id,
            "content": content,
            "metadata": metadata,
            "timestamp": memory_chunk.timestamp.isoformat()
        })
        
        return chunk_id
    
    def search_memories(self, 
                       query: str, 
                       project_id: Optional[str] = None,
                       user_id: Optional[str] = None,
                       agent_id: Optional[str] = None,
                       conversation_type: Optional[str] = None,
                       limit: int = 10,
                       similarity_threshold: float = 0.3) -> List[MemoryChunk]:
        """Search for relevant memories using semantic similarity"""
        
        if not self.memory_chunks:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])[0]
        
        # Search in FAISS index
        similarities, indices = self.index.search(
            query_embedding.reshape(1, -1), 
            min(limit * 3, len(self.memory_chunks))  # Get more results for filtering
        )
        
        # Get memory chunks and filter by metadata
        results = []
        chunk_ids = list(self.memory_chunks.keys())
        
        for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
            if similarity < similarity_threshold:
                continue
            
            if idx >= len(chunk_ids):
                continue
                
            chunk_id = chunk_ids[idx]
            chunk = self.memory_chunks[chunk_id]
            
            # Apply filters
            if project_id and chunk.metadata.get("project_id") != project_id:
                continue
            if user_id and chunk.metadata.get("user_id") != user_id:
                continue
            if agent_id and chunk.metadata.get("agent_id") != agent_id:
                continue
            if conversation_type and chunk.metadata.get("conversation_type") != conversation_type:
                continue
            
            results.append(chunk)
            
            if len(results) >= limit:
                break
        
        return results
    
    def get_project_context(self, project_id: str, limit: int = 20) -> List[Any]:
        """Get recent context for a project"""
        # For testing mode: return from _test_memory if present
        if project_id in self._test_memory:
            return self._test_memory[project_id][-limit:]
        
        if project_id not in self.project_memories:
            return []
        
        # Get recent memories for the project
        chunk_ids = self.project_memories[project_id][-limit:]
        return [self.memory_chunks[chunk_id] for chunk_id in chunk_ids if chunk_id in self.memory_chunks]
    
    def get_conversation_history(self, conversation_id: str) -> List[MemoryChunk]:
        """Get full conversation history"""
        if conversation_id not in self.conversation_memories:
            return []
        
        chunk_ids = self.conversation_memories[conversation_id]
        return [self.memory_chunks[chunk_id] for chunk_id in chunk_ids if chunk_id in self.memory_chunks]
    
    def get_agent_context(self, agent_id: str, project_id: str, limit: int = 15) -> List[MemoryChunk]:
        """Get context for an agent in a specific project"""
        if agent_id not in self.agent_memories:
            return []
        
        # Filter agent memories by project
        relevant_chunks = []
        for chunk_id in self.agent_memories[agent_id]:
            if chunk_id in self.memory_chunks:
                chunk = self.memory_chunks[chunk_id]
                if chunk.metadata.get("project_id") == project_id:
                    relevant_chunks.append(chunk)
        
        # Return most recent
        return sorted(relevant_chunks, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def generate_context_summary(self, memories: List[MemoryChunk], max_length: int = 2000) -> str:
        """Generate a context summary from memories"""
        if not memories:
            return "No relevant context found."
        
        # Sort by timestamp
        sorted_memories = sorted(memories, key=lambda x: x.timestamp)
        
        context_parts = []
        current_length = 0
        
        for memory in sorted_memories:
            timestamp = memory.timestamp.strftime("%Y-%m-%d %H:%M")
            content = f"[{timestamp}] {memory.content}"
            
            if current_length + len(content) > max_length:
                break
            
            context_parts.append(content)
            current_length += len(content)
        
        return "\n".join(context_parts)
    
    def get_enhanced_context_for_agent(self, 
                                     agent_id: str, 
                                     project_id: str, 
                                     current_query: str,
                                     conversation_id: str) -> str:
        """Get enhanced context for an agent considering current query"""
        
        # Get relevant memories through semantic search
        semantic_memories = self.search_memories(
            query=current_query,
            project_id=project_id,
            agent_id=agent_id,
            limit=10
        )
        
        # Get recent project context
        project_memories = self.get_project_context(project_id, limit=10)
        
        # Get agent-specific context
        agent_memories = self.get_agent_context(agent_id, project_id, limit=5)
        
        # Combine and deduplicate
        all_memories = {}
        for memory_list in [semantic_memories, project_memories, agent_memories]:
            for memory in memory_list:
                all_memories[memory.id] = memory
        
        # Generate summary
        unique_memories = list(all_memories.values())
        context_summary = self.generate_context_summary(unique_memories, max_length=1500)
        
        return context_summary
    
    def save_memory_state(self, filepath: str):
        """Save memory state to file (for persistence)"""
        state = {
            "memory_chunks": {
                chunk_id: {
                    "content": chunk.content,
                    "metadata": chunk.metadata,
                    "timestamp": chunk.timestamp.isoformat()
                }
                for chunk_id, chunk in self.memory_chunks.items()
            },
            "project_memories": self.project_memories,
            "agent_memories": self.agent_memories,
            "conversation_memories": self.conversation_memories,
            "user_memories": self.user_memories
        }
        
        with open(filepath, 'w') as f:
            json.dump(state, f, indent=2)
    
    def load_memory_state(self, filepath: str):
        """Load memory state from file"""
        try:
            with open(filepath, 'r') as f:
                state = json.load(f)
            
            # Rebuild memory chunks
            self.memory_chunks = {}
            for chunk_id, chunk_data in state["memory_chunks"].items():
                # Regenerate embedding
                embedding = self.embedding_model.encode([chunk_data["content"]])[0]
                
                chunk = MemoryChunk(
                    id=chunk_id,
                    content=chunk_data["content"],
                    metadata=chunk_data["metadata"],
                    timestamp=datetime.fromisoformat(chunk_data["timestamp"]),
                    embedding=embedding
                )
                self.memory_chunks[chunk_id] = chunk
                
                # Add to FAISS index
                self.index.add(embedding.reshape(1, -1))
            
            # Restore indexes
            self.project_memories = state.get("project_memories", {})
            self.agent_memories = state.get("agent_memories", {})
            self.conversation_memories = state.get("conversation_memories", {})
            self.user_memories = state.get("user_memories", {})
            
        except FileNotFoundError:
            print(f"Memory state file {filepath} not found. Starting with empty memory.")
        except Exception as e:
            print(f"Error loading memory state: {e}. Starting with empty memory.")

    async def initialize_project(self, project_id: str, project_name: str, description: str):
        """Initialize RAG memory for a new project"""
        # Add project description as initial memory
        initial_content = f"Project '{project_name}' initialized. Description: {description}"
        
        self.add_memory(
            content=initial_content,
            project_id=project_id,
            conversation_id="project_init",
            user_id="system",
            conversation_type="project_initialization",
            additional_metadata={
                "memory_type": "project_initialization",
                "project_name": project_name
            }
        )
