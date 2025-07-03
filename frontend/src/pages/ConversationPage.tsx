import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowLeft } from 'lucide-react';
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

  const loadConversation = async () => {
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
  };

  useEffect(() => {
    if (projectId && conversationId) {
      loadConversation();
    }
  }, [projectId, conversationId]);

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation not found</h2>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversation.conversation.title || 'Conversation'}
                </h1>
                <p className="text-sm text-gray-500">
                  {conversation.conversation.conversation_type} • {conversation.conversation.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="h-[calc(100vh-4rem)]">
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
      </div>
    </div>
  );
};

export default ConversationPage;
