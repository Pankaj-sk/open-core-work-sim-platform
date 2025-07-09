// 📄 PAGE: ProjectPage.tsx - Single project workspace for MVP
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Send, 
  Plus,
  X,
  User,
  Brain,
  ArrowLeft,
  Activity,
  CheckCircle,
  Target
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

interface ProjectDetails {
  project: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    current_phase: string;
    settings?: any;
  };
  team_members: Array<{
    id: number;
    name: string;
    role: string;
    is_user: boolean;
    experience_level: string;
    reporting_to: string | null;
  }>;
  user_role: string;
}

interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  status: string;
  start_time: string;
  end_time: string | null;
  participant_count: number;
  message_count: number;
}

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

const CONVERSATION_TYPES = [
  { value: 'daily_standup', label: 'Daily Standup' },
  { value: 'team_meeting', label: 'Team Meeting' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'one_on_one', label: 'One-on-One' },
  { value: 'project_planning', label: 'Project Planning' },
  { value: 'casual_chat', label: 'Casual Chat' }
];

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({
    title: '',
    type: '',
    description: ''
  });
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Load project details
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const response = await apiService.getProjectDetails(projectId);
        if (response.success && response.data) {
          setProject(response.data);
          loadConversations();
          loadDashboardData(response.data);
        } else {
          // Fallback to localStorage for demo mode
          console.log('API not available, using localStorage fallback');
          loadProjectFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading project from API:', error);
        // Fallback to localStorage for demo mode
        loadProjectFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    const loadProjectFromLocalStorage = () => {
      const projectContext = localStorage.getItem('currentProjectContext');
      const skillData = JSON.parse(localStorage.getItem('userSkillData') || '{}');
      
      if (projectContext) {
        const context = JSON.parse(projectContext);
        const fallbackProject: ProjectDetails = {
          project: {
            id: projectId || 'demo-project-1',
            name: context.title || 'Career Development Project',
            description: context.description || 'Practice workplace skills through AI-powered simulation',
            created_at: context.startedAt || new Date().toISOString(),
            current_phase: 'active',
            settings: {}
          },
          team_members: [
            {
              id: 1,
              name: 'You',
              role: skillData.role || 'Team Member',
              is_user: true,
              experience_level: skillData.experience || 'intermediate',
              reporting_to: null
            },
            {
              id: 2,
              name: 'AI Project Manager',
              role: 'Project Manager',
              is_user: false,
              experience_level: 'senior',
              reporting_to: null
            },
            {
              id: 3,
              name: 'AI Team Member',
              role: 'Collaborator',
              is_user: false,
              experience_level: 'intermediate',
              reporting_to: 'AI Project Manager'
            }
          ],
          user_role: skillData.role || 'team_member'
        };
        
        setProject(fallbackProject);
        loadDashboardData(fallbackProject);
      }
    };

    loadProject();
  }, [projectId]);

  const loadConversations = async () => {
    if (!projectId) return;
    
    try {
      const response = await apiService.getProjectConversations(projectId);
      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      } else {
        // For demo mode, start with empty conversations
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // For demo mode, start with empty conversations
      setConversations([]);
    }
  };

  const loadDashboardData = async (projectData: ProjectDetails) => {
    if (!projectId || !projectData) return;
    
    try {
      setDashboardLoading(true);
      const [dashboardResponse, tasksResponse] = await Promise.all([
        apiService.getDashboardData(projectId),
        apiService.getRoleTasks(projectId, projectData.user_role)
      ]);
      
      if (dashboardResponse.success && tasksResponse.success) {
        setDashboardData({
          dashboard: dashboardResponse.data,
          tasks: tasksResponse.data
        });
      } else {
        // Fallback dashboard data when API is not configured
        setDashboardData({
          dashboard: {
            tasks: [
              'Familiarize yourself with the project requirements',
              'Set up your development environment',
              'Review team member roles and responsibilities'
            ],
            feedback: "Welcome to your project workspace! Start by introducing yourself to your AI team members through a conversation.",
            suggestions: [
              'Start with a team introduction meeting',
              'Schedule a project planning session',
              'Set up your daily standup routine'
            ],
            deadlines: [],
            responsibilities: [
              `As a ${projectData.user_role}, you'll be responsible for contributing to the project goals`,
              'Participate actively in team discussions',
              'Collaborate effectively with your AI team members'
            ]
          },
          tasks: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback data
      setDashboardData({
        dashboard: {
          tasks: ['Welcome to your project! Start a conversation to begin.'],
          feedback: "Get started by chatting with your AI team members.",
          suggestions: ['Try starting a team meeting conversation'],
          deadlines: [],
          responsibilities: [`Practice your ${projectData.user_role} skills in this simulated environment`]
        },
        tasks: []
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newConversationForm.title || !newConversationForm.type) {
      return;
    }

    try {
      setSending(true);
      const response = await apiService.startConversation(
        projectId!,
        newConversationForm.type,
        newConversationForm.title,
        [] // participants - empty for now, will be populated by backend
      );

      if (response.success) {
        setShowNewConversation(false);
        setNewConversationForm({ title: '', type: '', description: '' });
        loadConversations();
        
        if (response.data?.conversation_id) {
          loadConversationDetails(response.data.conversation_id);
        }
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setSending(false);
    }
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
      setConversationLoading(true);
      const response = await apiService.getConversationDetails(projectId!, conversationId);
      if (response.success && response.data) {
        setCurrentConversation(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error);
    } finally {
      setConversationLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation) return;

    try {
      setSending(true);
      const response = await apiService.sendMessage(
        projectId!,
        currentConversation.conversation.id,
        messageInput.trim()
      );

      if (response.success) {
        setMessageInput('');
        // Reload conversation to show new messages
        loadConversationDetails(currentConversation.conversation.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const getPhaseVariant = (phase: string) => {
    switch (phase) {
      case 'planning': return 'secondary';
      case 'development': return 'default';
      case 'testing': return 'outline';
      case 'completed': return 'destructive';
      default: return 'secondary';
    }
  };

  const groupConversationsByDay = (conversations: Conversation[]) => {
    const grouped: { [key: string]: Conversation[] } = {};
    
    conversations.forEach(conv => {
      const date = new Date(conv.start_time);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dayLabel;
      if (date.toDateString() === today.toDateString()) {
        dayLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Yesterday';
      } else {
        dayLabel = date.toLocaleDateString();
      }
      
      if (!grouped[dayLabel]) {
        grouped[dayLabel] = [];
      }
      grouped[dayLabel].push(conv);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen p-6"
      >
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {project.project.name}
                      </h1>
                      <Badge variant={getPhaseVariant(project.project.current_phase)} className="mt-1">
                        {project.project.current_phase}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-lg mb-4">{project.project.description}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {project.team_members?.length || 0} members
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(project.project.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your role: <Badge variant="secondary">{project.user_role}</Badge>
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="ml-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Panel - Navigation & Info */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="conversations">Chat</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="conversations" className="p-6 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Conversations</h3>
                      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Start New Conversation</DialogTitle>
                            <DialogDescription>
                              Begin a new conversation with your AI team members
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateConversation} className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Title</label>
                              <Input
                                required
                                value={newConversationForm.title}
                                onChange={(e) => setNewConversationForm({...newConversationForm, title: e.target.value})}
                                placeholder="e.g., Morning standup, Project planning"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Type</label>
                              <select
                                required
                                value={newConversationForm.type}
                                onChange={(e) => setNewConversationForm({...newConversationForm, type: e.target.value})}
                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="">Select conversation type</option>
                                {CONVERSATION_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                              <Button type="button" variant="outline" onClick={() => setShowNewConversation(false)} disabled={sending}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={sending}>
                                {sending ? 'Starting...' : 'Start Conversation'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {conversations.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No conversations yet</p>
                        <p className="text-sm text-muted-foreground">Start your first chat with your AI team!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(groupConversationsByDay(conversations)).map(([day, dayConversations]) => (
                          <div key={day}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{day}</h4>
                            <div className="space-y-2">
                              {dayConversations.map((conv) => (
                                <Card 
                                  key={conv.id} 
                                  className={`cursor-pointer transition-all border-l-4 ${
                                    currentConversation?.conversation.id === conv.id 
                                      ? 'border-l-blue-500 bg-blue-50' 
                                      : 'border-l-transparent hover:bg-gray-50'
                                  }`}
                                  onClick={() => loadConversationDetails(conv.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{conv.title}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{conv.conversation_type.replace('_', ' ')}</p>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{conv.message_count} msgs</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {conv.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="overview" className="p-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <div className="space-y-3">
                      {(project.team_members || []).map((member, index) => (
                        <Card key={member.id || index} className="border-0 bg-gradient-to-br from-gray-50 to-gray-100">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className={member.is_user ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                                  {member.name?.substring(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{member.name}</p>
                                  {member.is_user && <Badge variant="secondary" className="text-xs">You</Badge>}
                                  {!member.is_user && <Badge variant="outline" className="text-xs">AI</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                {member.experience_level && (
                                  <p className="text-xs text-muted-foreground capitalize">{member.experience_level} level</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Center Panel - Main Content */}
          <div className="lg:col-span-2">
            {currentConversation ? (
              <Card className="border-0 shadow-lg h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{currentConversation.conversation.title}</CardTitle>
                      <CardDescription className="capitalize">
                        {currentConversation.conversation.conversation_type.replace('_', ' ')} • {currentConversation.participants.length} participants
                      </CardDescription>
                    </div>
                    <Badge variant={currentConversation.conversation.status === 'active' ? 'default' : 'secondary'}>
                      {currentConversation.conversation.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <Separator />
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversationLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : currentConversation.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Conversation started!</p>
                          <p className="text-sm text-muted-foreground">Send a message to begin chatting with your AI team.</p>
                        </div>
                      </div>
                    ) : (
                      currentConversation.messages.map((message, index) => {
                        const isAI = message.sender_id !== 'user' && !message.sender_name.toLowerCase().includes('you');
                        return (
                          <div key={message.id || index} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              isAI 
                                ? 'bg-gray-100 text-gray-900' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{message.sender_name}</span>
                                <span className="text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Message Input */}
                  {currentConversation.conversation.status === 'active' && (
                    <>
                      <Separator />
                      <div className="p-4">
                        <form onSubmit={sendMessage} className="flex gap-2">
                          <Input
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={sending}
                            className="flex-1"
                          />
                          <Button type="submit" disabled={sending || !messageInput.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg h-[600px] flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to Your Project Workspace</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Start a conversation with your AI team members to begin practicing your workplace collaboration skills.
                  </p>
                  <Button onClick={() => setShowNewConversation(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Your First Conversation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Dashboard Data Section */}
        {dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* AI Coach Feedback */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-3 h-5 w-5 text-blue-600" />
                  AI Coach Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-800 italic">{dashboardData.dashboard.feedback}</p>
                </div>
                {dashboardData.dashboard.suggestions && dashboardData.dashboard.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Suggestions:</h4>
                    <ul className="space-y-1">
                      {dashboardData.dashboard.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks & Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-3 h-5 w-5 text-green-600" />
                  Your Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.dashboard.tasks && dashboardData.dashboard.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {dashboardData.dashboard.tasks.map((task: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Target className="mr-2 h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{task}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No tasks yet. Start a conversation to get personalized tasks from your AI coach.</p>
                )}
                
                {dashboardData.dashboard.responsibilities && dashboardData.dashboard.responsibilities.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-2">Your Responsibilities:</h4>
                    <ul className="space-y-1">
                      {dashboardData.dashboard.responsibilities.map((resp: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
