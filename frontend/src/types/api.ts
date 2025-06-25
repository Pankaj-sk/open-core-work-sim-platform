// Type definitions for the Work Simulation Platform API

export interface Agent {
  id: string;
  name: string;
  role: string;
  personality?: string;
  background?: string;
  skills?: string[];
  is_available: boolean;
}

export interface SimulationConfig {
  scenario_id: string;
  participants: string[];
  duration_minutes?: number;
  difficulty?: string;
}

export interface SimulationState {
  simulation_id: string;
  config: SimulationConfig;
  status: 'running' | 'paused' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  events: any[];
  artifacts: string[];
}

export interface ArtifactTemplate {
  id: string;
  name: string;
  type: string;
  variables: string[];
}

export interface ArtifactRequest {
  template_id: string;
  data: Record<string, any>;
  simulation_id?: string;
}

export interface Artifact {
  id: string;
  template_id: string;
  name: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  simulation_id?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface AgentsResponse {
  agents: Agent[];
}

export interface AgentResponse {
  agent: Agent;
}

export interface ChatResponse {
  response: string;
  agent_id: string;
}

export interface ChatHistoryResponse {
  history: ChatMessage[];
}

export interface ScenariosResponse {
  scenarios: Record<string, any>;
}

export interface StartSimulationResponse {
  simulation_id: string;
  status: string;
}

export interface SimulationResponse {
  simulation: SimulationState;
}

export interface EndSimulationResponse {
  result: any;
}

export interface TemplatesResponse {
  templates: ArtifactTemplate[];
}

export interface GenerateArtifactResponse {
  artifact: Artifact;
}

export interface ArtifactResponse {
  artifact: Artifact;
}
