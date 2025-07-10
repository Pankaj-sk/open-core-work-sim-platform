// 📄 PAGE: EnhancedProjectPage.tsx - Project workspace with AI persona introductions
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Send, 
  ArrowLeft,
  Brain,
  User,
  MessageCircle,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  Coffee,
  Lightbulb,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import DataManager from '../utils/dataManager';
import GoogleAIService from '../utils/GoogleAIService';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  personality: string;
  workingStyle: string;
  avatar: string;
  hasIntroduced: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'message' | 'introduction' | 'system';
}

interface Chat {
  id: string;
  title: string;
  type: 'group' | 'private';
  participants: string[];
  messages: Message[];
  lastActivity: string;
}

const EnhancedProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [showIntroductions, setShowIntroductions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = () => {
    const projectData = DataManager.getCurrentProject();
    if (projectData && projectData.id === projectId) {
      setProject(projectData);
      initializeTeamMembers(projectData);
      loadChats();
    } else {
      // Generate default project data
      const userData = DataManager.getUserData();
      const defaultProject = {
        id: projectId,
        title: 'E-commerce Platform Development',
        description: 'Build a full-stack e-commerce solution with modern technologies',
        objectives: [
          'Implement user authentication and authorization',
          'Design and build product catalog system',
          'Create shopping cart and checkout flow',
          'Integrate payment processing'
        ],
        duration: '8 weeks',
        difficulty: 'Intermediate',
        status: 'active'
      };
      setProject(defaultProject);
      initializeTeamMembers(defaultProject);
      generateInitialChats();
    }
    setLoading(false);
  };

  const initializeTeamMembers = (projectData: any) => {
    const members: TeamMember[] = [
      {
        id: 'user',
        name: DataManager.getUserData()?.name || 'You',
        role: 'Developer',
        personality: 'Eager to learn and contribute',
        workingStyle: 'Collaborative and detail-oriented',
        avatar: '👤',
        hasIntroduced: true
      },
      {
        id: 'sarah',
        name: 'Sarah Chen',
        role: 'Senior Developer',
        personality: 'Methodical and thorough mentor who loves helping others grow',
        workingStyle: 'Detail-oriented with a focus on code quality and best practices',
        avatar: '👩‍💻',
        hasIntroduced: false
      },
      {
        id: 'mike',
        name: 'Mike Rodriguez',
        role: 'Product Manager',
        personality: 'Strategic thinker with excellent communication skills',
        workingStyle: 'Big-picture focused while ensuring all details are covered',
        avatar: '👨‍💼',
        hasIntroduced: false
      },
      {
        id: 'alex',
        name: 'Alex Kim',
        role: 'UI/UX Designer',
        personality: 'Creative and user-focused with a passion for great design',
        workingStyle: 'Iterative design approach with constant user feedback',
        avatar: '🎨',
        hasIntroduced: false
      }
    ];
    setTeamMembers(members);
    
    // Check if introductions are needed
    const needsIntroductions = members.some(member => !member.hasIntroduced && member.id !== 'user');
    if (needsIntroductions) {
      setShowIntroductions(true);
    }
  };

  const generateInitialChats = () => {
    const initialChats: Chat[] = [
      {
        id: 'team-chat',
        title: 'Team Discussion',
        type: 'group',
        participants: ['user', 'sarah', 'mike', 'alex'],
        messages: [
          {
            id: '1',
            senderId: 'system',
            senderName: 'System',
            content: 'Welcome to your project workspace! Your AI team members are ready to introduce themselves.',
            timestamp: new Date().toISOString(),
            type: 'system'
          }
        ],
        lastActivity: new Date().toISOString()
      }
    ];
    setChats(initialChats);
    setActiveChat('team-chat');
  };

  const loadChats = () => {
    // Load existing chats from storage or generate initial ones
    const savedChats = localStorage.getItem(`project-chats-${projectId}`);
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0) {
        setActiveChat(parsedChats[0].id);
      }
    } else {
      generateInitialChats();
    }
  };

  const saveChats = (updatedChats: Chat[]) => {
    localStorage.setItem(`project-chats-${projectId}`, JSON.stringify(updatedChats));
    setChats(updatedChats);
  };

  const startIntroductions = async () => {
    setShowIntroductions(false);
    
    // Add introduction messages for each AI team member
    const membersToIntroduce = teamMembers.filter(member => !member.hasIntroduced && member.id !== 'user');
    
    for (let i = 0; i < membersToIntroduce.length; i++) {
      const member = membersToIntroduce[i];
      
      // Generate AI introduction
      try {
        const introPrompt = `You are ${member.name}, a ${member.role} with this personality: ${member.personality} and working style: ${member.workingStyle}. 
        
        Introduce yourself to the team in a friendly, professional way. Keep it concise (2-3 sentences) and show enthusiasm about working on the e-commerce platform project. 
        
        Mention one specific thing you're excited to contribute to the project.`;
        
        // For persona introduction, we'll use the coach response method but adapt the context
        const fakeUserData = {
          name: member.name,
          email: 'persona@simworld.com',
          currentRole: member.role,
          experienceLevel: 'intermediate',
          currentSkills: [],
          careerGoals: ['Contribute to project success'],
          improvementAreas: [],
          workplaceChallenges: [],
          communicationConcerns: [],
          availableTimePerWeek: '40 hours',
          preferredLearningStyle: 'collaborative',
          preferredProjectTypes: ['Team collaboration'],
          completedAt: new Date().toISOString(),
          version: '1.0'
        };
        
        const introMessage = `Please introduce yourself as ${member.name}, a ${member.role} with personality: ${member.personality} and working style: ${member.workingStyle}. Keep it concise (2-3 sentences) and show enthusiasm about working on the e-commerce platform project. Mention one specific thing you're excited to contribute.`;
        
        const introduction = await GoogleAIService.generateCoachResponse(
          introMessage, 
          fakeUserData,
          []
        );
        
        // Add introduction message
        const newMessage: Message = {
          id: `intro-${member.id}-${Date.now()}`,
          senderId: member.id,
          senderName: member.name,
          content: introduction,
          timestamp: new Date(Date.now() + i * 2000).toISOString(), // Stagger introductions
          type: 'introduction'
        };
        
        // Update the team chat
        setTimeout(() => {
          setChats(prevChats => {
            const updatedChats = prevChats.map(chat => {
              if (chat.id === 'team-chat') {
                return {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  lastActivity: newMessage.timestamp
                };
              }
              return chat;
            });
            saveChats(updatedChats);
            return updatedChats;
          });
          
          // Mark member as introduced
          setTeamMembers(prev => prev.map(m => 
            m.id === member.id ? { ...m, hasIntroduced: true } : m
          ));
        }, i * 3000); // Delay each introduction by 3 seconds
        
      } catch (error) {
        console.error('Error generating introduction:', error);
        // Fallback introduction
        const fallbackIntro = `Hi everyone! I'm ${member.name}, your ${member.role}. I'm excited to work with you all on this e-commerce platform project and bring my ${member.workingStyle.toLowerCase()} approach to help us succeed!`;
        
        const newMessage: Message = {
          id: `intro-${member.id}-${Date.now()}`,
          senderId: member.id,
          senderName: member.name,
          content: fallbackIntro,
          timestamp: new Date(Date.now() + i * 2000).toISOString(),
          type: 'introduction'
        };
        
        setTimeout(() => {
          setChats(prevChats => {
            const updatedChats = prevChats.map(chat => {
              if (chat.id === 'team-chat') {
                return {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  lastActivity: newMessage.timestamp
                };
              }
              return chat;
            });
            saveChats(updatedChats);
            return updatedChats;
          });
          
          setTeamMembers(prev => prev.map(m => 
            m.id === member.id ? { ...m, hasIntroduced: true } : m
          ));
        }, i * 3000);
      }
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeChat || sendingMessage) return;
    
    setSendingMessage(true);
    const messageContent = currentMessage.trim();
    setCurrentMessage('');
    
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'user',
      senderName: DataManager.getUserData()?.name || 'You',
      content: messageContent,
      timestamp: new Date().toISOString(),
      type: 'message'
    };
    
    // Update chat with user message
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          lastActivity: userMessage.timestamp
        };
      }
      return chat;
    });
    
    setChats(updatedChats);
    saveChats(updatedChats);
    
    // Generate AI response
    try {
      const activeTeamMember = teamMembers.find(member => 
        member.id !== 'user' && 
        chats.find(chat => chat.id === activeChat)?.participants.includes(member.id)
      );
      
      if (activeTeamMember) {
        const responsePrompt = `You are ${activeTeamMember.name}, a ${activeTeamMember.role} working on an e-commerce platform project. 
        
        Your personality: ${activeTeamMember.personality}
        Your working style: ${activeTeamMember.workingStyle}
        
        A team member just said: "${messageContent}"
        
        Respond in character, providing helpful insights or feedback related to the project. Keep your response conversational and supportive.`;
        
        // For persona responses, adapt to use coach response method
        const fakeUserData = {
          name: activeTeamMember.name,
          email: 'persona@simworld.com',
          currentRole: activeTeamMember.role,
          experienceLevel: 'intermediate',
          currentSkills: [],
          careerGoals: ['Contribute to project success'],
          improvementAreas: [],
          workplaceChallenges: [],
          communicationConcerns: [],
          availableTimePerWeek: '40 hours',
          preferredLearningStyle: 'collaborative',
          preferredProjectTypes: ['Team collaboration'],
          completedAt: new Date().toISOString(),
          version: '1.0'
        };
        
        const personaMessage = `As ${activeTeamMember.name} (${activeTeamMember.role}) with personality: ${activeTeamMember.personality} and working style: ${activeTeamMember.workingStyle}, respond to this team member who just said: "${messageContent}". Provide helpful insights or feedback related to the e-commerce platform project. Keep your response conversational and supportive.`;
        
        const aiResponse = await GoogleAIService.generateCoachResponse(
          personaMessage,
          fakeUserData,
          []
        );
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          senderId: activeTeamMember.id,
          senderName: activeTeamMember.name,
          content: aiResponse,
          timestamp: new Date().toISOString(),
          type: 'message'
        };
        
        // Add AI response after a brief delay
        setTimeout(() => {
          setChats(prevChats => {
            const updatedChats = prevChats.map(chat => {
              if (chat.id === activeChat) {
                return {
                  ...chat,
                  messages: [...chat.messages, aiMessage],
                  lastActivity: aiMessage.timestamp
                };
              }
              return chat;
            });
            saveChats(updatedChats);
            return updatedChats;
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
    
    setSendingMessage(false);
  };

  const createPrivateChat = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member || member.id === 'user') return;
    
    const privateChatId = `private-${member.id}`;
    const existingChat = chats.find(chat => chat.id === privateChatId);
    
    if (existingChat) {
      setActiveChat(privateChatId);
      return;
    }
    
    const newPrivateChat: Chat = {
      id: privateChatId,
      title: `Private: ${member.name}`,
      type: 'private',
      participants: ['user', member.id],
      messages: [
        {
          id: `welcome-${Date.now()}`,
          senderId: member.id,
          senderName: member.name,
          content: `Hi! Feel free to ask me anything about the project or if you need help with something specific. I'm here to support you! 😊`,
          timestamp: new Date().toISOString(),
          type: 'message'
        }
      ],
      lastActivity: new Date().toISOString()
    };
    
    const updatedChats = [...chats, newPrivateChat];
    setChats(updatedChats);
    saveChats(updatedChats);
    setActiveChat(privateChatId);
  };

  const getMemberAvatar = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member?.avatar || '👤';
  };

  const getMemberName = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project?.title}</h1>
              <p className="text-gray-600 text-sm">{project?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{project?.difficulty}</Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {project?.duration}
            </Badge>
          </div>
        </div>
      </div>

      {/* Introduction Modal */}
      <AnimatePresence>
        {showIntroductions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-md mx-4"
            >
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Meet Your AI Team!</h3>
                <p className="text-gray-600 mb-6">
                  Your AI teammates are ready to introduce themselves and start collaborating with you on this project.
                </p>
                <Button onClick={startIntroductions} size="lg" className="w-full">
                  <Users className="w-5 h-5 mr-2" />
                  Start Introductions
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Team Members */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Team Members</h3>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    member.id === 'user' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => member.id !== 'user' && createPrivateChat(member.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{member.avatar}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </div>
                    {member.id !== 'user' && (
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chats */}
          <div className="flex-1 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversations</h3>
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    chat.id === activeChat 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {chat.type === 'group' ? (
                      <Users className="w-4 h-4 text-gray-500" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900 text-sm">{chat.title}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {chat.messages.length} messages
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{getCurrentChat()?.title}</h3>
                <p className="text-sm text-gray-600">
                  {getCurrentChat()?.type === 'group' ? 'Team discussion' : 'Private conversation'}
                </p>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {getCurrentChat()?.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.senderId === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="text-2xl">{getMemberAvatar(message.senderId)}</div>
                      <div className={`max-w-xs lg:max-w-md ${message.senderId === 'user' ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {getMemberName(message.senderId)}
                          </span>
                          {message.type === 'introduction' && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Introduction
                            </Badge>
                          )}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.senderId === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : message.type === 'system'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-white border border-gray-200'
                        }`}>
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {sendingMessage && (
                    <div className="flex gap-3">
                      <div className="text-2xl">🤖</div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse">Thinking...</div>
                          <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={sendingMessage}
                  />
                  <Button onClick={sendMessage} disabled={!currentMessage.trim() || sendingMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Conversation</h3>
                <p className="text-gray-600">Choose a team member or group chat to start collaborating</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectPage;
