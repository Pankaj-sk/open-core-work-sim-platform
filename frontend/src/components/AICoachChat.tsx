// 🤖 COMPONENT: AICoachChat.tsx - Floating AI coach chat window
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Brain,
  Sparkles 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

interface AICoachChatProps {
  className?: string;
}

const AICoachChat: React.FC<AICoachChatProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('aiCoachWelcomeSeen');
    if (!hasSeenWelcome) {
      setMessages([{
        id: 'welcome',
        content: "👋 Hi! I'm your AI Career Coach. I'm here to help you navigate your professional development journey. Ask me anything about workplace skills, career goals, or get feedback on your progress!",
        sender: 'coach',
        timestamp: new Date()
      }]);
      localStorage.setItem('aiCoachWelcomeSeen', 'true');
    } else {
      // Load previous messages from localStorage
      const savedMessages = localStorage.getItem('aiCoachMessages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiCoachMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateCoachResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response based on user input
    const responses = {
      greeting: [
        "Hello! I'm excited to help you grow professionally. What would you like to work on today?",
        "Great to see you! Let's continue building your career skills. How can I assist you?"
      ],
      skills: [
        "Building workplace skills is crucial for career success. What specific skills are you looking to develop?",
        "I can help you identify key skills for your role. Are you focusing on technical skills, soft skills, or leadership abilities?"
      ],
      feedback: [
        "I'd be happy to provide feedback! Based on your recent activities, you're making good progress. What specific area would you like feedback on?",
        "Feedback is essential for growth. Tell me about a recent interaction or project, and I'll help you reflect on it."
      ],
      goals: [
        "Setting clear career goals is important. What's your main professional objective right now?",
        "Great question! Let's break down your career aspirations. What does success look like to you in the next 6 months?"
      ],
      default: [
        "That's an interesting question! Can you tell me more about your specific situation?",
        "I'm here to help with your professional development. Could you provide more context so I can give you the best advice?",
        "Thanks for reaching out! What aspect of your career or workplace skills would you like to focus on?"
      ]
    };

    const message = userMessage.toLowerCase();
    let responseType = 'default';

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      responseType = 'greeting';
    } else if (message.includes('skill') || message.includes('learn') || message.includes('improve')) {
      responseType = 'skills';
    } else if (message.includes('feedback') || message.includes('how am i') || message.includes('progress')) {
      responseType = 'feedback';
    } else if (message.includes('goal') || message.includes('career') || message.includes('future')) {
      responseType = 'goals';
    }

    const responseArray = responses[responseType as keyof typeof responses];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const coachResponse = await generateCoachResponse(userMessage.content);
      
      const coachMessage: Message = {
        id: `coach-${Date.now()}`,
        content: coachResponse,
        sender: 'coach',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm having trouble connecting right now. Please try again in a moment!",
        sender: 'coach',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4"
          >
            <Card className={`w-80 h-96 shadow-2xl border-0 bg-white ${isMinimized ? 'h-14' : ''}`}>
              <CardHeader className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">AI Career Coach</CardTitle>
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-80">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.sender === 'coach' && (
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">AI Coach</span>
                            </div>
                          )}
                          <p>{message.content}</p>
                          <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">AI Coach</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-3 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask your AI coach..."
                        disabled={isLoading}
                        className="flex-1 text-sm"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <Brain className="w-6 h-6" />
          </Button>
          {messages.length === 1 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs animate-pulse">
              New
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AICoachChat;
