// 📄 PAGE: CoachChatPage.tsx - Dedicated Coach Conversation Page
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  Send, 
  Target,
  TrendingUp,
  Map,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import DataManager from '../utils/dataManager';
import GoogleAIService from '../utils/GoogleAIService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'analysis';
}

const CoachChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with coach greeting
    const initialMessage: Message = {
      id: '1',
      content: `Hey there! 👋 I'm your AI Career Coach, and I'm genuinely excited to help you grow. 

I've got the full picture of your journey - your goals, challenges, and what makes you tick. Think of me as that colleague who's always in your corner, ready to brainstorm, problem-solve, or just chat about where you want to take your career.

What's on your mind today? Let's figure this out together! 🚀`,
      sender: 'coach',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([initialMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsTyping(true);

    try {
      const userData = DataManager.getUserData();
      if (!userData) {
        throw new Error('User data not found');
      }
      
      // Check if Google AI is available
      if (!process.env.REACT_APP_GOOGLE_AI_API_KEY) {
        throw new Error('Google AI API key not configured');
      }
      
      // Use Google AI Service
      const response = await GoogleAIService.generateCoachResponse(
        userMessage.content, 
        userData, 
        messages.slice(-5).map(m => `${m.sender}: ${m.content}`)
      );
      
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'coach',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, coachMessage]);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      let errorMessage = 'I apologize, but I encountered an issue.';
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorMessage = `⚠️ **Rate Limit Reached**

I'm experiencing high demand right now. Google AI API has temporary usage limits that prevent me from responding immediately.

**What this means:**
• Too many requests in a short time period
• This is a temporary limitation, not a permanent issue
• The API will reset shortly

**Please try again in a few minutes.** Thank you for your patience!`;
        } else if (error.message.includes('API key')) {
          errorMessage = `� **Oops! There's a configuration issue**

It looks like my connection to Google AI isn't set up properly. 

**What you can do:**
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to your \`.env\` file as \`REACT_APP_GOOGLE_AI_API_KEY\`
3. Restart the app

**Don't worry** - once that's fixed, I'll be back to my helpful self! 💪`;
        } else if (error.message.includes('not available')) {
          errorMessage = `🌐 **Connection hiccup!**

Looks like there's a network issue preventing me from reaching Google AI.

**Quick check:**
• Is your internet connection working?
• Are you behind a firewall that might be blocking the request?

**Try again in a moment** - these things usually resolve quickly! 🔄`;
        } else {
          errorMessage = `🤔 **Something unexpected happened**

I ran into a technical issue: *${error.message}*

**Here's what I know:**
• I'm powered by Google AI (Gemini)
• The error wasn't a typical rate limit or API key issue
• This is probably temporary

**Mind trying again?** If it keeps happening, the issue might be on Google's end. 🛠️`;
        }
      }
      
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        content: errorMessage,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    }
    
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: Map, text: "Explain my roadmap", action: () => setMessageInput("Can you explain my roadmap in detail?") },
    { icon: TrendingUp, text: "How am I progressing?", action: () => setMessageInput("How am I progressing so far?") },
    { icon: Users, text: "Team dynamics help", action: () => setMessageInput("I need help with team dynamics") },
    { icon: Target, text: "Career guidance", action: () => setMessageInput("I need career guidance") }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto flex flex-col h-screen">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Career Coach</h1>
                <p className="text-sm text-gray-500">Your friendly colleague for career growth</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Powered by Google AI
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                {message.sender === 'coach' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">AI Coach</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <div className="text-xs text-gray-400 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">AI Coach</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                placeholder="Message your AI Career Coach..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                style={{ minHeight: '44px' }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!messageInput.trim() || isTyping}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="text-xs rounded-full bg-gray-50 hover:bg-gray-100 border-gray-200"
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.text}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachChatPage;
