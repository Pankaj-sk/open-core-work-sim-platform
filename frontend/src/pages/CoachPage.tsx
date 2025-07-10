// 📄 PAGE: CoachPage.tsx - Dedicated AI Coach Chat Interface
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Sparkles, 
  MessageSquare, 
  User,
  Bot,
  ArrowRight,
  Play,
  Lightbulb
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import DataManager from '../utils/dataManager';
import GoogleAIService from '../utils/GoogleAIService';

interface ChatMessage {
  id: string;
  type: 'user' | 'coach';
  content: string;
  timestamp: Date;
  isIntro?: boolean;
  projectId?: string;
}

interface ProjectIntro {
  id: string;
  title: string;
  briefing: string;
  goals: string[];
  teamMembers: string[];
}

const CoachPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectIntro, setShowProjectIntro] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectIntro | null>(null);

  useEffect(() => {
    // Check if coming from project start
    const projectId = searchParams.get('project');
    const projectStartMode = localStorage.getItem('projectStartMode');
    
    if (projectId && projectStartMode === 'coach-intro') {
      setShowProjectIntro(true);
      loadProjectIntro(projectId);
      localStorage.removeItem('projectStartMode');
    } else {
      // Load existing chat history
      loadChatHistory();
    }
  }, [searchParams]);

  const loadProjectIntro = (projectId: string) => {
    // Remove hardcoded project intros, fetch from DataManager if needed
    const project = DataManager.getCurrentProject();
    if (project) {
      setCurrentProject({
        id: project.id,
        title: project.title,
        briefing: project.description || '',
        goals: project.objectives || [],
        teamMembers: project.teamMembers?.map((m: any) => m.name) || []
      });
      // Add coach intro message
      const introMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'coach',
        content: project.description || '',
        timestamp: new Date(),
        isIntro: true,
        projectId: projectId
      };
      setMessages([introMessage]);
    }
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem('coachChatHistory');
    if (saved) {
      const history = JSON.parse(saved);
      setMessages(history.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } else {
      // Welcome message for first time
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'coach',
        content: `Hello! I'm your AI Career Coach 👋\n\nI'm here to help you develop your professional skills through personalized guidance and practice scenarios. Ask me anything about your career development, or I can recommend the next project that would benefit you most!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveChatHistory = (updatedMessages: ChatMessage[]) => {
    // Don't save project intro messages to regular chat history
    const regularMessages = updatedMessages.filter(msg => !msg.isIntro);
    localStorage.setItem('coachChatHistory', JSON.stringify(regularMessages));
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get AI coach response
      const userData = DataManager.getUserSkillData();
      const userProgress = DataManager.getUserProgress();
      
      const context = `You are an expert AI Career Coach helping a professional develop their workplace skills. 
      
User's background:
- Name: ${userData?.name || 'Professional'}
- Role: ${userData?.currentRole || 'Not specified'}
- Experience: ${userData?.experienceLevel || 'Not specified'}
- Goals: ${userData?.careerGoals?.join(', ') || 'General professional development'}
- Areas to improve: ${userData?.improvementAreas?.join(', ') || 'Communication and leadership'}
- Completed projects: ${userProgress?.completedProjects || 0}

Respond as a warm, encouraging, and insightful career mentor. Be specific, actionable, and supportive. Keep responses conversational but professional.`;

      const response = await GoogleAIService.generateCoachResponse(
        inputMessage, 
        userData || {
          name: 'Professional',
          email: 'user@example.com',
          currentRole: 'Not specified',
          experienceLevel: 'intermediate',
          currentSkills: [],
          careerGoals: ['General professional development'],
          improvementAreas: ['Communication and leadership'],
          workplaceChallenges: [],
          communicationConcerns: ['Public speaking', 'Team collaboration'],
          availableTimePerWeek: '5-10 hours',
          preferredLearningStyle: 'hands-on',
          preferredProjectTypes: ['Team collaboration', 'Leadership'],
          completedAt: new Date().toISOString(),
          version: '1.0'
        },
        messages.slice(-5).map(msg => `${msg.type}: ${msg.content}`)
      );
      
      const coachMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, coachMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (error) {
      console.error('Error getting coach response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: "I apologize, but I'm having trouble responding right now. This might be due to an API key issue or connectivity problem. Please check your setup and try again.",
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const proceedToProject = () => {
    if (currentProject) {
      navigate(`/project/${currentProject.id}`);
    }
  };

  const backToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showProjectIntro ? 'Project Briefing' : 'AI Career Coach'}
          </h1>
          <p className="text-gray-600">
            {showProjectIntro ? 'Your coach is explaining your next challenge' : 'Your personal mentor for professional growth'}
          </p>
        </motion.div>

        {/* Chat Interface */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {/* Messages */}
            <div className="max-h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-500 ml-3' : 'bg-purple-500 mr-3'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.isIntro 
                          ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200' 
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      {message.isIntro && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <div className="flex items-center text-sm font-medium text-purple-700 mb-2">
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Learning Goals:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentProject?.goals.map((goal, index) => (
                              <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Coach is thinking...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-gray-50 p-4">
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={showProjectIntro ? "Ask questions about the project..." : "Ask your coach anything..."}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Intro Actions */}
        {showProjectIntro && currentProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center space-x-4"
          >
            <Button variant="outline" onClick={backToDashboard}>
              Back to Dashboard
            </Button>
            <Button onClick={proceedToProject} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Play className="mr-2 h-4 w-4" />
              Start Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CoachPage;
