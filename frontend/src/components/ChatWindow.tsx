import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Users, Maximize2, Minimize2 } from 'lucide-react';
import './ChatWindow.css';
import { API_BASE_URL } from '../services/api';

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
  onToggleFullScreen?: () => void;
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
  isFullScreen: propIsFullScreen = false,
  onToggleFullScreen
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [internalFullScreen, setInternalFullScreen] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Control over personality and participants
  const canChangePersonality = !propUserPersonality;
  const canChangeParticipants = !propSelectedAgents;
  
  // Full screen state management
  const isFullScreen = propIsFullScreen || internalFullScreen;

  const handleToggleFullScreen = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
    } else {
      setInternalFullScreen(prev => !prev);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiResponse: Message = {
          id: `${Date.now()}-${agentId}-${Math.random()}`,
          sender: getAgentInfo(agentId),
          message: data.response,
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
          message: response.status === 422 
            ? 'Sorry, there was an issue with the message format. Please try again.'
            : response.status === 404
            ? `I'm not available right now. Please try a different team member.`
            : response.status === 500
            ? 'Our chat system is having technical difficulties. Please try again in a moment.'
            : 'I apologize, there seems to be a connection issue. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false,
          agentId: agentId
        };

        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error(`Error calling API for agent ${agentId}:`, error);        const errorResponse: Message = {
          id: `${Date.now()}-error-${agentId}`,
          sender: getAgentInfo(agentId),
          message: error instanceof Error && error.message.includes('Failed to fetch') 
            ? 'Unable to connect to the chat server. Please check if the backend is running.'
            : error instanceof Error && error.message.includes('404')
            ? `I'm not available right now. Please try a different team member.`
            : 'Sorry, I encountered an unexpected error. Please try again.',
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
    <>
      {/* Full screen backdrop */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleToggleFullScreen}
        />
      )}
      
      <div className={`bg-white shadow-lg border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
        isFullScreen 
          ? 'fixed inset-2 z-50 rounded-xl shadow-2xl' 
          : 'h-full rounded-2xl'
      }`} style={{ minHeight: isFullScreen ? '100vh' : 'auto' }}>
      {/* Ultra-compact Header */}
      <div className={`header-gradient border-b border-gray-100 ${isFullScreen ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <MessageCircle className="text-blue-600" size={isFullScreen ? 16 : 18} />
            </div>
            <div>
              <h2 className={`font-bold text-gray-900 ultra-compact ${isFullScreen ? 'text-base' : 'text-lg'}`}>
                Workplace Chat
              </h2>
              <p className="text-xs text-gray-600 ultra-compact">
                {activeParticipants.length > 1 
                  ? `${activeParticipants.length} participants` 
                  : 'Chat simulation'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {/* Full screen toggle button */}
            <button
              onClick={handleToggleFullScreen}
              className="compact-button flex items-center space-x-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200"
              title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
            >
              {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span className="font-medium">{isFullScreen ? 'Exit' : 'Full'}</span>
            </button>

            {/* Compact controls - only show if not in full screen mode */}
            {!isFullScreen && (
              <>
                {/* User personality selector - only show if not provided by parent */}
                {canChangePersonality && (
                <div className="relative personality-selector">
                  <button
                    onClick={() => setShowUserPersonality(!showUserPersonality)}
                    className="compact-button flex items-center space-x-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200"
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <User size={12} />
                    <span className="font-medium">{userPersonality.name}</span>
                  </button>
                  
                  {showUserPersonality && (
                    <div className="dropdown-enter absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-10 p-3">
                      <h3 className="font-semibold text-sm mb-2 text-gray-900 ultra-compact">Choose personality:</h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto minimal-scroll">
                        {userPersonalities.map(personality => (
                          <button
                            key={personality.id}
                            onClick={() => {
                              setUserPersonality(personality);
                              setShowUserPersonality(false);
                            }}
                            className={`w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors duration-150 ultra-compact ${
                              userPersonality.id === personality.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium text-sm text-gray-900">{personality.name}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{personality.style}</div>
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
                    className="compact-button flex items-center space-x-1 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all duration-200"
                  >
                    <Users size={12} />
                    <span className="font-medium">People</span>
                  </button>
                  
                  {showParticipantSelector && (
                    <div className="dropdown-enter absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-10 p-3">
                      <h3 className="font-semibold text-sm mb-2 text-gray-900 ultra-compact">Select participants:</h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto minimal-scroll">
                        {availableAgents.map(agent => (
                          <label
                            key={agent.id}
                            className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
                          >
                            <input
                              type="checkbox"
                              checked={activeParticipants.includes(agent.id)}
                              onChange={() => toggleParticipant(agent.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus-ring"
                            />
                            <span className="text-sm flex-1 ultra-compact">
                              <span className="mr-1">{agent.emoji}</span>
                              <span className="font-medium">{agent.name}</span>
                              <span className="text-gray-500 ml-1 text-xs">({agent.role})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </div>
        </div>

        {/* Ultra-compact active participants display - only show if not in full screen */}
        {!isFullScreen && canChangeParticipants && activeParticipants.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activeParticipants.slice(0, 5).map(agentId => {
              const agent = availableAgents.find(a => a.id === agentId);
              return agent ? (
                <span key={agentId} className="participant-badge inline-flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  <span>{agent.emoji}</span>
                  <span className="font-medium">{agent.name}</span>
                </span>
              ) : null;
            })}
            {activeParticipants.length > 5 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{activeParticipants.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Ultra-compact Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50 chat-messages min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-w-sm text-center">
              <MessageCircle className="mx-auto mb-2 text-gray-400" size={32} />
              <h3 className="font-medium text-gray-900 mb-1 text-sm">Start chatting!</h3>
              <p className="text-gray-600 text-xs mb-2">
                Chat with {activeParticipants.length} workplace{activeParticipants.length !== 1 ? ' professionals' : ' professional'}.
              </p>
              {activeParticipants.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {activeParticipants.slice(0, 3).map(agentId => {
                    const agent = availableAgents.find(a => a.id === agentId);
                    return agent ? (
                      <span key={agentId} className="inline-flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                        <span>{agent.emoji}</span>
                        <span className="font-medium">{agent.name}</span>
                      </span>
                    ) : null;
                  })}
                  {activeParticipants.length > 3 && (
                    <span className="text-xs text-gray-500">+{activeParticipants.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pb-3">
            {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} message-slide-in`}
          >
            <div className={`flex items-end space-x-2 message-max-width ${
              message.isUser ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Ultra-compact Avatar */}
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shadow-sm ${
                message.isUser 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                  : message.agentId === 'manager_001' ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-white'
                  : message.agentId === 'developer_001' ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                  : message.agentId === 'client_001' ? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                  : message.agentId === 'hr_001' ? 'bg-gradient-to-br from-pink-400 to-pink-500 text-white'
                  : message.agentId === 'intern_001' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                  : message.agentId === 'qa_001' ? 'bg-gradient-to-br from-red-400 to-red-500 text-white'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
              }`}>
                {message.isUser ? 'Y' : 
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
                {/* Ultra-compact Message bubble */}
                <div className={`px-3 py-2 rounded-2xl message-bubble max-w-full ultra-compact ${
                  message.isUser
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-snug">{message.message}</p>
                  <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span className="font-medium">{message.isUser ? 'You' : getAgentInfo(message.agentId!)}</span>
                    <span className="ml-1">{message.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Ultra-compact Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                💭
              </div>
              <div className="px-3 py-2 rounded-2xl bg-white border border-gray-100 rounded-bl-md">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>
        )}
      </div>

      {/* Ultra-compact Input area */}
      <div className="p-2.5 bg-white border-t border-gray-100">
        <div className="flex items-end space-x-2">
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
              className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              rows={Math.min(inputMessage.split('\n').length, 2)}
              maxLength={500}
              disabled={activeParticipants.length === 0}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || activeParticipants.length === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Ultra-compact warnings */}
        {canChangeParticipants && activeParticipants.length === 0 && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-center">
              <Users size={12} className="mr-1" />
              Select people to chat with using "People" above.
            </p>
          </div>
        )}
        
        {inputMessage.length > 450 && (
          <div className="mt-1 text-xs text-amber-600">
            ⚠️ {inputMessage.length}/500
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ChatWindow;
