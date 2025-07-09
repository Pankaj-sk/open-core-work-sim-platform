// 📄 PAGE: AgentsPage.tsx - AI agents management page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Star, Briefcase, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
      const response = await fetch(`${API_BASE_URL}/agents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const getAgentEmoji = (role: string) => {
    const roleEmojis: { [key: string]: string } = {
      'manager': '👔',
      'developer': '💻',
      'client': '💼',
      'hr': '👥',
      'intern': '🎓',
      'qa': '🔍',
      'designer': '🎨',
      'analyst': '📊',
      'unknown role': '👤'
    };
    
    const key = role.toLowerCase().split(' ')[0];
    return roleEmojis[key] || '👤';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-xl font-medium text-gray-700">Loading agents...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAgents} className="bg-red-600 hover:bg-red-700">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"
          >
            <Users className="text-white" size={40} />
          </motion.div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Meet Our AI Agents
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interact with realistic workplace personas to practice your skills in dynamic, 
            professional scenarios designed to enhance your communication abilities.
          </p>
        </motion.div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-lg"
                    >
                      {getAgentEmoji(agent.role || '')}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"
                    />
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {agent.name}
                  </CardTitle>
                  
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Briefcase size={16} className="text-gray-400" />
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {agent.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1">
                    {renderStars(agent.rating || 0)}
                    <span className="text-sm text-gray-600 ml-2">({agent.rating || 'N/A'})</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Sparkles size={14} className="mr-2 text-purple-500" />
                      Personality
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {agent.personality}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Experience</h4>
                    <p className="text-sm text-gray-600">{agent.experience}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.slice(0, 4).map((skill, skillIndex) => (
                        <Badge
                          key={skillIndex}
                          variant="outline"
                          className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {agent.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group"
                      size="lg"
                    >
                      <MessageCircle size={18} className="mr-2" />
                      Start Conversation
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
            <CardContent className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6"
              >
                <Sparkles className="text-white" size={32} />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4">Ready to Practice?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Choose an agent and start a conversation to practice your workplace skills 
                in realistic scenarios. Build confidence through interactive simulations.
              </p>
              
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3 group"
              >
                <Users size={20} className="mr-2" />
                Start Simulation
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentsPage; 
