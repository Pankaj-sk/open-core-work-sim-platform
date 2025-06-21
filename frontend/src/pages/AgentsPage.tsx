import React from 'react';
import { User, MessageCircle, Star, Briefcase } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  personality: string;
  background: string;
  skills: string[];
  experience: string;
  rating: number;
}

const AgentsPage: React.FC = () => {
  const agents: Agent[] = [
    {
      id: 'manager_001',
      name: 'Sarah Johnson',
      role: 'Team Manager',
      personality: 'Professional, supportive, and results-oriented. Values clear communication and team collaboration.',
      background: '10+ years of experience managing software development teams. MBA from Stanford.',
      skills: ['Leadership', 'Project Management', 'Conflict Resolution', 'Strategic Planning'],
      experience: '10+ years',
      rating: 4.8
    },
    {
      id: 'developer_001',
      name: 'Alex Chen',
      role: 'Senior Developer',
      personality: 'Technical, detail-oriented, and passionate about clean code. Sometimes gets lost in technical details.',
      background: '8 years of full-stack development experience. Computer Science degree from MIT.',
      skills: ['Full-stack Development', 'System Architecture', 'Code Review', 'Technical Documentation'],
      experience: '8 years',
      rating: 4.6
    },
    {
      id: 'client_001',
      name: 'Michael Rodriguez',
      role: 'Client Representative',
      personality: 'Demanding, focused on ROI, and skeptical of new approaches. Values proven solutions.',
      background: '15 years in business development. Previously worked at Fortune 500 companies.',
      skills: ['Business Analysis', 'Stakeholder Management', 'Budget Planning', 'Risk Assessment'],
      experience: '15 years',
      rating: 4.7
    },
    {
      id: 'hr_001',
      name: 'Jennifer Williams',
      role: 'HR Specialist',
      personality: 'Empathetic, policy-focused, and concerned with employee well-being. Balances company and employee needs.',
      background: '12 years in human resources. Certified HR professional with focus on employee relations.',
      skills: ['Employee Relations', 'Policy Development', 'Conflict Mediation', 'Performance Management'],
      experience: '12 years',
      rating: 4.9
    }
  ];

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
                    {renderStars(agent.rating)}
                    <span className="text-sm text-gray-600 ml-1">({agent.rating})</span>
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