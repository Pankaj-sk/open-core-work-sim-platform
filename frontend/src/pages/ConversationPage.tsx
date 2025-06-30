import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Send, X } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  message_type: string;
}

interface ConversationDetails {
  conversation: {
    id: string;
    title: string;
    conversation_type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    summary: string | null;
  };
  messages: Message[];
  participants: Array<{
    id: string;
    name: string;
    joined_at: string;
  }>;
}

const ConversationPage: React.FC = () => {
  const { projectId, conversationId } = useParams<{ projectId: string; conversationId: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && conversationId) {
      loadConversation();
    }
    // eslint-disable-next-line
  }, [projectId, conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConversationDetails(projectId!, conversationId!);
      if (response.success && response.data) {
        const conv = response.data.conversation;
        setConversation({
          conversation: conv,
          messages: (conv as any).messages && Array.isArray((conv as any).messages) ? (conv as any).messages : [],
          participants: (conv as any).participants && Array.isArray((conv as any).participants) ? (conv as any).participants : []
        });
      } else {
        setConversation(null);
      }
    } catch (error) {
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !conversation) return;
    try {
      setSending(true);
      const response = await apiService.sendMessage(
        projectId!,
        conversation.conversation.id,
        messageInput
      );
      if (response.success) {
        setMessageInput('');
        // Find agent participants
        const agentParticipants = (conversation.participants || []).filter(
          (p: any) => (typeof p === 'string' ? p !== 'user' && p !== 'You' : p.name !== 'You' && p.name !== 'user')
        );
        if (agentParticipants.length > 0) {
          // Use the name if it's an object, or the value if it's a string
          const agentName = typeof agentParticipants[0] === 'string' ? agentParticipants[0] : agentParticipants[0].name;
          setTypingAgent(agentName);
          setTimeout(async () => {
            setTypingAgent(null);
            await loadConversation();
          }, 1200 + Math.random() * 800); // 1.2-2s delay
        } else {
          await loadConversation();
        }
      }
    } catch (error) {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const endConversation = async () => {
    if (!conversation) return;
    try {
      await apiService.endConversation(projectId!, conversation.conversation.id);
      navigate(`/projects/${projectId}`, { state: { reload: true } });
    } catch (error) {
      // handle error
    }
  };

  const handleExit = () => {
    navigate(`/projects/${projectId}`, { state: { reload: true } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col justify-end items-center w-full h-full">
        <div className="bg-white rounded-lg shadow flex flex-col w-full h-full">
          {/* Header */}
          <div className="border-b border-gray-200 p-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold">{conversation.conversation.title}</h3>
              <p className="text-xs text-gray-500">
                {conversation.conversation.conversation_type} •
                {conversation.conversation.status === 'active' ? ' Active' : ' Ended'}
              </p>
            </div>
            <div className="flex gap-2">
              {conversation.conversation.status === 'active' && (
                <button onClick={endConversation} className="btn-secondary text-xs">End</button>
              )}
              <button onClick={handleExit} className="btn-secondary text-xs">
                <X size={14} />
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 w-full bg-gray-50">
            {(conversation.messages || []).map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_name === 'You' ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${
                    message.sender_name === 'You'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <div className="text-[10px] opacity-75 mb-0.5">{message.sender_name}</div>
                  <div>{message.content}</div>
                  <div className="text-[10px] opacity-50 mt-0.5 text-right">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {typingAgent && (
              <div className="flex justify-start w-full">
                <div className="max-w-[70%] px-4 py-2 rounded-2xl text-sm bg-white text-gray-900 border border-gray-200 animate-pulse">
                  <div className="text-[10px] opacity-75 mb-0.5">{typingAgent}</div>
                  <div className="italic text-gray-400">is typing...</div>
                </div>
              </div>
            )}
          </div>
          {/* Message Input */}
          {conversation.conversation.status === 'active' && (
            <div className="border-t border-gray-200 p-2 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="btn-primary px-3"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage; 