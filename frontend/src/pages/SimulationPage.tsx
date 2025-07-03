import React, { useState } from 'react';
import ChatWindowUltra from '../components/ChatWindowUltra';
import EventTimeline from '../components/EventTimeline';
import ArtifactCard from '../components/ArtifactCard';
import PreSimulationSetup from '../components/PreSimulationSetup';
import { RotateCcw, Settings, X, User, Users, Lightbulb } from 'lucide-react';

interface UserPersonality {
  id: string;
  name: string;
  role: string;
  style: string;
  description: string;
}

const SimulationPage: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [userPersonality, setUserPersonality] = useState<UserPersonality | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [primaryAgent, setPrimaryAgent] = useState<string>('manager_001');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleStartSimulation = (personality: UserPersonality, agents: string[]) => {
    setUserPersonality(personality);
    setSelectedAgents(agents);
    setPrimaryAgent(agents[0] || 'manager_001');
    setIsSetupComplete(true);
  };

  const handleResetSimulation = () => {
    setIsSetupComplete(false);
    setUserPersonality(null);
    setSelectedAgents([]);
    setPrimaryAgent('manager_001');
    setIsSidebarOpen(false);
  };

  const getAgentName = (agentId: string) => {
    const agentNames: { [key: string]: string } = {
      'manager_001': 'Sarah Johnson (Manager)',
      'developer_001': 'Alex Chen (Developer)',
      'client_001': 'Michael Rodriguez (Client)',
      'hr_001': 'Jennifer Williams (HR)',
      'intern_001': 'Jamie Taylor (Intern)',
      'qa_001': 'David Kim (QA Engineer)',
    };
    return agentNames[agentId] || 'Unknown Agent';
  };

  if (!isSetupComplete) {
    return <PreSimulationSetup onStartSimulation={handleStartSimulation} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Enhanced Header with simulation info */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-sm">
                  <Settings className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Workplace Simulation</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Playing as: <strong className="text-blue-600">{userPersonality?.name}</strong></span>
                    </div>
                    <span>•</span>
                    <span>Participants: <strong>{selectedAgents.length}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                  isSidebarOpen 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              
              <button
                onClick={handleResetSimulation}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <RotateCcw size={16} />
                <span>New Simulation</span>
              </button>
            </div>
          </div>
          
          {/* Compact Participants Display */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Users size={16} className="mr-1" />
              Active participants:
            </span>
            {selectedAgents.slice(0, 3).map(agentId => {
              const agentEmojis: { [key: string]: string } = {
                'manager_001': '👔',
                'developer_001': '💻',
                'client_001': '💼',
                'hr_001': '👥',
                'intern_001': '🎓',
                'qa_001': '🔍',
              };
              return (
                <span 
                  key={agentId} 
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <span>{agentEmojis[agentId]}</span>
                  <span>{getAgentName(agentId).split('(')[0].trim()}</span>
                </span>
              );
            })}
            {selectedAgents.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{selectedAgents.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Chat with Slide-out Sidebar */}
      <div className="relative h-[calc(100vh-140px)]">
        {/* Main Chat Area - Full Screen */}
        <div className="h-full p-4">
          <div className="h-full max-w-6xl mx-auto">
            <ChatWindowUltra 
              selectedAgent={primaryAgent}
              selectedAgents={selectedAgents}
              userPersonality={userPersonality}
            />
          </div>
        </div>

        {/* Slide-out Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Simulation Settings</h2>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all duration-200"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="h-full overflow-y-auto pb-20">
            <div className="p-4 space-y-6">
              {/* Enhanced User Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Your Profile</h3>
                    <p className="text-sm text-blue-600">Active Personality</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-3">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Name</label>
                    <p className="text-gray-900 font-medium mt-1">{userPersonality?.name}</p>
                  </div>
                  <div className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-3">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Role</label>
                    <p className="text-gray-900 font-medium mt-1">{userPersonality?.role}</p>
                  </div>
                  <div className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-3">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Communication Style</label>
                    <p className="text-gray-700 text-sm mt-1">{userPersonality?.style}</p>
                  </div>
                </div>
              </div>

              {/* Active Participants Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="text-purple-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Active Participants</h3>
                </div>
                <div className="space-y-3">
                  {selectedAgents.map(agentId => {
                    const agentEmojis: { [key: string]: string } = {
                      'manager_001': '👔',
                      'developer_001': '💻',
                      'client_001': '💼',
                      'hr_001': '👥',
                      'intern_001': '🎓',
                      'qa_001': '🔍',
                    };
                    const agentColors: { [key: string]: string } = {
                      'manager_001': 'bg-purple-50 text-purple-700 border-purple-200',
                      'developer_001': 'bg-blue-50 text-blue-700 border-blue-200',
                      'client_001': 'bg-green-50 text-green-700 border-green-200',
                      'hr_001': 'bg-pink-50 text-pink-700 border-pink-200',
                      'intern_001': 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      'qa_001': 'bg-red-50 text-red-700 border-red-200',
                    };
                    return (
                      <div 
                        key={agentId}
                        className={`flex items-center space-x-3 p-3 rounded-xl border ${agentColors[agentId] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                      >
                        <span className="text-2xl">{agentEmojis[agentId]}</span>
                        <div className="flex-1">
                          <p className="font-medium">{getAgentName(agentId).split('(')[0].trim()}</p>
                          <p className="text-xs opacity-75">{getAgentName(agentId).match(/\((.*?)\)/)?.[1] || 'Colleague'}</p>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Event Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <EventTimeline />
              </div>
              
              {/* Enhanced Artifacts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ArtifactCard />
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="text-yellow-600" size={20} />
                  <h3 className="font-semibold text-yellow-900">Simulation Tips</h3>
                </div>
                <ul className="text-yellow-800 text-sm space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Each person responds based on their unique workplace personality</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Your communication style influences how they interact with you</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Try different conversation topics to see varied reactions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Settings Button (when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-20 flex items-center justify-center"
          >
            <Settings size={24} />
          </button>
        )}

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-20 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SimulationPage; 
