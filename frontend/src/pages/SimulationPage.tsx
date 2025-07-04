import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindowUltra from '../components/ChatWindowUltra';
import EventTimeline from '../components/EventTimeline';
import ArtifactCard from '../components/ArtifactCard';
import PreSimulationSetup from '../components/PreSimulationSetup';
import { RotateCcw, Settings, X, User, Users, Lightbulb, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative">
      {/* Enhanced Header with simulation info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-20"
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg"
                >
                  <Play className="text-white" size={24} />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Workplace Simulation
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                      <span>Playing as: <Badge variant="secondary" className="ml-1">{userPersonality?.name}</Badge></span>
                    </div>
                    <span>•</span>
                    <span>Participants: <strong className="text-blue-600">{selectedAgents.length}</strong></span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant={isSidebarOpen ? "default" : "outline"}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="transition-all duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResetSimulation}
                className="transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Simulation
              </Button>
            </div>
          </div>
          
          {/* Compact Participants Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <Users size={16} className="mr-2" />
              Active participants:
            </span>
            {selectedAgents.slice(0, 3).map((agentId, index) => {
              const agentEmojis: { [key: string]: string } = {
                'manager_001': '👔',
                'developer_001': '💻',
                'client_001': '💼',
                'hr_001': '👥',
                'intern_001': '🎓',
                'qa_001': '🔍',
              };
              return (
                <motion.div
                  key={agentId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Badge variant="outline" className="space-x-1">
                    <span>{agentEmojis[agentId]}</span>
                    <span>{getAgentName(agentId).split('(')[0].trim()}</span>
                  </Badge>
                </motion.div>
              );
            })}
            {selectedAgents.length > 3 && (
              <Badge variant="secondary">
                +{selectedAgents.length - 3} more
              </Badge>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Full Screen Chat with Slide-out Sidebar */}
      <div className="relative h-[calc(100vh-140px)]">
        {/* Main Chat Area - Full Screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="h-full p-6"
        >
          <div className="h-full max-w-6xl mx-auto">
            <Card className="h-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="h-full p-0">
                <ChatWindowUltra 
                  selectedAgent={primaryAgent}
                  selectedAgents={selectedAgents}
                  userPersonality={userPersonality}
                />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Slide-out Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-2xl z-30"
            >
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="text-blue-600" size={20} />
                    <h2 className="text-lg font-bold text-gray-900">Simulation Settings</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="h-full overflow-y-auto pb-20">
                <div className="p-4 space-y-6">
                  {/* Enhanced User Info Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                          <User size={24} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Your Profile</CardTitle>
                          <CardDescription className="text-blue-600">Active Personality</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white/70 border border-blue-200 rounded-lg p-3">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Name</label>
                        <p className="text-gray-900 font-medium mt-1">{userPersonality?.name}</p>
                      </div>
                      <div className="bg-white/70 border border-blue-200 rounded-lg p-3">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Role</label>
                        <p className="text-gray-900 font-medium mt-1">{userPersonality?.role}</p>
                      </div>
                      <div className="bg-white/70 border border-blue-200 rounded-lg p-3">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Communication Style</label>
                        <p className="text-gray-700 text-sm mt-1">{userPersonality?.style}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Participants Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Users className="text-purple-600" size={20} />
                        <CardTitle className="text-lg">Active Participants</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAgents.map(agentId => {
                        const agentEmojis: { [key: string]: string } = {
                          'manager_001': '👔',
                          'developer_001': '💻',
                          'client_001': '💼',
                          'hr_001': '👥',
                          'intern_001': '🎓',
                          'qa_001': '🔍',
                        };
                        return (
                          <div key={agentId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-xl">{agentEmojis[agentId]}</span>
                            <div>
                              <p className="font-medium text-gray-900">{getAgentName(agentId)}</p>
                              <Badge 
                                variant={agentId === primaryAgent ? "default" : "outline"}
                                className="text-xs"
                              >
                                {agentId === primaryAgent ? 'Primary' : 'Participant'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Event Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EventTimeline />
                    </CardContent>
                  </Card>

                  {/* Artifacts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Artifacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ArtifactCard />
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Generate Scenario
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Adjust Settings
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Tips Card */}
                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="text-yellow-600" size={20} />
                        <CardTitle className="text-yellow-900">Simulation Tips</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-yellow-800 text-sm space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>Stay in character based on your selected personality</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>Practice active listening and professional communication</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>Use the sidebar to track conversation progress</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SimulationPage;
