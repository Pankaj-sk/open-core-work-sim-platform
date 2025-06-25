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
                personality="Professional, supportive, and results-oriented. Values clear communication and team collaboration.",
                background="10+ years of experience managing software development teams. MBA from Stanford.",
                skills=["Leadership", "Project Management", "Conflict Resolution", "Strategic Planning"]
            ),
            "developer_001": AgentPersona(
                id="developer_001",
                name="Alex Chen",
                role="Senior Developer",
                personality="Technical, detail-oriented, and passionate about clean code. Sometimes gets lost in technical details.",
                background="8 years of full-stack development experience. Computer Science degree from MIT.",
                skills=["Full-stack Development", "System Architecture", "Code Review", "Technical Documentation"]
            ),
            "client_001": AgentPersona(
                id="client_001",
                name="Michael Rodriguez",
                role="Client Representative",
                personality="Demanding, focused on ROI, and skeptical of new approaches. Values proven solutions.",
                background="15 years in business development. Previously worked at Fortune 500 companies.",
                skills=["Business Analysis", "Stakeholder Management", "Budget Planning", "Risk Assessment"]
            ),
            "hr_001": AgentPersona(
                id="hr_001",
                name="Jennifer Williams",
                role="HR Specialist",
                personality="Empathetic, policy-focused, and concerned with employee well-being. Balances company and employee needs.",
                background="12 years in human resources. Certified HR professional with focus on employee relations.",
                skills=["Employee Relations", "Policy Development", "Conflict Mediation", "Performance Management"]
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
        """Generate a response using custom model API"""
        try:
            # TODO: Replace this with your custom model API call
            # Example implementation:
            
            # Build the prompt with agent context
            system_prompt = f"""You are {agent.name}, a {agent.role}.
Personality: {agent.personality}
Background: {agent.background}
Skills: {', '.join(agent.skills)}

Respond as this character would in a workplace simulation. Keep responses professional but true to the personality."""
            
            # Call your custom model API here
            response = self._call_custom_model(system_prompt, message)
            return response
            
        except Exception as e:
            print(f"Error calling custom model: {e}")
            # Fallback to mock response if API fails
            return self._get_fallback_response(agent.id)
    
    def _call_custom_model(self, system_prompt: str, user_message: str) -> str:
        """
        Call your custom model API
        Update this method with your actual API integration
        """
        import requests
        
        # Use settings from config
        api_url = settings.custom_model_api_url
        api_key = settings.custom_model_api_key
        
        if not api_url:
            raise Exception("Custom model API URL not configured")
        
        # Example payload - adjust for your API format
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": settings.custom_model_max_tokens,
            "temperature": settings.custom_model_temperature,
            "model": settings.custom_model_name
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        try:
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                # Adjust this based on your API response format
                result = response.json()
                
                # Common response formats - adjust as needed:
                # OpenAI format: result["choices"][0]["message"]["content"]
                # Claude format: result["content"][0]["text"]
                # Custom format: adjust accordingly
                
                if "choices" in result:
                    return result["choices"][0]["message"]["content"]
                elif "content" in result:
                    return result["content"]
                elif "response" in result:
                    return result["response"]
                else:
                    return str(result)
            else:
                raise Exception(f"API call failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error calling custom model: {e}")
        except Exception as e:
            raise Exception(f"Error calling custom model: {e}")
    
    def _get_fallback_response(self, agent_id: str) -> str:
        """Fallback responses if custom model fails"""
        responses = {
            "manager_001": [
                "I understand your concern. Let's approach this systematically and ensure everyone is aligned on our goals.",
                "That's a great point. I think we should schedule a follow-up meeting to discuss this in detail.",
                "I appreciate you bringing this up. Let me coordinate with the team and get back to you with a plan."
            ],
            "developer_001": [
                "From a technical perspective, I think we need to consider the scalability implications here.",
                "I can see some potential issues with the current architecture. Let me propose an alternative approach.",
                "This reminds me of a similar problem we solved last quarter. Let me check our documentation."
            ],
            "client_001": [
                "I need to see concrete ROI numbers before we can proceed with this approach.",
                "How does this align with our quarterly objectives and budget constraints?",
                "I'm concerned about the timeline. Can we accelerate this without compromising quality?"
            ],
            "hr_001": [
                "We need to ensure this approach complies with our company policies and benefits all team members.",
                "I'm concerned about the impact on team morale. Let's consider the human factor here.",
                "This situation requires careful consideration of both company needs and employee well-being."
            ]
        }
        
        # Return a contextual response based on the agent
        import random
        return random.choice(responses.get(agent_id, ["I understand. Let me think about this."]))
    
    def get_conversation_history(self, agent_id: str) -> List[Dict]:
        """Get conversation history with a specific agent"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not found")
        return self.conversation_history.get(agent_id, [])
    
    def reset_conversation(self, agent_id: str):
        """Reset conversation history with an agent"""
        if agent_id in self.conversation_history:
            self.conversation_history[agent_id] = [] 