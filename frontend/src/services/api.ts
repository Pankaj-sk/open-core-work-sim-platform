// API service for the Work Simulation Platform

// Use environment variable for API base URL, fallback to localhost for dev
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
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

// 📄 PAGE: api.ts - API service for backend communication

// Dashboard-specific interfaces - TODO: Remove comments when implemented
/* interface DashboardTask {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  category: string;
  assignedBy?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ConversationSuggestion {
  id: string;
  title: string;
  description: string;
  participants: string[];
  conversationType: string;
  priority: 'high' | 'medium' | 'low';
  context: string;
}

interface AgentFeedback {
  id: string;
  agentName: string;
  agentRole: string;
  content: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  receivedAt: string;
  deadline?: string;
  category: 'order' | 'feedback' | 'request' | 'update';
} */

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
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials unless needed
      ...options,
    };

    try {
      // Remove debug logging in production
      // // Debug logging removed
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData); // Debug log
          
          // Handle Pydantic validation errors
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail.map((err: any) => 
              `${err.loc?.join('.') || 'Field'}: ${err.msg || 'Invalid value'}`
            ).join(', ');
            errorMessage = `Validation Error: ${validationErrors}`;
          } else {
            errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          console.warn('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Remove debug logging in production
      // // Debug logging removed
      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
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
    const requestBody = {
      name,
      description,
      user_role: userRole,
      team_size: teamSize,
      project_type: projectType,
    };
    
    console.log('Creating project with data:', requestBody); // Debug log
    
    return this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(requestBody),
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

  // Dashboard API functions
  async getDashboardData(projectId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/dashboard`);
  }

  async getRoleTasks(projectId: string, role: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/ai-tasks?role=${role}`);
  }
}

export const apiService = new ApiService();
export default apiService;
