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

// Environment variable handling
const getApiBaseUrl = (): string => {
  // Check for React environment variable
  if (typeof window !== 'undefined' && (window as any).__REACT_APP_API_URL__) {
    return (window as any).__REACT_APP_API_URL__;
  }
  
  // Try accessing environment variables through global object
  try {
    const globalThis = (function(this: any) { return this; })();
    if (globalThis && (globalThis as any).process && (globalThis as any).process.env) {
      const apiUrl = (globalThis as any).process.env.REACT_APP_API_URL;
      if (apiUrl) return apiUrl;
    }
  } catch (error) {
    console.log('Environment variables not accessible');
  }
  
  // Default fallback
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// HTTP client interface
interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data?: any): Promise<T>;
}

// Fetch-based HTTP client implementation
class FetchHttpClient implements HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Create HTTP client instance
const httpClient = new FetchHttpClient(API_BASE_URL);

// Agent API calls
export const agentsApi = {
  getAgents: (): Promise<AgentsResponse> => 
    httpClient.get('/agents'),
  
  getAgent: (agentId: string): Promise<AgentResponse> => 
    httpClient.get(`/agents/${agentId}`),
  
  chatWithAgent: (agentId: string, message: string): Promise<ChatResponse> => 
    httpClient.post(`/agents/${agentId}/chat`, { message }),
  
  getChatHistory: (agentId: string): Promise<ChatHistoryResponse> => 
    httpClient.get(`/agents/${agentId}/history`),
};

// Simulation API calls
export const simulationApi = {
  getScenarios: (): Promise<ScenariosResponse> => 
    httpClient.get('/simulations/scenarios'),
  
  startSimulation: (config: SimulationConfig): Promise<StartSimulationResponse> => 
    httpClient.post('/simulations/start', config),
  
  getSimulation: (simulationId: string): Promise<SimulationResponse> => 
    httpClient.get(`/simulations/${simulationId}`),
  
  endSimulation: (simulationId: string): Promise<EndSimulationResponse> => 
    httpClient.post(`/simulations/${simulationId}/end`),
};

// Artifact API calls
export const artifactApi = {
  getTemplates: (): Promise<TemplatesResponse> => 
    httpClient.get('/artifacts/templates'),
  
  generateArtifact: (request: ArtifactRequest): Promise<GenerateArtifactResponse> => 
    httpClient.post('/artifacts/generate', request),
  
  getArtifact: (artifactId: string): Promise<ArtifactResponse> => 
    httpClient.get(`/artifacts/${artifactId}`),
};

// Default export
export default {
  agentsApi,
  simulationApi,
  artifactApi,
  baseURL: API_BASE_URL,
};
