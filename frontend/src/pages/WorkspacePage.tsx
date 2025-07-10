// 📄 PAGE: WorkspacePage.tsx - All-in-one workspace for career development
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  Send, 
  MessageCircle,
  ChevronRight,
  PlayCircle,
  Users,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import DataManager from '../utils/dataManager';
import GoogleAIService from '../utils/GoogleAIService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  type: 'text';
}

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // User data state
  const [userData, setUserData] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [currentProject, setCurrentProject] = useState<any>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('hasCompletedOnboarding');
    const skillData = localStorage.getItem('userSkillData');
    
    if (!onboardingComplete && !skillData) {
      navigate('/onboarding');
      return;
    }

    // Load user data
    const userData = DataManager.getUserData();
    const roadmapData = DataManager.getRoadmapData();
    const projectContext = JSON.parse(localStorage.getItem('currentProjectContext') || '{}');
    
    setUserData(userData);
    setCurrentProject(projectContext);
    
    // Load progress data
    const savedProgress = localStorage.getItem('userProgress');
    const completedProjects = parseInt(localStorage.getItem('completedProjectsCount') || '0');
    
    setUserProgress({
      completedProjects,
      skillsImproved: savedProgress ? JSON.parse(savedProgress).skillsImproved || [] : [],
      nextGoal: userData?.careerGoals?.[0] || 'Professional growth',
      currentStreak: Math.floor(Math.random() * 7) + 1, // Mock streak
      totalHours: completedProjects * 8 + Math.floor(Math.random() * 20), // Mock hours
    });

    // Initialize chat with coach greeting
    const initialMessage: Message = {
      id: '1',
      content: `Hey there! 👋 Welcome to your workspace! 

I'm your AI Career Coach, and this is where all the magic happens. I can see you're working on ${userData?.careerGoals?.[0]?.toLowerCase() || 'your career goals'}, and I'm here to help you every step of the way.

**What would you like to focus on today?**
• Continue your current project
• Discuss your career roadmap  
• Get guidance on specific challenges
• Review your progress

Just ask me anything! 🚀`,
      sender: 'coach',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([initialMessage]);
  }, [navigate]);

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
      if (!userData) {
        throw new Error('User data not found');
      }
      
      // Check if Google AI is available
      if (!process.env.REACT_APP_GOOGLE_AI_API_KEY || process.env.REACT_APP_GOOGLE_AI_API_KEY === 'YOUR_ACTUAL_GOOGLE_AI_API_KEY_HERE') {
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
      
      let errorMessage = '🤔 **Oops! Something went wrong**\n\n';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage += `I need a valid Google AI API key to chat with you properly! 🔑

**Quick fix:**
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to your \`.env\` file as \`REACT_APP_GOOGLE_AI_API_KEY\`
3. Restart the app

Once that's set up, I'll be your fully-powered AI coach! 💪`;
        } else {
          errorMessage += `I ran into a technical hiccup: *${error.message}*

No worries though - try asking me again in a moment! 🔄`;
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

  const startProject = () => {
    if (!currentProject?.title) {
      // Create a new project
      const newProject = {
        title: `${userData?.improvementAreas?.[0] || 'Communication'} Challenge`,
        description: `Practice ${userData?.careerGoals?.[0]?.toLowerCase() || 'professional skills'} in a realistic work environment`,
        difficulty: userProgress?.completedProjects === 0 ? 'Beginner' : 'Intermediate',
        goals: [
          'Build confidence in professional communication',
          'Practice team collaboration',
          'Develop problem-solving skills'
        ],
        teamMembers: {
          manager: 'AI Project Manager - Supportive and experienced',
          teammate: 'AI Colleague - Collaborative and friendly'
        },
        startedAt: new Date().toISOString()
      };
      localStorage.setItem('currentProjectContext', JSON.stringify(newProject));
      localStorage.setItem('currentProjectId', 'project-1');
    }
    navigate('/project/project-1');
  };

  const quickActions = [
    { icon: PlayCircle, text: "Start project", action: startProject },
    { icon: Target, text: "Review goals", action: () => setMessageInput("Can you help me review my career goals?") },
    { icon: TrendingUp, text: "Check progress", action: () => setMessageInput("How am I progressing so far?") },
    { icon: Users, text: "Team help", action: () => setMessageInput("I need help with team dynamics") },
  ];

  if (!userData) {
    return <div className="flex items-center justify-center min-h-screen">Loading your workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col max-w-none mx-0 px-0">
        
        {/* Top Status Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">AI Career Coach</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="text-sm text-gray-600">
                Working on: <span className="font-medium">{userData.careerGoals?.[0] || 'Career growth'}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>{userProgress?.completedProjects || 0} projects</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>{userProgress?.skillsImproved?.length || 0} skills</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{userProgress?.totalHours || 0}h total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar - Progress & Actions */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Your Progress</h2>
              
              {/* Progress Cards */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-900">Current Streak</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {userProgress?.currentStreak || 1} days
                    </Badge>
                  </div>
                  <div className="text-xs text-blue-700">Keep up the momentum!</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-900">Next Milestone</span>
                    <span className="text-xs text-green-700">75% complete</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Project */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Current Project</h3>
              {currentProject?.title ? (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">{currentProject.title}</h4>
                  <p className="text-xs text-purple-700 mb-2">{currentProject.description}</p>
                  <Button size="sm" onClick={startProject} className="w-full">
                    <PlayCircle className="w-3 h-3 mr-1" />
                    Continue Project
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">No active project</div>
                  <Button size="sm" onClick={startProject} variant="outline">
                    <PlayCircle className="w-3 h-3 mr-1" />
                    Start New Project
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-6 flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="flex flex-col gap-1 h-auto py-3 text-xs"
                  >
                    <action.icon className="w-4 h-4" />
                    {action.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
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
                  <div className="max-w-[70%]">
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
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask your AI coach anything..."
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
