from typing import Dict, List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime
from ..config import settings
from ..persona_behavior import PersonaBehaviorManager
import logging

# Lazy import for heavy RAG manager
def get_rag_manager():
    from ..memory.enhanced_rag import EnhancedRAGManager
    return EnhancedRAGManager()


class AgentPersona(BaseModel):
    id: str
    name: str
    role: str
    personality: str
    background: str
    skills: List[str]
    is_available: bool = True


class AgentManager:
    def __init__(self):
        self.agents: Dict[str, AgentPersona] = self._initialize_agents()
        self.conversation_history: Dict[str, List[Dict]] = {}
        self.persona_behavior_manager = PersonaBehaviorManager()
        self.logger = logging.getLogger(__name__)
        
        # Enhanced RAG memory system
        self.enhanced_rag = None  # Lazy-loaded
        
        # Memory optimization settings
        self.enable_context_optimization = True
        self.max_context_tokens = 3000
    
    def _initialize_agents(self) -> Dict[str, AgentPersona]:
        """Initialize realistic workplace AI agents"""
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
    
    def get_agent(self, agent_id: str) -> AgentPersona:
        """Get detailed information about a specific agent"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        return self.agents[agent_id]
    
    def chat_with_agent(self, agent_id: str, message: str, project_id: str = None, meeting_type: str = "casual_chat", user_behavior_history: List[Dict] = None) -> str:
        """Send a message to an agent and get response with persona behavior adaptation"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        agent = self.agents[agent_id]
        
        # Initialize conversation history if needed
        if agent_id not in self.conversation_history:
            self.conversation_history[agent_id] = []
        
        # Add message to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": "user",
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate response with persona behavior if project context is available
        if project_id and user_behavior_history is not None:
            response = self._generate_persona_aware_response(agent, message, project_id, meeting_type, user_behavior_history)
        else:
            response = self._generate_agent_response(agent, message)
        
        # Add response to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": agent.name,
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def chat_with_agent_simple(self, agent_id: str, message: str) -> str:
        """Simple chat method for backward compatibility"""
        return self.chat_with_agent(agent_id, message)
    
    def chat_with_agent_enhanced(self, agent_id: str, message: str, enhanced_system_context: str = None) -> str:
        """Enhanced chat with agent using persona behavior context"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        agent = self.agents[agent_id]
        
        # Initialize conversation history if needed
        if agent_id not in self.conversation_history:
            self.conversation_history[agent_id] = []
        
        # Add message to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": "user",
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate response using enhanced context
        response = self._generate_agent_response_enhanced(agent, message, enhanced_system_context)
        
        # Add response to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": agent.name,
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def _generate_persona_aware_response(self, agent: AgentPersona, message: str, project_id: str, meeting_type: str, user_behavior_history: List[Dict]) -> str:
        """Generate response with persona behavior awareness"""
        try:
            # Get behavior adaptation
            behavior_profile = self.persona_behavior_manager.adapt_persona_behavior(
                agent.id, user_behavior_history, meeting_type, project_id
            )
            
            # Get conversation context
            conversation_context = self._build_conversation_context(agent.id)
            
            # Build enhanced system prompt with behavior instructions
            system_prompt = self._build_persona_aware_system_prompt(agent, conversation_context, behavior_profile, meeting_type)
            
            # Call model API
            response = self._call_custom_model(system_prompt, message)
            
            # Clean up response to remove artificial patterns
            response = self._clean_agent_response(agent, response)
            
            return response
            
        except Exception as e:
            print(f"Error in persona-aware response generation: {e}")
            # Fallback to regular response generation
            return self._generate_agent_response(agent, message)
    
    def _generate_agent_response_enhanced(self, agent: AgentPersona, message: str, enhanced_system_context: str = None) -> str:
        """Generate enhanced response using persona behavior context"""
        try:
            # Get conversation history for context
            conversation_context = self._build_conversation_context(agent.id)
            
            # Use enhanced system context if provided, otherwise use standard
            if enhanced_system_context:
                system_prompt = enhanced_system_context
            else:
                system_prompt = self._build_enhanced_system_prompt(agent, conversation_context)
            
            # Call your custom model API
            response = self._call_custom_model(system_prompt, message)
            
            # Clean up response to remove artificial patterns
            response = self._clean_agent_response(agent, response)
            
            return response
            
        except Exception as e:
            print(f"Error calling custom model: {e}")
            return f"I'm unable to respond right now due to API connectivity issues. Please check your API configuration and try again."
    
    def _build_persona_aware_system_prompt(self, agent: AgentPersona, conversation_context: str, behavior_profile: Dict, meeting_type: str) -> str:
        """Build system prompt enhanced with persona behavior"""
        
        # Start with the base enhanced prompt
        base_prompt = self._build_enhanced_system_prompt(agent, conversation_context)
        
        # Add behavior-specific instructions
        behavior_instructions = behavior_profile.get('behavioral_instructions', [])
        meeting_context = behavior_profile.get('meeting_context', {})
        user_adaptations = behavior_profile.get('user_adaptations', [])
        
        behavioral_enhancement = f"""

CURRENT MEETING CONTEXT:
Meeting Type: {meeting_type}
Tone: {meeting_context.get('tone', 'professional')}
Energy Level: {meeting_context.get('energy_level', 'medium')}
Focus: {meeting_context.get('focus', 'general discussion')}

USER BEHAVIOR ADAPTATIONS:
"""
        
        if user_adaptations:
            for adaptation in user_adaptations:
                behavioral_enhancement += f"- {adaptation['trait']}: {adaptation['adaptation']}\n"
        else:
            behavioral_enhancement += "- No specific adaptations needed - user seems professional\n"
        
        behavioral_enhancement += """
BEHAVIORAL INSTRUCTIONS FOR THIS CONVERSATION:
"""
        for instruction in behavior_instructions:
            behavioral_enhancement += f"- {instruction}\n"
        
        behavioral_enhancement += """
CRITICAL FORMATTING RULES:
- DO NOT start with your name or artificial greetings like "Hey there! [Name] here"
- DO NOT include your name in the response - the UI shows who is speaking
- Jump straight into your natural response to the message
- Respond directly to what was asked without unnecessary introductions

Remember: You are a real person in this workplace, not an AI. Respond naturally based on the context above while staying true to your personality and role."""
        
        return base_prompt + behavioral_enhancement
    
    def _generate_agent_response(self, agent: AgentPersona, message: str) -> str:
        """Generate a response using custom model API with enhanced memory and rate limiting"""
        try:
            # Wait for rate limit before making API call
            if self.enhanced_rag is not None:
                self.enhanced_rag.wait_for_rate_limit()
            
            # Get conversation history for context
            if self.enhanced_rag is not None and self.enable_context_optimization:
                # Use enhanced context generation
                conversation_context = self.enhanced_rag.generate_enhanced_context(
                    project_id="default",  # You can pass actual project_id here
                    conversation_id=agent.id,
                    query=message,
                    agent_id=agent.id
                )
            else:
                # Fallback to basic context
                conversation_context = self._build_conversation_context(agent.id)
            
            # Build enhanced prompt with optimized context
            system_prompt = self._build_enhanced_system_prompt(agent, conversation_context)
            
            # Call your custom model API here
            response = self._call_custom_model(system_prompt, message)
            
            # Store message in enhanced RAG if available
            if self.enhanced_rag is not None:
                try:
                    # Store user message
                    self.enhanced_rag.add_message(
                        content=message,
                        project_id="default",
                        conversation_id=agent.id,
                        sender="user",
                        message_type="chat"
                    )
                    
                    # Store agent response
                    self.enhanced_rag.add_message(
                        content=response,
                        project_id="default",
                        conversation_id=agent.id,
                        sender=agent.name,
                        agent_id=agent.id,
                        message_type="response"
                    )
                except Exception as e:
                    logging.warning(f"Failed to store in enhanced RAG: {e}")
            
            # Clean up response to remove artificial patterns
            response = self._clean_agent_response(agent, response)
            
            return response
            
        except Exception as e:
            print(f"Error calling custom model: {e}")
            # If all APIs fail, return a clear error message instead of hardcoded responses
            return f"I'm unable to respond right now due to API connectivity issues. Please check your API configuration and try again."
    
    def _call_custom_model(self, system_prompt: str, user_message: str) -> str:
        """
        Call your model API (Google Gemini gets priority for now)
        Priority: Google Gemini > OpenAI > Anthropic > Azure > Hugging Face > Ollama > Custom AWS API
        """
        import requests
        
        print(f"[DEBUG] Calling custom model API...")
        print(f"[DEBUG] Google API Key available: {bool(settings.google_api_key)}")
        print(f"[DEBUG] OpenAI API Key available: {bool(settings.openai_api_key)}")
        
        # Priority 1: Google Gemini (current primary API)
        if settings.google_api_key:
            try:
                print(f"[DEBUG] Trying Google Gemini API...")
                response = self._call_google_gemini(system_prompt, user_message)
                print(f"[DEBUG] Gemini response: {response[:100]}...")
                return response
            except Exception as e:
                print(f"Google Gemini failed, trying next: {e}")
        
        # Priority 2: OpenAI
        if settings.openai_api_key:
            try:
                return self._call_openai(system_prompt, user_message)
            except Exception as e:
                print(f"OpenAI failed, trying next: {e}")
        
        # Priority 3: Anthropic Claude
        if settings.anthropic_api_key:
            try:
                return self._call_anthropic(system_prompt, user_message)
            except Exception as e:
                print(f"Anthropic failed, trying next: {e}")
        
        # Priority 4: Azure OpenAI
        if settings.azure_openai_key and settings.azure_openai_endpoint:
            try:
                return self._call_azure_openai(system_prompt, user_message)
            except Exception as e:
                print(f"Azure OpenAI failed, trying next: {e}")
        
        # Priority 5: Hugging Face
        if settings.huggingface_api_key:
            try:
                return self._call_huggingface(system_prompt, user_message)
            except Exception as e:
                print(f"Hugging Face failed, trying next: {e}")
        
        # Priority 6: Local Ollama
        if settings.ollama_base_url:
            try:
                return self._call_ollama(system_prompt, user_message)
            except Exception as e:
                print(f"Ollama failed, trying next: {e}")
        
        # Priority 7: Custom AWS API (future use)
        if settings.custom_model_api_url:
            try:
                return self._call_custom_api(system_prompt, user_message)
            except Exception as e:
                print(f"Custom AWS API failed: {e}")
        
        raise Exception("No working model API found. Please configure Google API key or another provider.")
        
    def _call_openai(self, system_prompt: str, user_message: str) -> str:
        """Call OpenAI API"""
        import requests
        
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",  # or gpt-4
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": settings.custom_model_max_tokens,
            "temperature": settings.custom_model_temperature
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                raise Exception(f"OpenAI API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling OpenAI: {e}")
    
    def _call_anthropic(self, system_prompt: str, user_message: str) -> str:
        """Call Anthropic Claude API"""
        import requests
        
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": settings.anthropic_api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": settings.claude_model,
            "max_tokens": settings.custom_model_max_tokens,
            "messages": [
                {"role": "user", "content": f"{system_prompt}\n\n{user_message}"}
            ]
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["content"][0]["text"]
            else:
                raise Exception(f"Anthropic API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling Anthropic: {e}")
    
    def _call_azure_openai(self, system_prompt: str, user_message: str) -> str:
        """Call Azure OpenAI API"""
        import requests
        
        url = f"{settings.azure_openai_endpoint}/openai/deployments/{settings.azure_openai_deployment}/chat/completions?api-version={settings.azure_openai_version}"
        headers = {
            "api-key": settings.azure_openai_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": settings.custom_model_max_tokens,
            "temperature": settings.custom_model_temperature
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                raise Exception(f"Azure OpenAI API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling Azure OpenAI: {e}")
    
    def _call_huggingface(self, system_prompt: str, user_message: str) -> str:
        """Call Hugging Face Inference API"""
        import requests
        
        url = f"https://api-inference.huggingface.co/models/{settings.huggingface_model}"
        headers = {
            "Authorization": f"Bearer {settings.huggingface_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": f"{system_prompt}\n\nUser: {user_message}\nAssistant:",
            "parameters": {
                "max_length": settings.custom_model_max_tokens,
                "temperature": settings.custom_model_temperature
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result[0]["generated_text"].split("Assistant:")[-1].strip()
            else:
                raise Exception(f"Hugging Face API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling Hugging Face: {e}")
    
    def _call_ollama(self, system_prompt: str, user_message: str) -> str:
        """Call local Ollama API"""
        import requests
        
        url = f"{settings.ollama_base_url}/api/generate"
        payload = {
            "model": settings.ollama_model,
            "prompt": f"{system_prompt}\n\nUser: {user_message}\nAssistant:",
            "stream": False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["response"]
            else:
                raise Exception(f"Ollama API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling Ollama: {e}")
    
    def _call_custom_api(self, system_prompt: str, user_message: str) -> str:
        """Call your custom AWS-hosted model API"""
        import requests
        
        # Use settings from config for custom API
        api_url = settings.custom_model_api_url
        api_key = settings.custom_model_api_key
        
        # Support different payload formats for your AWS model
        payload_format = getattr(settings, 'custom_model_payload_format', 'openai')  # default to OpenAI format
        
        if payload_format == 'openai':
            # OpenAI-compatible format
            payload = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": settings.custom_model_max_tokens,
                "temperature": settings.custom_model_temperature,
            }
            if hasattr(settings, 'custom_model_name') and settings.custom_model_name:
                payload["model"] = settings.custom_model_name
                
        elif payload_format == 'anthropic':
            # Anthropic-style format
            payload = {
                "model": getattr(settings, 'custom_model_name', 'custom-model'),
                "max_tokens": settings.custom_model_max_tokens,
                "messages": [
                    {"role": "user", "content": f"{system_prompt}\n\n{user_message}"}
                ]
            }
            
        elif payload_format == 'generic':
            # Generic format - you can customize this for your specific API
            payload = {
                "prompt": f"{system_prompt}\n\nUser: {user_message}\nAssistant:",
                "max_tokens": settings.custom_model_max_tokens,
                "temperature": settings.custom_model_temperature,
                "stop": ["\nUser:", "\nHuman:"]
            }
            
        else:
            # Custom format - you can define this in your config
            payload = {
                "system": system_prompt,
                "user_input": user_message,
                "parameters": {
                    "max_tokens": settings.custom_model_max_tokens,
                    "temperature": settings.custom_model_temperature
                }
            }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided
        if api_key:
            # Support different auth methods
            auth_method = getattr(settings, 'custom_model_auth_method', 'bearer')  # bearer, api-key, or custom
            if auth_method == 'bearer':
                headers["Authorization"] = f"Bearer {api_key}"
            elif auth_method == 'api-key':
                headers["x-api-key"] = api_key
            elif auth_method == 'custom':
                headers[getattr(settings, 'custom_model_auth_header', 'Authorization')] = api_key
        
        try:
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Try different response formats based on your API
                if "choices" in result and result["choices"]:
                    return result["choices"][0]["message"]["content"]
                elif "content" in result:
                    if isinstance(result["content"], list) and result["content"]:
                        return result["content"][0].get("text", str(result["content"][0]))
                    return str(result["content"])
                elif "response" in result:
                    return result["response"]
                elif "text" in result:
                    return result["text"]
                elif "output" in result:
                    return result["output"]
                elif "generated_text" in result:
                    return result["generated_text"]
                else:
                    # Fallback: return the whole response as string
                    return str(result)
            else:
                raise Exception(f"Custom API failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error calling custom API: {e}")
        except Exception as e:
            raise Exception(f"Error calling custom API: {e}")
    
    def get_conversation_history(self, agent_id: str) -> List[Dict]:
        """Get conversation history with a specific agent"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        return self.conversation_history.get(agent_id, [])
    
    def reset_conversation(self, agent_id: str):
        """Reset conversation history with an agent"""
        if agent_id in self.conversation_history:
            self.conversation_history[agent_id] = []
    
    def clear_all_memory(self):
        """ADMIN: Clear all agent manager memory"""
        self.conversation_history.clear()
        print("AgentManager: All conversation history cleared")
    
    def _call_google_gemini(self, system_prompt: str, user_message: str) -> str:
        """Call Google Gemini API"""
        import requests
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.google_api_key}"
        headers = {
            "Content-Type": "application/json"
        }
        
        # Combine system prompt and user message for Gemini
        combined_prompt = f"{system_prompt}\n\nUser: {user_message}\n\nAssistant:"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": combined_prompt
                }]
            }],
            "generationConfig": {
                "temperature": settings.custom_model_temperature,
                "maxOutputTokens": settings.custom_model_max_tokens,
                "topP": 0.8,
                "topK": 10
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    if "content" in result["candidates"][0]:
                        if "parts" in result["candidates"][0]["content"]:
                            return result["candidates"][0]["content"]["parts"][0]["text"]
                raise Exception("Unexpected response format from Gemini API")
            else:
                raise Exception(f"Gemini API failed: {response.status_code} - {response.text}")
        except Exception as e:
            raise Exception(f"Error calling Google Gemini: {e}")
    
    def _build_conversation_context(self, agent_id: str) -> str:
        """Build conversation history context for the agent"""
        if agent_id not in self.conversation_history:
            return "This is the start of a new conversation."
        
        history = self.conversation_history[agent_id]
        if not history:
            return "This is the start of a new conversation."
        
        # Get last 10 messages for context (to avoid token limits)
        recent_history = history[-10:] if len(history) > 10 else history
        
        context_lines = []
        for msg in recent_history:
            if msg["sender"] == "user":
                context_lines.append(f"User: {msg['message']}")
            else:
                context_lines.append(f"You: {msg['message']}")
        
        return "\n".join(context_lines)
    
    def _build_enhanced_system_prompt(self, agent: AgentPersona, conversation_context: str) -> str:
        """Build an enhanced system prompt with personality and conversation context"""
        
        # Define realistic personality traits for each role
        personality_enhancements = {
            "manager_001": {
                "communication_style": "Warm team leader who knows everyone well. Naturally connects people and facilitates collaboration. Sometimes juggles multiple priorities but always makes time for team members.",
                "typical_concerns": "Team coordination, project alignment, stakeholder communication, removing blockers, team morale and connections",
                "interaction_patterns": "Introduces team members to each other. Checks in on progress and team dynamics. Facilitates collaboration. Natural connector who brings people together.",
                "realistic_reactions": "Excited about team collaboration, concerned about silos, proactive about connecting people, appreciates when team members work well together"
            },
            "developer_001": {
                "communication_style": "Friendly technical mentor who enjoys helping colleagues. Known for taking time to explain things clearly. Sometimes gets excited about elegant solutions and new technologies.",
                "typical_concerns": "Code quality, helping team members learn, sharing knowledge, technical best practices, mentoring junior developers",
                "interaction_patterns": "Offers to help with technical challenges. Explains concepts clearly. Shares code examples. Natural teacher who enjoys helping others grow.",
                "realistic_reactions": "Enthusiastic about teaching, proud when colleagues succeed, patient with questions, excited about new technical challenges"
            },
            "qa_001": {
                "communication_style": "Collaborative quality advocate who builds relationships with developers. Uses diplomatic language and focuses on team success over finding faults. Thoughtful in approach.",
                "typical_concerns": "Quality assurance, user experience, team collaboration, early bug detection, process improvement",
                "interaction_patterns": "Suggests improvements diplomatically. Works closely with developers. Focuses on preventing issues rather than just catching them.",
                "realistic_reactions": "Appreciative of developer cooperation, excited about preventing issues, satisfied when quality improves, grateful for collaborative relationships"
            },
            "designer_001": {
                "communication_style": "Creative collaborator who loves brainstorming with the team. Great at explaining design decisions to non-designers. Values team input on design and user experience.",
                "typical_concerns": "User experience, design accessibility, creative collaboration, visual consistency, user feedback",
                "interaction_patterns": "Invites input on designs. Explains design thinking clearly. Focuses on user-centered solutions and collaborative design.",
                "realistic_reactions": "Excited about collaborative design sessions, appreciative of feedback, enthusiastic about user-centered solutions, happy when designs solve real problems"
            },
            "analyst_001": {
                "communication_style": "Bridge-builder between teams who translates business needs clearly. Excellent at connecting dots between different perspectives and helping teams understand each other.",
                "typical_concerns": "Requirements clarity, stakeholder alignment, process efficiency, connecting business and technical needs",
                "interaction_patterns": "Clarifies requirements and business context. Connects different team perspectives. Natural translator between business and technical teams.",
                "realistic_reactions": "Satisfied when requirements are clear, excited about process improvements, appreciative when teams work together effectively, pleased when solutions meet business needs"
            }
        }
        
        enhancement = personality_enhancements.get(agent.id, {
            "communication_style": "Professional and helpful",
            "typical_concerns": "General project success",
            "interaction_patterns": "Collaborative and supportive",
            "realistic_reactions": "Professional and considerate"
        })
        
        system_prompt = f"""You are {agent.name}, a {agent.role} working with a close-knit team in a realistic workplace.

TEAM CONTEXT:
You work daily with Sarah (Project Manager), Alex (Senior Developer), Emma (UX Designer), David (QA Engineer), and Lisa (Business Analyst). You know each other well and have established working relationships.

YOUR CHARACTER:
{agent.personality}

BACKGROUND & EXPERTISE:
{agent.background}
Skills: {', '.join(agent.skills)}

COMMUNICATION STYLE:
{enhancement['communication_style']}

YOUR ROLE FOCUS:
{enhancement['typical_concerns']}

HOW YOU INTERACT:
{enhancement['interaction_patterns']}

CONVERSATION HISTORY:
{conversation_context}

RESPONSE GUIDELINES:
- You are {agent.name}, NOT an AI assistant - respond as this real person
- NEVER start with artificial greetings like "Hey there! [Name] here" - respond naturally to the conversation
- DO NOT include your name in the response - the UI shows who is speaking
- Keep responses conversational and natural (2-4 sentences typically)
- Show familiarity with your teammates when relevant
- Reference shared projects, past conversations, or team dynamics when appropriate
- Express genuine workplace emotions and reactions
- Sometimes ask follow-up questions or suggest next steps
- If you're busy, mention what you're working on briefly
- Use natural, authentic language - not corporate or robotic speak
- Show your personality and working style naturally
- NEVER cut off mid-sentence - always complete your thoughts
- Be helpful but realistic about your time and current workload
- Make connections between people when it would help ("You should talk to Emma about the UX side")
- Respond directly to what was asked without unnecessary introductions

CRITICAL FORMATTING:
- DO NOT start with your name or artificial greetings
- Jump straight into your natural response to the message
- The UI already shows you are the sender - focus on the content
- Always finish your complete thought. Never end abruptly or mid-sentence."""

        return system_prompt
    
    def _clean_agent_response(self, agent: AgentPersona, response: str) -> str:
        """Clean up agent response to remove artificial patterns and agent name"""
        if not response:
            return response
            
        # Remove common artificial greeting patterns (more comprehensive)
        artificial_patterns = [
            f"Hey there! {agent.name} here.",
            f"Hi there! {agent.name} here.",
            f"Hello there! {agent.name} here.",
            f"Hi! {agent.name} here.",
            f"Hello! {agent.name} here.",
            f"Hey! {agent.name} here.",
            f"{agent.name} here!",
            f"{agent.name} here.",
            f"Hi, {agent.name} here.",
            f"Hello, {agent.name} here.",
            f"Hey, {agent.name} here.",
            f"Hi everyone! {agent.name} here.",
            f"Hello everyone! {agent.name} here.",
            # Case insensitive patterns
            f"hey there! {agent.name.lower()} here.",
            f"hi there! {agent.name.lower()} here.",
            f"hello there! {agent.name.lower()} here.",
        ]
        
        # Clean the response
        cleaned_response = response.strip()
        
        # Remove artificial greeting patterns from the beginning (case insensitive)
        for pattern in artificial_patterns:
            if cleaned_response.lower().startswith(pattern.lower()):
                cleaned_response = cleaned_response[len(pattern):].strip()
                break
        
        # More aggressive cleaning for variations
        greeting_prefixes = [
            f"Hey there! {agent.name} here",
            f"Hi! {agent.name} here",
            f"Hello! {agent.name} here",
            f"Hey! {agent.name} here",
            f"{agent.name} here",
        ]
        
        for prefix in greeting_prefixes:
            # Handle variations with different punctuation
            for punct in [".", "!", ":"]:
                pattern = f"{prefix}{punct}"
                if cleaned_response.lower().startswith(pattern.lower()):
                    cleaned_response = cleaned_response[len(pattern):].strip()
                    break
        
        # Remove standalone name introductions at the beginning
        if cleaned_response.startswith(f"{agent.name}:"):
            cleaned_response = cleaned_response[len(f"{agent.name}:"):].strip()
        
        # Remove excessive exclamation marks and artificial enthusiasm
        cleaned_response = cleaned_response.replace("!!!", "!")
        cleaned_response = cleaned_response.replace("!!", "!")
        
        # Ensure the response doesn't start with just the name
        lines = cleaned_response.split('\n')
        if lines and lines[0].strip() == agent.name:
            lines = lines[1:]
            cleaned_response = '\n'.join(lines).strip()
        
        # Fix encoding issues (common with API responses)
        cleaned_response = cleaned_response.replace('â', '–')
        cleaned_response = cleaned_response.replace('â€™', "'")
        cleaned_response = cleaned_response.replace('â€œ', '"')
        cleaned_response = cleaned_response.replace('â€', '"')
        
        return cleaned_response if cleaned_response else "I'm not sure how to respond to that right now."
    
    def _build_enhanced_system_prompt_with_emotions(self, agent: AgentPersona, conversation_context: str, 
                                                   project_id: str = None, target_participant: str = None) -> str:
        """Build enhanced system prompt with emotional context from RAG"""
        
        # Get base enhanced prompt
        base_prompt = self._build_enhanced_system_prompt(agent, conversation_context)
        
        # Add emotional context if available
        if project_id and target_participant and self.enhanced_rag is not None:
            try:
                # Import here to avoid circular imports
                from ..calls.emotion_analyzer import AIEmotionAnalyzer
                emotion_analyzer = AIEmotionAnalyzer()
                
                # Get enhanced emotional context
                emotion_context = emotion_analyzer.enhance_agent_context_with_emotions(
                    agent.id, target_participant, project_id, self.enhanced_rag
                )
                
                # Append emotion context to base prompt
                emotion_enhanced_prompt = base_prompt + f"""

{emotion_context}

IMPORTANT: Use this emotional context to inform your response style and empathy level. 
Be naturally responsive to the person's emotional state and communication patterns.
"""
                
                return emotion_enhanced_prompt
                
            except Exception as e:
                self.logger.error(f"Error adding emotional context: {e}")
                return base_prompt
        
        return base_prompt
    
    def chat_with_agent_emotion_aware(self, agent_id: str, message: str, project_id: str = None, 
                                     target_participant: str = None) -> str:
        """Chat with agent using emotion-aware context from RAG"""
        
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        
        agent = self.agents[agent_id]
        
        # Initialize conversation history if needed
        if agent_id not in self.conversation_history:
            self.conversation_history[agent_id] = []
        
        # Add message to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": "user",
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate response with emotional context
        try:
            # Get conversation context
            conversation_context = self._build_conversation_context(agent_id)
            
            # Build emotion-aware system prompt
            system_prompt = self._build_enhanced_system_prompt_with_emotions(
                agent, conversation_context, project_id, target_participant
            )
            
            # Generate response
            response = self._call_custom_model(system_prompt, message)
            
            # Clean up response
            response = self._clean_agent_response(agent, response)
            
            # Add response to history
            self.conversation_history[agent_id].append({
                "id": str(uuid.uuid4()),
                "sender": agent.name,
                "message": response,
                "timestamp": datetime.now().isoformat()
            })
            
            # Store interaction in RAG if available
            if self.enhanced_rag is not None and project_id:
                self._get_enhanced_rag().add_message(
                    content=f"User: {message}",
                    project_id=project_id,
                    conversation_id=f"agent_{agent_id}",
                    sender=target_participant or "user",
                    message_type="agent_interaction"
                )
                
                self._get_enhanced_rag().add_message(
                    content=f"{agent.name}: {response}",
                    project_id=project_id,
                    conversation_id=f"agent_{agent_id}",
                    sender=agent.name,
                    agent_id=agent_id,
                    message_type="agent_response"
                )
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error in emotion-aware chat: {e}")
            # Fallback to regular chat
            return self.chat_with_agent(agent_id, message)
    
    def _get_enhanced_rag(self):
        """Get the enhanced RAG manager lazily"""
        if self.enhanced_rag is None:
            self.enhanced_rag = get_rag_manager()
        return self.enhanced_rag