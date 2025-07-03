import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, MessageCircle, User, Users, CheckCheck, Check, X, LogOut } from 'lucide-react';
import './ChatWindowUltra.css';
import { API_BASE_URL } from '../services/api';

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  agentId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  optimisticId?: string; // For tracking optimistic updates
}

interface TypingState {
  [agentId: string]: {
    isTyping: boolean;
    startTime: number;
    timeoutId?: NodeJS.Timeout;
  };
}

interface ChatWindowProps {
  selectedAgent: string;
  selectedAgents?: string[];
  userPersonality?: UserPersonality | null;
  conversationTitle?: string;
  onEndConversation?: () => void;
  onLeaveConversation?: () => void;
}

interface UserPersonality {
  id: string;
  name: string;
  role: string;
  style: string;
}

const ChatWindowUltra: React.FC<ChatWindowProps> = ({ 
  selectedAgent, 
  selectedAgents: propSelectedAgents, 
  userPersonality: propUserPersonality,
  conversationTitle,
  onEndConversation,
  onLeaveConversation
}) => {
  // Optimized state management with refs for performance
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingStates, setTypingStates] = useState<TypingState>({});
  
  // Performance optimization refs
  const messagesRef = useRef<Message[]>([]);
  const lastMessageIdRef = useRef<string>('');
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const updateQueueRef = useRef<(() => void)[]>([]);
  const isUpdatingRef = useRef(false);

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // User personality with defaults
  const userPersonality = useMemo(() => propUserPersonality || {
    id: 'user',
    name: 'You',
    role: 'Project Manager',
    style: 'Professional'
  }, [propUserPersonality]);

  // Active participants management
  const activeParticipants = useMemo(() => {
    if (propSelectedAgents && propSelectedAgents.length > 0) {
      return propSelectedAgents;
    }
    return selectedAgent ? [selectedAgent] : [];
  }, [selectedAgent, propSelectedAgents]);

  // Agent info mapping for consistent display
  const getAgentInfo = useCallback((agentId: string): string => {
    const agentMap: { [key: string]: string } = {
      'sarah_manager': 'Sarah Johnson (Project Manager)',
      'alex_developer': 'Alex Chen (Senior Developer)', 
      'emma_designer': 'Emma Wilson (UX Designer)',
      'david_qa': 'David Kim (QA Engineer)',
      'lisa_analyst': 'Lisa Zhang (Business Analyst)',
      // Legacy mappings
      'technical_lead': 'Alex Chen (Technical Lead)',
      'manager': 'Sarah Johnson (Project Manager)',
      'developer': 'Alex Chen (Senior Developer)',
      'designer': 'Emma Wilson (UX Designer)',
      'qa_engineer': 'David Kim (QA Engineer)',
      'analyst': 'Lisa Zhang (Business Analyst)'
    };
    return agentMap[agentId] || `${agentId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Agent`;
  }, []);

  // Batched state updates for smooth performance
  const batchUpdate = useCallback((updateFn: () => void) => {
    updateQueueRef.current.push(updateFn);
    
    if (!isUpdatingRef.current) {
      isUpdatingRef.current = true;
      
      requestAnimationFrame(() => {
        const updates = updateQueueRef.current.splice(0);
        updates.forEach(update => update());
        isUpdatingRef.current = false;
      });
    }
  }, []);

  // Optimized scroll to bottom with immediate scroll for new messages
  const scrollToBottom = useCallback((force = false) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    const scrollFn = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: force ? 'auto' : 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    };
    
    if (force) {
      // Immediate scroll for new messages
      scrollFn();
    } else {
      scrollTimeoutRef.current = setTimeout(scrollFn, 16);
    }
  }, []);

  // Auto-scroll when new messages arrive (ChatGPT-like behavior)
  useEffect(() => {
    messagesRef.current = messages;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessage.id;
        // Always auto-scroll to new messages
        scrollToBottom(true); // Force immediate scroll
      }
    }
  }, [messages, scrollToBottom]);

  // Optimized typing indicator management
  const setTypingIndicator = useCallback((agentId: string, isTyping: boolean, duration = 6000) => {
    batchUpdate(() => {
      setTypingStates(prev => {
        const newState = { ...prev };
        
        // Clear existing timeout
        if (newState[agentId]?.timeoutId) {
          clearTimeout(newState[agentId].timeoutId);
        }
        
        if (isTyping) {
          // Set typing with auto-cleanup
          const timeoutId = setTimeout(() => {
            batchUpdate(() => {
              setTypingStates(current => {
                const updated = { ...current };
                delete updated[agentId];
                return updated;
              });
            });
          }, duration);
          
          newState[agentId] = {
            isTyping: true,
            startTime: Date.now(),
            timeoutId
          };
        } else {
          // Remove typing indicator
          delete newState[agentId];
        }
        
        return newState;
      });
    });
  }, [batchUpdate]);

  // Ultra-optimized message sending with immediate UI feedback
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    // Generate optimistic ID
    const optimisticId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Clear input immediately - ZERO delay
    setInputMessage('');

    // Create optimistic user message
    const userMessage: Message = {
      id: optimisticId,
      sender: `${userPersonality.name}`,
      message: trimmedMessage,
      timestamp,
      isUser: true,
      status: 'sending',
      optimisticId
    };

    // Add message with immediate UI update - NO BATCHING for user messages
    setMessages(prev => [...prev, userMessage]);

    // Update to sent status after minimal delay
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.optimisticId === optimisticId 
            ? { ...msg, status: 'sent', id: `sent_${Date.now()}` }
            : msg
        )
      );
    }, 150);

    // Update to delivered after user sees sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.optimisticId === optimisticId 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 300);

    // Process agent responses with realistic timing
    activeParticipants.forEach((agentId, index) => {
      // Staggered response timing for natural conversation
      const responseDelay = index * 400 + Math.random() * 600; // 0-1 second stagger
      
      setTimeout(() => {
        // Start typing immediately
        setTypingIndicator(agentId, true, 8000);
        
        // Fetch response
        fetchAgentResponse(agentId, trimmedMessage, userPersonality, optimisticId);
      }, responseDelay);
    });

  }, [inputMessage, userPersonality, activeParticipants, setTypingIndicator]);

  // Optimized API call with streaming-like response
  const fetchAgentResponse = useCallback(async (
    agentId: string, 
    userInput: string, 
    personality: UserPersonality,
    userMessageId: string
  ) => {
    const startTime = Date.now();
    
    try {
      // Make API call
      const response = await fetch(`${API_BASE_URL}/chat`, {
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
        
        // Natural typing duration (1.5-4 seconds)
        const naturalTypingTime = 1500 + (data.message.length * 30) + Math.random() * 1500;
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(500, naturalTypingTime - elapsed); // Min 500ms
        
        setTimeout(() => {
          // Remove typing indicator
          setTypingIndicator(agentId, false);
          
          // Create AI message
          const aiMessage: Message = {
            id: `ai_${Date.now()}_${agentId}_${Math.random().toString(36).substr(2, 9)}`,
            sender: data.agent_name || getAgentInfo(agentId),
            message: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: false,
            agentId: agentId,
            status: 'delivered'
          };

          // Add message immediately
          setMessages(prev => [...prev, aiMessage]);
          
          // Mark user message as read (agent saw it)
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.optimisticId === userMessageId ? { ...msg, status: 'read' } : msg
              )
            );
          }, 200);
          
          // Mark AI message as read after user "sees" it
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessage.id ? { ...msg, status: 'read' } : msg
              )
            );
          }, 800);
          
        }, remainingTime);

      } else {
        // Handle errors gracefully
        setTypingIndicator(agentId, false);
        
        setTimeout(() => {
          const errorMessage: Message = {
            id: `error_${Date.now()}_${agentId}`,
            sender: getAgentInfo(agentId),
            message: getErrorMessage(response.status),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: false,
            agentId: agentId,
            status: 'delivered'
          };

          setMessages(prev => [...prev, errorMessage]);
        }, 800);
      }
    } catch (error) {
      setTypingIndicator(agentId, false);
      console.error(`Error calling API for agent ${agentId}:`, error);
      
      setTimeout(() => {
        const errorMessage: Message = {
          id: `error_${Date.now()}_${agentId}`,
          sender: getAgentInfo(agentId),
          message: 'Unable to connect to the chat server. Please check your connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false,
          agentId: agentId,
          status: 'delivered'
        };

        setMessages(prev => [...prev, errorMessage]);
      }, 800);
    }
  }, [getAgentInfo, setTypingIndicator]);

  // Error message helper
  const getErrorMessage = useCallback((status: number): string => {
    switch (status) {
      case 422:
        return 'Sorry, there was an issue with the message format. Please try again.';
      case 404:
        return "I'm not available right now. Please try a different team member.";
      case 500:
        return 'Our chat system is having technical difficulties. Please try again in a moment.';
      default:
        return 'I apologize, there seems to be a connection issue. Please try again.';
    }
  }, []);

  // Handle input changes with debouncing for performance
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);

  // Handle enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Generate conversation title based on participants
  const getConversationTitle = useCallback(() => {
    if (conversationTitle) return conversationTitle;
    
    if (activeParticipants.length === 0) {
      return "Team Chat";
    } else if (activeParticipants.length === 1) {
      return getAgentInfo(activeParticipants[0]).split(' (')[0];
    } else {
      return `Team Discussion (${activeParticipants.length} members)`;
    }
  }, [conversationTitle, activeParticipants, getAgentInfo]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  const MessageStatus: React.FC<{ status?: string }> = ({ status }) => {
    switch (status) {
      case 'sending':
        return <div className="status-icon sending"></div>;
      case 'sent':
        return <Check size={14} className="status-icon sent" />;
      case 'delivered':
        return <CheckCheck size={14} className="status-icon delivered" />;
      case 'read':
        return <CheckCheck size={14} className="status-icon read" />;
      default:
        return null;
    }
  };

  // Typing indicator component
  const TypingIndicator: React.FC<{ agentId: string }> = ({ agentId }) => (
    <div className="message ai-message typing-message" key={`typing-${agentId}`}>
      <div className="message-avatar">
        <User size={20} />
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">{getAgentInfo(agentId)}</span>
        </div>
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );

  // Team introduction for new conversations
  const generateTeamIntroduction = useCallback(() => {
    const teamMembers = [
      "Sarah Johnson (Project Manager) - coordinates our team and keeps projects on track",
      "Alex Chen (Senior Developer) - our technical lead who mentors and builds great solutions", 
      "Emma Wilson (UX Designer) - creates beautiful, user-friendly experiences",
      "David Kim (QA Engineer) - ensures quality and catches issues before users see them",
      "Lisa Zhang (Business Analyst) - bridges business needs with technical solutions"
    ];
    
    const introMessage: Message = {
      id: `intro-${Date.now()}`,
      sender: "Team Assistant",
      message: `Welcome to our team workspace! 👋\n\nYou're now connected with our close-knit team:\n\n${teamMembers.map(member => `• ${member}`).join('\n')}\n\nEveryone here knows each other well and collaborates daily. Feel free to introduce yourself and let us know how we can help!`,
      timestamp: new Date().toLocaleTimeString(),
      isUser: false,
      agentId: 'system',
      status: 'delivered'
    };
    
    return introMessage;
  }, []);

  // Add team introduction on first load
  useEffect(() => {
    if (messages.length === 0) {
      const introMessage = generateTeamIntroduction();
      setMessages([introMessage]);
    }
  }, [messages.length, generateTeamIntroduction]);

  return (
    <div className="chat-window-ultra">
      {/* Header - Fixed at top like ChatGPT */}
      <div className="chat-header">
        <div className="header-left">
          <MessageCircle size={20} />
          <div className="header-info">
            <h3>{getConversationTitle()}</h3>
            <span className="participants-count">
              {activeParticipants.length === 0 
                ? "No participants" 
                : `${activeParticipants.length} participant${activeParticipants.length !== 1 ? 's' : ''} active`
              }
            </span>
          </div>
        </div>
        <div className="header-right">
          {onLeaveConversation && (
            <button
              onClick={onLeaveConversation}
              className="conversation-action-btn leave-btn"
              title="Leave Conversation"
            >
              <LogOut size={18} />
              <span>Leave</span>
            </button>
          )}
          {onEndConversation && (
            <button
              onClick={onEndConversation}
              className="conversation-action-btn end-btn"
              title="End Conversation"
            >
              <X size={18} />
              <span>End Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages container - Fixed positioning with proper spacing */}
      <div className="messages-container" ref={chatContainerRef}>
        <div className="messages-wrapper">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
              style={{
                animationDelay: `${Math.random() * 100}ms`
              }}
            >
              {!message.isUser && (
                <div className="message-avatar">
                  <User size={20} />
                </div>
              )}
              <div className="message-content">
                {!message.isUser && (
                  <div className="message-header">
                    <span className="sender-name">{message.sender}</span>
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{message.message}</div>
                  <div className="message-meta">
                    <span className="message-time">{message.timestamp}</span>
                    {message.isUser && <MessageStatus status={message.status} />}
                  </div>
                </div>
              </div>
              {message.isUser && (
                <div className="message-avatar user-avatar">
                  <Users size={20} />
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicators */}
          {Object.entries(typingStates).map(([agentId, state]) => 
            state.isTyping && <TypingIndicator key={`typing-${agentId}`} agentId={agentId} />
          )}
          
          {/* Scroll anchor - ensures auto-scroll works */}
          <div ref={messagesEndRef} style={{ height: '20px' }} />
        </div>
      </div>

      {/* Fixed input area - Always visible at bottom like ChatGPT */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="message-input"
            autoComplete="off"
          />
          <button
            onClick={handleSendMessage}
            className={`send-button ${inputMessage.trim() ? 'active' : ''}`}
            disabled={!inputMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindowUltra;
