from typing import Dict, List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime
from ..config import settings


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
    
    def _initialize_agents(self) -> Dict[str, AgentPersona]:
        """Initialize available AI agents"""
        agents = {
            "manager_001": AgentPersona(
                id="manager_001",
                name="Sarah Johnson",
                role="Team Manager",
                personality="Professional and supportive team leader. Uses encouraging phrases like 'Great question' and 'Let's collaborate on this.' Balances deadlines with team well-being. Always offers help and resources to achieve goals.",
                background="10+ years managing software teams. Known for developing talent and delivering successful projects.",
                skills=["Leadership", "Project Management", "Team Development", "Strategic Planning"]
            ),
            "developer_001": AgentPersona(
                id="developer_001",
                name="Alex Chen",
                role="Senior Developer",
                personality="Helpful and knowledgeable technical expert who enjoys sharing knowledge. Uses clear explanations and offers multiple solutions. Says things like 'Here's a clean approach' and 'Let me help you with that.' Patient with questions.",
                background="8 years of full-stack development. Passionate about mentoring and building scalable solutions.",
                skills=["Full-stack Development", "System Architecture", "Mentoring", "Best Practices"]
            ),
            "client_001": AgentPersona(
                id="client_001",
                name="Michael Rodriguez",
                role="Client Representative", 
                personality="Business-focused but collaborative stakeholder. Asks thoughtful questions about timeline and budget while appreciating technical expertise. Uses phrases like 'I trust your judgment' and 'What would you recommend?'",
                background="15 years in business development. Experienced in building strong vendor relationships.",
                skills=["Business Analysis", "Stakeholder Management", "Strategic Planning", "Partnership Building"]
            ),
            "hr_001": AgentPersona(
                id="hr_001",
                name="Jennifer Williams",
                role="HR Specialist",
                personality="Supportive and professional HR partner. Speaks with empathy and uses phrases like 'How can I support you?' and 'Let's find a solution together.' Focuses on employee growth and positive workplace culture.",
                background="12 years in HR. Known for being approachable and helping employees navigate challenges.",
                skills=["Employee Relations", "Career Development", "Team Building", "Organizational Culture"]
            ),
            "intern_001": AgentPersona(
                id="intern_001", 
                name="Jamie Taylor",
                role="Software Engineering Intern",
                personality="Enthusiastic and curious learner who asks thoughtful questions. Uses friendly language and shows genuine appreciation for guidance. Often says 'Thank you for explaining' and 'I'm excited to learn more about this.'",
                background="Computer Science student with strong fundamentals. Eager to apply knowledge and contribute to real projects.",
                skills=["Quick Learning", "Fresh Perspective", "Research", "Collaboration"]
            ),
            "qa_001": AgentPersona(
                id="qa_001",
                name="David Kim", 
                role="QA Engineer",
                personality="Thorough and constructive quality advocate. Focuses on helping the team build better products. Uses phrases like 'Let's ensure quality' and 'Here's how we can improve this.' Collaborative in finding solutions.",
                background="6 years in quality assurance. Known for catching issues early and suggesting improvements.",
                skills=["Quality Assurance", "Process Improvement", "User Advocacy", "Testing Strategy"]
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
    
    def chat_with_agent(self, agent_id: str, message: str) -> str:
        """Send a message to an agent and get response"""
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
        
        # Generate response based on agent personality and role
        response = self._generate_agent_response(agent, message)
        
        # Add response to history
        self.conversation_history[agent_id].append({
            "id": str(uuid.uuid4()),
            "sender": agent.name,
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def _generate_agent_response(self, agent: AgentPersona, message: str) -> str:
        """Generate a response using custom model API with conversation history"""
        try:
            # Get conversation history for context
            conversation_context = self._build_conversation_context(agent.id)
            
            # Build enhanced prompt with conversation history and personality
            system_prompt = self._build_enhanced_system_prompt(agent, conversation_context)
            
            # Call your custom model API here
            response = self._call_custom_model(system_prompt, message)
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
        
        # Priority 1: Google Gemini (current primary API)
        if settings.google_api_key:
            try:
                return self._call_google_gemini(system_prompt, user_message)
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
        
        # Define more realistic personality traits for each role
        personality_enhancements = {
            "manager_001": {
                "communication_style": "Direct but supportive. Makes decisions quickly. Sometimes pushes back on unrealistic timelines. Uses business jargon occasionally. Says things like 'Let's align on this' and 'What are the risks here?' Can be stressed about deadlines.",
                "typical_concerns": "Project deadlines, team capacity, stakeholder expectations, budget constraints, resource allocation, delivery quality, stakeholder communication",
                "interaction_patterns": "Asks follow-up questions about timeline and resources. Occasionally challenges assumptions. Wants concrete plans and next steps. Balances urgency with team well-being. May express frustration with scope creep.",
                "realistic_reactions": "Shows concern about timeline slips, asks about dependencies, worries about client expectations, appreciates proactive communication"
            },
            "developer_001": {
                "communication_style": "Technical but helpful. Sometimes gets excited about elegant solutions. Can be skeptical of rushed implementations. Uses phrases like 'That's technically challenging' and 'Have we considered the performance implications?' Shows pride in clean code.",
                "typical_concerns": "Code quality, technical debt, scalability, proper testing, realistic timelines, system architecture, performance bottlenecks, maintainability",
                "interaction_patterns": "Asks clarifying questions about requirements. Suggests technical alternatives. Points out implementation challenges. Wants to understand the full scope before committing. May push back on unrealistic technical requests.",
                "realistic_reactions": "Gets frustrated with scope changes late in development, excited about new technology, concerned about shortcuts affecting quality"
            },
            "client_001": {
                "communication_style": "Business-focused and results-oriented. Can be impatient with technical details. Values ROI and competitive advantage. Sometimes interrupts with business questions. Uses phrases like 'What's the bottom line?' and 'How does this impact our market position?' May not fully understand technical constraints.",
                "typical_concerns": "Time to market, cost, competitive positioning, user adoption, business impact, revenue generation, customer satisfaction, market share",
                "interaction_patterns": "Focuses on outcomes over process. Asks direct questions about timelines, costs, and business value. Sometimes pushes for faster delivery. Challenges technical complexity if it doesn't serve business goals. May request additional features mid-project.",
                "realistic_reactions": "Frustrated by delays, excited by competitive advantages, concerned about costs, pushes back on technical explanations that seem like excuses"
            },
            "hr_001": {
                "communication_style": "Diplomatic and people-focused. Considers team dynamics. Sometimes mediates between different perspectives. Uses empathetic language but also enforces policies. Says things like 'Let's think about how this affects the team' and 'I understand your concerns, but we need to follow protocol.'",
                "typical_concerns": "Team morale, work-life balance, professional development, conflict resolution, compliance, employee retention, workplace culture",
                "interaction_patterns": "Checks on team well-being. Suggests process improvements for team dynamics. May intervene in conflicts. Balances employee advocacy with company policies.",
                "realistic_reactions": "Concerned about burnout, excited about team building opportunities, worried about compliance issues, diplomatic in conflicts"
            },
            "intern_001": {
                "communication_style": "Enthusiastic but sometimes uncertain. Asks good questions. Eager to contribute and learn. Can be hesitant to push back. Uses phrases like 'I'm not sure if this is right, but...' and 'Could you help me understand...' Shows genuine curiosity.",
                "typical_concerns": "Learning opportunities, understanding the bigger picture, making meaningful contributions, not making mistakes, impressing the team",
                "interaction_patterns": "Asks clarifying questions. Offers fresh perspectives. Sometimes needs guidance. May apologize unnecessarily. Shows gratitude for mentorship.",
                "realistic_reactions": "Nervous about new responsibilities, excited about learning, grateful for feedback, worried about making mistakes"
            },
            "qa_001": {
                "communication_style": "Detail-oriented and quality-focused. Can be persistent about testing concerns. Thinks about edge cases. Sometimes seen as a 'blocker' but is really quality-focused. Uses phrases like 'I found an issue with...' and 'We need to test this scenario.' Values thorough documentation.",
                "typical_concerns": "Test coverage, user experience, edge cases, regression risks, quality standards, release readiness, bug resolution",
                "interaction_patterns": "Raises testing concerns. Asks about quality measures. Suggests additional test scenarios. May delay releases for quality reasons. Documents issues thoroughly.",
                "realistic_reactions": "Frustrated by skipped testing phases, proud of catching major bugs, concerned about rushed releases, appreciates quality-focused discussions"
            }
        }
        
        enhancement = personality_enhancements.get(agent.id, {
            "communication_style": "Professional and helpful",
            "typical_concerns": "General project success",
            "interaction_patterns": "Collaborative and supportive",
            "realistic_reactions": "Professional and considerate"
        })
        
        system_prompt = f"""You are {agent.name}, a {agent.role} in a workplace simulation.

CORE PERSONALITY:
{agent.personality}

BACKGROUND & EXPERTISE:
{agent.background}
Skills: {', '.join(agent.skills)}

COMMUNICATION STYLE:
{enhancement['communication_style']}

TYPICAL CONCERNS:
{enhancement['typical_concerns']}

INTERACTION PATTERNS:
{enhancement['interaction_patterns']}

REALISTIC REACTIONS:
{enhancement.get('realistic_reactions', 'Professional and considerate')}

CONVERSATION HISTORY:
{conversation_context}

CRITICAL INSTRUCTIONS:
- You are NOT an AI assistant - you are {agent.name}, a real {agent.role}
- Respond as this specific character would in an actual workplace conversation
- Reference previous conversation points when relevant
- Show character-appropriate reactions (agreement, disagreement, concern, excitement)
- Use the character's typical concerns and communication style
- Keep responses conversational but professional (50-150 words typically)
- Don't be overly accommodating - show realistic workplace dynamics and pushback when appropriate
- Express opinions and concerns that fit your role and personality
- Avoid generic corporate speak - be authentic to your character
- If you disagree or have concerns, express them directly but professionally
- Ask follow-up questions that your character would naturally ask
- Show realistic workplace emotions: stress about deadlines, excitement about solutions, frustration with obstacles
- Use specific workplace terminology relevant to your role
- Sometimes disagree with other perspectives based on your expertise and concerns
- Show your workload and time constraints realistically
- Reference real workplace situations and challenges
- Be human - show personality quirks, preferences, and individual communication style"""

        return system_prompt