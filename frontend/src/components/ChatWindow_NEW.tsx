import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Users } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  agentId?: string;
}

interface ChatWindowProps {
  selectedAgent: string;
  selectedAgents?: string[];
  userPersonality?: UserPersonality | null;
  isFullScreen?: boolean;
}

interface UserPersonality {
  id: string;
  name: string;
  role: string;
  style: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  selectedAgent, 
  selectedAgents: propSelectedAgents, 
  userPersonality: propUserPersonality,
  isFullScreen = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState<string[]>(
    propSelectedAgents || [selectedAgent]
  );
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [userPersonality, setUserPersonality] = useState<UserPersonality>(
    propUserPersonality || {
      id: 'user_professional',
      name: 'Professional',
      role: 'Team Member',
      style: 'Direct and collaborative'
    }
  );
  const [showUserPersonality, setShowUserPersonality] = useState(false);
  const [lastActiveParticipants, setLastActiveParticipants] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Control over personality and participants
  const canChangePersonality = !propUserPersonality;
  const canChangeParticipants = !propSelectedAgents;

  const availableAgents = [
    { id: 'manager_001', name: 'Sarah', role: 'Project Manager', emoji: '👔' },
    { id: 'developer_001', name: 'Alex', role: 'Senior Developer', emoji: '💻' },
    { id: 'client_001', name: 'Michael', role: 'Client Representative', emoji: '💼' },
    { id: 'hr_001', name: 'Jessica', role: 'HR Representative', emoji: '👥' },
    { id: 'intern_001', name: 'Riley', role: 'Intern', emoji: '🎓' },
    { id: 'qa_001', name: 'Casey', role: 'QA Engineer', emoji: '🔍' }
  ];

  const userPersonalities = [
    {
      id: 'user_professional',
      name: 'Professional',
      role: 'Team Member',
      style: 'Direct and collaborative'
    },
    {
      id: 'user_friendly',
      name: 'Friendly',
      role: 'Team Member',
      style: 'Warm and approachable'
    },
    {
      id: 'user_analytical',
      name: 'Analytical',
      role: 'Team Member',
      style: 'Detail-oriented and methodical'
    },
    {
      id: 'user_creative',
      name: 'Creative',
      role: 'Team Member',
      style: 'Innovative and expressive'
    },
    {
      id: 'user_assertive',
      name: 'Assertive',
      role: 'Team Member',
      style: 'Confident and decisive'
    }
  ];

  const getAgentInfo = (agentId: string) => {
    const agent = availableAgents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (propSelectedAgents) {
      setActiveParticipants(propSelectedAgents);
    }
  }, [propSelectedAgents]);

  useEffect(() => {
    if (propUserPersonality) {
      setUserPersonality(propUserPersonality);
    }
  }, [propUserPersonality]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.personality-selector') && !target.closest('.participant-selector')) {
        setShowUserPersonality(false);
        setShowParticipantSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || activeParticipants.length === 0) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      sender: `${userPersonality.name} (You)`,
      message: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send API calls to all active participants
    for (const agentId of activeParticipants) {
      await callAPIForAgent(agentId, inputMessage, userPersonality);
    }

    setIsTyping(false);
  };

  const callAPIForAgent = async (agentId: string, userInput: string, personality: UserPersonality) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          agent_id: agentId,
          user_personality: personality
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiResponse: Message = {
          id: `${Date.now()}-${agentId}-${Math.random()}`,
          sender: getAgentInfo(agentId),
          message: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false,
          agentId: agentId
        };

        // Add small delay between responses to make conversation feel more natural
        setTimeout(() => {
          setMessages(prev => [...prev, aiResponse]);
        }, Math.random() * 1000 + 500);

      } else {
        const errorResponse: Message = {
          id: `${Date.now()}-error-${agentId}`,
          sender: getAgentInfo(agentId),
          message: 'Sorry, there was an error connecting to the server.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false,
          agentId: agentId
        };

        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error(`Error calling API for agent ${agentId}:`, error);
      
      const errorResponse: Message = {
        id: `${Date.now()}-error-${agentId}`,
        sender: getAgentInfo(agentId),
        message: 'Sorry, there was an error connecting to the server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        agentId: agentId
      };

      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const toggleParticipant = (agentId: string) => {
    setActiveParticipants(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Enhanced Header with gradient background */}
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 ${isFullScreen ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <MessageCircle className="text-blue-600" size={isFullScreen ? 18 : 20} />
            </div>
            <div>
              <h2 className={`font-bold text-gray-900 ${isFullScreen ? 'text-lg' : 'text-xl'}`}>
                Workplace Chat
              </h2>
              <p className="text-sm text-gray-600">
                {activeParticipants.length > 1 
                  ? `${activeParticipants.length} participants active` 
                  : 'Group conversation'
                }
              </p>
            </div>
          </div>
          
          {/* Only show controls if not in full screen mode */}
          {!isFullScreen && (
            <div className="flex items-center space-x-2">
              {/* User personality selector - only show if not provided by parent */}
              {canChangePersonality && (
                <div className="relative personality-selector">
                  <button
                    onClick={() => setShowUserPersonality(!showUserPersonality)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <User size={14} />
                    <span className="font-medium">{userPersonality.name}</span>
                  </button>
                  
                  {showUserPersonality && (
                    <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-10 p-3 animate-in slide-in-from-top-2 duration-200">
                      <h3 className="font-semibold text-sm mb-3 text-gray-900">Choose your personality:</h3>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {userPersonalities.map(personality => (
                          <button
                            key={personality.id}
                            onClick={() => {
                              setUserPersonality(personality);
                              setShowUserPersonality(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 ${
                              userPersonality.id === personality.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-900">{personality.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{personality.style}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Participants selector - only show if not provided by parent */}
              {canChangeParticipants && (
                <div className="relative participant-selector">
                  <button
                    onClick={() => setShowParticipantSelector(!showParticipantSelector)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <Users size={14} />
                    <span className="font-medium">Add People</span>
                  </button>
                  
                  {showParticipantSelector && (
                    <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-10 p-3 animate-in slide-in-from-top-2 duration-200">
                      <h3 className="font-semibold text-sm mb-3 text-gray-900">Select participants:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableAgents.map(agent => (
                          <label
                            key={agent.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
                          >
                            <input
                              type="checkbox"
                              checked={activeParticipants.includes(agent.id)}
                              onChange={() => toggleParticipant(agent.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm flex-1">
                              <span className="mr-2">{agent.emoji}</span>
                              <span className="font-medium">{agent.name}</span>
                              <span className="text-gray-500 ml-1">({agent.role})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active participants display - enhanced design - only show if not in full screen */}
        {!isFullScreen && canChangeParticipants && activeParticipants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeParticipants.map(agentId => {
              const agent = availableAgents.find(a => a.id === agentId);
              return agent ? (
                <span key={agentId} className="inline-flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                  <span>{agent.emoji}</span>
                  <span className="font-medium">{agent.name}</span>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Enhanced Messages area with better scrolling */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 chat-messages">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <MessageCircle className="mx-auto mb-3 text-gray-400" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">Start the conversation!</h3>
              <p className="text-gray-600 text-sm">
                Send a message to begin your workplace simulation with {activeParticipants.length} participant{activeParticipants.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md ${
              message.isUser ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Enhanced Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm ${
                message.isUser 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-200' 
                  : message.agentId === 'manager_001' ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-white border-2 border-purple-200'
                  : message.agentId === 'developer_001' ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white border-2 border-blue-200'
                  : message.agentId === 'client_001' ? 'bg-gradient-to-br from-green-400 to-green-500 text-white border-2 border-green-200'
                  : message.agentId === 'hr_001' ? 'bg-gradient-to-br from-pink-400 to-pink-500 text-white border-2 border-pink-200'
                  : message.agentId === 'intern_001' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-2 border-yellow-200'
                  : message.agentId === 'qa_001' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white border-2 border-red-200'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white border-2 border-gray-200'
              }`}>
                {message.isUser ? 'You' : 
                 message.agentId === 'manager_001' ? '👔' :
                 message.agentId === 'developer_001' ? '💻' :
                 message.agentId === 'client_001' ? '💼' :
                 message.agentId === 'hr_001' ? '👥' :
                 message.agentId === 'intern_001' ? '🎓' :
                 message.agentId === 'qa_001' ? '🔍' : 'A'}
              </div>
              
              <div className={`flex flex-col ${
                message.isUser ? 'items-end' : 'items-start'
              }`}>
                {/* Sender name and role */}
                <div className={`mb-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs font-semibold text-gray-700">{message.sender}</span>
                  <span className="text-xs text-gray-500 ml-1">{message.timestamp}</span>
                </div>
                
                {/* Enhanced Message bubble */}
                <div className={`px-4 py-3 rounded-2xl shadow-sm max-w-full ${
                  message.isUser
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                } transition-all duration-200 hover:shadow-md`}>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end space-x-3 max-w-xs lg:max-w-md">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                💭
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-1 text-left">
                  <span className="text-xs font-semibold text-gray-500">Someone is typing...</span>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 rounded-bl-md">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message as ${userPersonality.name}...`}
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              rows={inputMessage.split('\n').length}
              maxLength={500}
              disabled={activeParticipants.length === 0}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || activeParticipants.length === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
        
        {/* Helpful message when no participants */}
        {canChangeParticipants && activeParticipants.length === 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 flex items-center">
              <Users size={16} className="mr-2" />
              Select at least one person to chat with using the "Add People" button above.
            </p>
          </div>
        )}
        
        {/* Character limit warning */}
        {inputMessage.length > 450 && (
          <div className="mt-2 text-xs text-amber-600 flex items-center">
            ⚠️ Character limit: {inputMessage.length}/500
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
