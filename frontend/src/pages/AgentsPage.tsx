import React, { useState, useEffect } from 'react';
import { User, MessageCircle, Star, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Agent {
  id: string;
  name: string;
  role?: string;
  type?: string;
  personality?: string;
  background?: string;
  skills: string[];
  experience?: string;
  rating?: number;
}

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      console.log('Fetching agents from API...');
      const response = await fetch(`${API_BASE_URL}/agents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Agents API response:', data);
      
      // Transform API data to match our interface
      const transformedAgents = data.agents?.map((agent: any) => ({
        id: agent.id || 'unknown',
        name: agent.name || 'Unknown Agent',
        role: agent.type || agent.role || 'Unknown Role',
        type: agent.type,
        personality: agent.personality || 'Professional and helpful',
        background: agent.background || 'Experienced professional',
        skills: Array.isArray(agent.skills) ? agent.skills : ['Communication', 'Problem Solving'],
        experience: agent.experience || 'Multiple years',
        rating: agent.rating || 4.5
      })) || [];
      
      setAgents(transformedAgents);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents from server. Please check if the backend is running.');
      setAgents([]); // Don't use fallback data - force API usage
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600">⚠️ {error}</p>
        <p className="text-sm text-red-500 mt-1">Showing fallback data below.</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meet Our AI Agents</h1>
        <p className="text-gray-600">Interact with realistic workplace personas to practice your skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {agents.map((agent) => (
          <div key={agent.id} className="card">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-primary-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
                  <div className="flex items-center space-x-1">
                    {renderStars(agent.rating || 0)}
                    <span className="text-sm text-gray-600 ml-1">({agent.rating || 'N/A'})</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <Briefcase size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-primary-600">{agent.role}</span>
                  <span className="text-sm text-gray-500">• {agent.experience}</span>
                </div>
                
                <p className="text-gray-600 mb-4">{agent.personality}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Background</h4>
                  <p className="text-sm text-gray-600">{agent.background}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button className="btn-primary w-full">
                  <MessageCircle size={16} className="mr-2" />
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Practice?</h2>
        <p className="text-gray-600 mb-6">
          Choose an agent and start a conversation to practice your workplace skills in realistic scenarios.
        </p>
        <button className="btn-primary text-lg px-8 py-3">
          Start Simulation
        </button>
      </div>
    </div>
  );
};

export default AgentsPage; 