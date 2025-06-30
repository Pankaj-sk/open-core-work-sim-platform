// API service for the Work Simulation Platform
import type {
  AgentsResponse,
  AgentResponse,
  ChatResponse,
  ChatHistoryResponse,
  ScenariosResponse,
  StartSimulationResponse,
  SimulationResponse,
  EndSimulationResponse,
  TemplatesResponse,
  GenerateArtifactResponse,
  ArtifactResponse,
  SimulationConfig,
  ArtifactRequest,
} from '../types/api';

// Use environment variable for API base URL, fallback to localhost for dev
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  current_phase: string;
  team_size: number;
  is_active: boolean;
}

interface ProjectDetails {
  project: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    current_phase: string;
    settings: any;
  };
  team_members: Array<{
    id: number;
    name: string;
    role: string;
    is_user: boolean;
    experience_level: string;
    reporting_to: string | null;
  }>;
  user_role: string;
}

interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  start_time: string;
  end_time: string | null;
  participant_count: number;
  message_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  message_type: string;
}

interface ConversationDetails {
  conversation: {
    id: string;
    title: string;
    conversation_type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    summary: string | null;
  };
  messages: Message[];
  participants: Array<{
    id: string;
    name: string;
    joined_at: string;
  }>;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, email: string, password: string, fullName: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
  }

  async logout(token: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  async validateSession(token: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }

  // Project methods
  async createProject(
    name: string,
    description: string,
    userRole: string,
    teamSize: number = 5,
    projectType: string = 'web_development'
  ): Promise<ApiResponse> {
    return this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        user_role: userRole,
        team_size: teamSize,
        project_type: projectType,
      }),
    });
  }

  async getUserProjects(): Promise<ApiResponse<{ projects: Project[]; total_count: number }>> {
    return this.makeRequest('/projects');
  }

  async getProjectDetails(projectId: string): Promise<ApiResponse<ProjectDetails>> {
    return this.makeRequest(`/projects/${projectId}`);
  }

  // Conversation methods
  async startConversation(
    projectId: string,
    conversationType: string,
    title: string,
    participants: string[]
  ): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/conversations/start`, {
      method: 'POST',
      body: JSON.stringify({
        conversation_type: conversationType,
        title,
        participants,
      }),
    });
  }

  async sendMessage(
    projectId: string,
    conversationId: string,
    message: string,
    messageType: string = 'text'
  ): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        message_type: messageType,
      }),
    });
  }

  async endConversation(projectId: string, conversationId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/conversations/end`, {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  }

  async getProjectConversations(
    projectId: string,
    day?: string
  ): Promise<ApiResponse<{ conversations: Conversation[]; total_count: number; date: string }>> {
    const endpoint = day 
      ? `/projects/${projectId}/conversations?day=${day}`
      : `/projects/${projectId}/conversations`;
    return this.makeRequest(endpoint);
  }

  async getConversationDetails(
    projectId: string,
    conversationId: string
  ): Promise<ApiResponse<ConversationDetails>> {
    return this.makeRequest(`/projects/${projectId}/conversations/${conversationId}`);
  }

  // Memory methods
  async getProjectMemory(
    projectId: string,
    query?: string,
    limit: number = 20
  ): Promise<ApiResponse> {
    const endpoint = query
      ? `/projects/${projectId}/memory?query=${encodeURIComponent(query)}&limit=${limit}`
      : `/projects/${projectId}/memory?limit=${limit}`;
    return this.makeRequest(endpoint);
  }

  // Legacy methods for backward compatibility
  async getAgents(): Promise<ApiResponse> {
    return this.makeRequest('/agents');
  }

  async getAgent(agentId: string): Promise<ApiResponse> {
    return this.makeRequest(`/agents/${agentId}`);
  }

  async chatWithAgent(agentId: string, message: string): Promise<ApiResponse> {
    return this.makeRequest(`/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getScenarios(): Promise<ApiResponse> {
    return this.makeRequest('/simulations/scenarios');
  }
}

export const apiService = new ApiService();
export default apiService;
