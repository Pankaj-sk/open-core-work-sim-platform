// 📄 PAGE: ConversationPage.tsx - Individual conversation details and chat interface
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { ArrowLeft, MessageSquare, Clock, Users, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import ChatWindowUltra from '../components/ChatWindowUltra';

interface ConversationDetails {
  conversation: {
    id: string;
    title: string;
    conversation_type: string;
    status: string;
    start_time: string;
    end_time?: string | null;
    summary?: string | null;
    participants?: string[];
    messages?: any[];
  };
}

const ConversationPage: React.FC = () => {
  const { projectId, conversationId } = useParams<{ projectId: string; conversationId: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
      if (!projectId || !conversationId) {
        console.error('Project ID or Conversation ID is missing');
        return;
      }

      const response = await apiService.getConversationDetails(projectId, conversationId);
      
      if (response.success && response.data) {
        setConversation(response.data);
      } else {
        console.error('Failed to load conversation details');
        navigate(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      navigate(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  }, [projectId, conversationId, navigate]);

  useEffect(() => {
    if (projectId && conversationId) {
      loadConversation();
    }
  }, [projectId, conversationId, loadConversation]);

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'completed': 'bg-blue-100 text-blue-700 border-blue-200',
      'paused': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'draft': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'team_meeting': Users,
      'one_on_one': MessageSquare,
      'brainstorm': Activity,
      'standup': Clock
    };
    const IconComponent = icons[type as keyof typeof icons] || MessageSquare;
    return <IconComponent size={16} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
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
          <p className="text-xl font-medium text-gray-700">Loading conversation...</p>
        </motion.div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-4"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">💬</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation not found</h2>
                <p className="text-gray-600 mb-6">The conversation you're looking for doesn't exist or has been removed.</p>
                <Button onClick={handleBack} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Project
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
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-white/50 hover:bg-white transition-all duration-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg"
                >
                  {getTypeIcon(conversation.conversation.conversation_type)}
                  <span className="sr-only">Conversation</span>
                </motion.div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {conversation.conversation.title || 'Conversation'}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(conversation.conversation.status)}
                    >
                      {conversation.conversation.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {conversation.conversation.conversation_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      Started {new Date(conversation.conversation.start_time).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center space-x-2"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm text-gray-600">Live conversation</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="h-[calc(100vh-5rem)] p-6"
      >
        <div className="h-full max-w-6xl mx-auto">
          <Card className="h-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="h-full p-0">
              <ChatWindowUltra
                selectedAgent="technical_lead"
                conversationTitle={conversation.conversation.title || 'Team Discussion'}
                userPersonality={{
                  id: 'user',
                  name: 'You',
                  role: 'Project Manager',
                  style: 'Professional'
                }}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ConversationPage;
