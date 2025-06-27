import React, { useState } from 'react';
import { User, Users, ArrowRight, Play, Briefcase } from 'lucide-react';

interface UserPersonality {
  id: string;
  name: string;
  role: string;
  style: string;
  description: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  description: string;
  difficulty: string;
}

interface PreSimulationSetupProps {
  onStartSimulation: (userPersonality: UserPersonality, selectedAgents: string[]) => void;
}

const PreSimulationSetup: React.FC<PreSimulationSetupProps> = ({ onStartSimulation }) => {
  const [selectedUserPersonality, setSelectedUserPersonality] = useState<UserPersonality | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'personality' | 'agents' | 'ready'>('personality');

  const userPersonalities: UserPersonality[] = [
    { 
      id: 'user_professional', 
      name: 'Professional', 
      role: 'Team Member', 
      style: 'Direct and collaborative',
      description: 'You communicate clearly and professionally. You focus on getting work done efficiently and building good relationships with colleagues.'
    },
    { 
      id: 'user_casual', 
      name: 'Casual & Friendly', 
      role: 'Team Member', 
      style: 'Relaxed and approachable',
      description: 'You keep things light and friendly. You use casual language and humor to build rapport with your team.'
    },
    { 
      id: 'user_newbie', 
      name: 'New Employee', 
      role: 'Junior', 
      style: 'Eager to learn, asks questions',
      description: 'You\'re new to the company and excited to learn. You ask lots of questions and want to understand how everything works.'
    },
    { 
      id: 'user_senior', 
      name: 'Senior Leader', 
      role: 'Executive', 
      style: 'Strategic and decisive',
      description: 'You think big picture and make tough decisions. You focus on strategy, outcomes, and leading the team forward.'
    },
    { 
      id: 'user_skeptical', 
      name: 'Analytical Skeptic', 
      role: 'Analyst', 
      style: 'Questions everything, data-driven',
      description: 'You want to see the data before making decisions. You ask tough questions and challenge assumptions to ensure quality.'
    },
    { 
      id: 'user_enthusiastic', 
      name: 'Innovation Enthusiast', 
      role: 'Innovator', 
      style: 'Excited about new ideas',
      description: 'You love trying new things and pushing boundaries. You bring energy and creative solutions to every discussion.'
    },
  ];

  const availableAgents: Agent[] = [
    { 
      id: 'manager_001', 
      name: 'Sarah Johnson', 
      role: 'Team Manager', 
      emoji: '👔',
      description: 'Stressed manager juggling deadlines. Uses corporate speak and is always "circling back" on things.',
      difficulty: 'Medium'
    },
    { 
      id: 'developer_001', 
      name: 'Alex Chen', 
      role: 'Senior Developer', 
      emoji: '💻',
      description: 'Technical perfectionist who gets excited about architecture. Speaks in code and loves refactoring.',
      difficulty: 'Medium'
    },
    { 
      id: 'client_001', 
      name: 'Michael Rodriguez', 
      role: 'Client Representative', 
      emoji: '💼',
      description: 'Impatient business person focused on costs and deadlines. Doesn\'t understand technical details.',
      difficulty: 'Hard'
    },
    { 
      id: 'hr_001', 
      name: 'Jennifer Williams', 
      role: 'HR Specialist', 
      emoji: '👥',
      description: 'Diplomatic professional who speaks in HR language. Concerned about policies and team dynamics.',
      difficulty: 'Medium'
    },
    { 
      id: 'intern_001', 
      name: 'Jamie Taylor', 
      role: 'Software Intern', 
      emoji: '🎓',
      description: 'Enthusiastic intern who asks basic questions. Uses casual language and emojis in conversations.',
      difficulty: 'Easy'
    },
    { 
      id: 'qa_001', 
      name: 'David Kim', 
      role: 'QA Engineer', 
      emoji: '🔍',
      description: 'Detail-oriented pessimist who finds problems in everything. Always thinking about edge cases.',
      difficulty: 'Medium'
    },
  ];

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleNext = () => {
    if (currentStep === 'personality' && selectedUserPersonality) {
      setCurrentStep('agents');
    } else if (currentStep === 'agents' && selectedAgents.length > 0) {
      setCurrentStep('ready');
    }
  };

  const handleStartSimulation = () => {
    if (selectedUserPersonality && selectedAgents.length > 0) {
      onStartSimulation(selectedUserPersonality, selectedAgents);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Briefcase className="text-primary-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Workplace Simulation Setup</h1>
          </div>
          <p className="text-lg text-gray-600">Configure your personality and choose who you want to interact with</p>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${currentStep === 'personality' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'personality' ? 'bg-primary-600 text-white' : 
              selectedUserPersonality ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <User size={16} />
            </div>
            <span className="font-medium">Your Personality</span>
          </div>
          
          <ArrowRight className="text-gray-400" size={20} />
          
          <div className={`flex items-center space-x-2 ${currentStep === 'agents' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'agents' ? 'bg-primary-600 text-white' : 
              selectedAgents.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <Users size={16} />
            </div>
            <span className="font-medium">Select Colleagues</span>
          </div>
          
          <ArrowRight className="text-gray-400" size={20} />
          
          <div className={`flex items-center space-x-2 ${currentStep === 'ready' ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'ready' ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              <Play size={16} />
            </div>
            <span className="font-medium">Start Simulation</span>
          </div>
        </div>

        {/* Step 1: Personality Selection */}
        {currentStep === 'personality' && (
          <div className="card mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Workplace Personality</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Your personality affects how you communicate and how others respond to you in the simulation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPersonalities.map((personality) => (
                <button
                  key={personality.id}
                  onClick={() => setSelectedUserPersonality(personality)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedUserPersonality?.id === personality.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{personality.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {personality.role}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{personality.style}</p>
                  <p className="text-gray-500 text-xs">{personality.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Agent Selection */}
        {currentStep === 'agents' && (
          <div className="card mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Select Your Colleagues</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Choose who you want to interact with in your workplace simulation. You can select multiple people.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedAgents.includes(agent.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.role}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(agent.difficulty)}`}>
                      {agent.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{agent.description}</p>
                  
                  {selectedAgents.includes(agent.id) && (
                    <div className="mt-2 text-primary-600 text-sm font-medium">
                      ✓ Selected for simulation
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {selectedAgents.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Selected Participants ({selectedAgents.length}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgents.map(agentId => {
                    const agent = availableAgents.find(a => a.id === agentId);
                    return agent ? (
                      <span key={agentId} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {agent.emoji} {agent.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Ready to Start */}
        {currentStep === 'ready' && selectedUserPersonality && (
          <div className="card mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <Play className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Ready to Start</h2>
            </div>
            
            <div className="space-y-6">
              {/* User Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Your Personality</h3>
                <div className="flex items-center space-x-3">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-blue-900">{selectedUserPersonality.name}</p>
                    <p className="text-blue-700 text-sm">{selectedUserPersonality.description}</p>
                  </div>
                </div>
              </div>

              {/* Participants Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Simulation Participants ({selectedAgents.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedAgents.map(agentId => {
                    const agent = availableAgents.find(a => a.id === agentId);
                    return agent ? (
                      <div key={agentId} className="flex items-center space-x-3 bg-white p-3 rounded">
                        <span className="text-xl">{agent.emoji}</span>
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-gray-600 text-sm">{agent.role}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Simulation Tips */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">💡 Simulation Tips</h3>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Each person will respond based on their unique workplace personality</li>
                  <li>• Your communication style will influence how they interact with you</li>
                  <li>• Try different conversation topics to see how each person reacts</li>
                  <li>• Observe realistic workplace dynamics and communication patterns</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentStep === 'agents') setCurrentStep('personality');
              else if (currentStep === 'ready') setCurrentStep('agents');
            }}
            disabled={currentStep === 'personality'}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {currentStep === 'ready' ? (
            <button
              onClick={handleStartSimulation}
              className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
            >
              <Play size={20} />
              <span>Start Workplace Simulation</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 'personality' && !selectedUserPersonality) ||
                (currentStep === 'agents' && selectedAgents.length === 0)
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreSimulationSetup;
