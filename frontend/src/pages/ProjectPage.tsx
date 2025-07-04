import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Send, 
  Plus,
  X,
  User,
  Brain,
  History,
  Video,
  Code,
  Upload,
  Phone,
  ArrowLeft,
  Activity,
  TrendingUp,
  CheckCircle,
  Settings,
  Search,
  FileText,
  Trash2,
  UserCheck,
  Timer
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';

interface ProjectDetails {
  project: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    current_phase: string;
    settings: any;
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
  { value: 'status_update', label: 'Status Update' },
  { value: 'casual_chat', label: 'Casual Chat' }
];

const CALL_TYPES = [
  { value: 'team_meeting', label: 'Team Meeting' },
  { value: 'daily_standup', label: 'Daily Standup' },
  { value: 'one_on_one', label: 'One-on-One' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'project_planning', label: 'Project Planning' },
  { value: 'retrospective', label: 'Retrospective' },
  { value: 'demo', label: 'Demo/Presentation' }
];

const CODE_CATEGORIES = [
  { value: 'general', label: 'General Code' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'config', label: 'Configuration' },
  { value: 'docs', label: 'Documentation' },
  { value: 'tests', label: 'Tests' }
];

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [showUploadCode, setShowUploadCode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [callForm, setCallForm] = useState({
    title: '',
    type: 'team_meeting',
    date: '',
    time: '',
    duration: 30,
    participants: [] as string[],
    agenda: ''
  });
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    description: '',
    category: 'general'
  });

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getProjectDetails(projectId);
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        console.error('Failed to load project');
        setProject(null);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadConversations = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const response = await apiService.getProjectConversations(projectId);
      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [projectId]);

  const loadDashboardData = useCallback(async () => {
    if (!projectId || !project) return;
    
    try {
      setDashboardLoading(true);
      const [dashboardResponse, tasksResponse] = await Promise.all([
        apiService.getDashboardData(projectId),
        apiService.getRoleTasks(projectId, project.user_role)
      ]);
      
      if (dashboardResponse.success && tasksResponse.success) {
        setDashboardData({
          dashboard: dashboardResponse.data,
          tasks: tasksResponse.data
        });
      } else {
        setDashboardData({
          dashboard: {
            tasks: [],
            feedback: "Please configure AI API keys in .env file to get personalized dashboard content.",
            suggestions: [],
            deadlines: [],
            responsibilities: []
          },
          tasks: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData({
        dashboard: {
          tasks: [],
          feedback: "Error loading dashboard content. Please check your API configuration.",
          suggestions: ["Add GOOGLE_API_KEY to .env file for AI-powered insights"],
          deadlines: [],
          responsibilities: []
        },
        tasks: []
      });
    } finally {
      setDashboardLoading(false);
    }
  }, [projectId, project]);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadConversations();
    }
  }, [projectId, loadProject, loadConversations]);

  useEffect(() => {
    if (project && projectId) {
      loadDashboardData();
    }
  }, [project, projectId, loadDashboardData]);

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
          navigate(`/projects/${projectId}/conversations/${response.data.conversation_id}`);
        }
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setSending(false);
    }
  };

  const handleScheduleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!callForm.title || !callForm.date || !callForm.time) {
      return;
    }

    try {
      setSending(true);
      
      // Create a call ID based on timestamp
      const callId = `call-${Date.now()}`;
      const callDateTime = new Date(`${callForm.date}T${callForm.time}`);
      
      // Store call details in localStorage for the call page to access
      const callDetails = {
        id: callId,
        projectId: projectId,
        title: callForm.title,
        type: callForm.type,
        scheduledTime: callDateTime.toISOString(),
        duration: callForm.duration,
        participants: callForm.participants,
        agenda: callForm.agenda,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`call-${callId}`, JSON.stringify(callDetails));
      
      // Also create a conversation for the scheduled call
      const response = await apiService.startConversation(
        projectId!,
        callForm.type,
        `📞 ${callForm.title} (Scheduled for ${callDateTime.toLocaleString()})`,
        [] // participants will be populated by backend
      );

      setShowScheduleCall(false);
      setCallForm({
        title: '',
        type: 'team_meeting',
        date: '',
        time: '',
        duration: 30,
        participants: [],
        agenda: ''
      });
      
      // Navigate directly to the call page
      navigate(`/projects/${projectId}/calls/${callId}`);
      
    } catch (error) {
      console.error('Failed to schedule call:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = () => {
    setShowUploadCode(true);
  };

  const handleCodeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadForm.files.length === 0) {
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of uploadForm.files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploader_id', '1'); // Replace with actual user ID
        formData.append('project_id', projectId!);
        formData.append('description', uploadForm.description);
        formData.append('category', uploadForm.category);

        const response = await fetch('/api/v1/uploads/file', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        console.log(`Successfully uploaded ${successCount} files`);
      }
      if (errorCount > 0) {
        console.error(`Failed to upload ${errorCount} files`);
      }

      setShowUploadCode(false);
      setUploadForm({
        files: [],
        description: '',
        category: 'general'
      });
      
      // Refresh project data to show uploaded files
      if (successCount > 0) {
        loadProject();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadForm(prev => ({
        ...prev,
        files: Array.from(files)
      }));
    }
  };

  const removeFile = (index: number) => {
    setUploadForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const toggleParticipant = (memberId: string) => {
    setCallForm(prev => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter(id => id !== memberId)
        : [...prev.participants, memberId]
    }));
  };

  const handleStartInstantCall = () => {
    // Create instant call
    const callId = `instant-${Date.now()}`;
    const callDetails = {
      id: callId,
      projectId: projectId,
      title: 'Instant Team Call',
      type: 'team_meeting',
      scheduledTime: new Date().toISOString(),
      duration: 30,
      participants: project?.team_members.map(m => m.id.toString()) || [],
      agenda: '',
      createdAt: new Date().toISOString(),
      isInstant: true
    };
    
    localStorage.setItem(`call-${callId}`, JSON.stringify(callDetails));
    
    // Navigate directly to call page
    navigate(`/projects/${projectId}/calls/${callId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseVariant = (phase: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants = {
      planning: 'outline' as const,
      development: 'default' as const,
      testing: 'secondary' as const,
      deployment: 'default' as const,
      maintenance: 'secondary' as const,
      completed: 'default' as const
    };
    return variants[phase as keyof typeof variants] || 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
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
    <div className="space-y-6 p-6">
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
                    <User className="w-6 h-6 text-white" />
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
                    {project.team_members.length} members
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
        {/* Left Panel */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 p-1 m-4 mb-0">
                <TabsTrigger value="conversations" className="text-xs">Chat</TabsTrigger>
                <TabsTrigger value="team" className="text-xs">Team</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs">Memory</TabsTrigger>
                <TabsTrigger value="calls" className="text-xs">Calls</TabsTrigger>
                <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
              </TabsList>

              <TabsContent value="conversations" className="p-6 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Conversations</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowNewConversation(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No conversations yet</p>
                      </div>
                    ) : (
                      Object.entries(groupConversationsByDay(conversations)).map(([day, convs]) => (
                        <div key={day}>
                          <h4 className="font-semibold text-primary mb-2">{day}</h4>
                          <div className="space-y-2">
                            {convs.map((conv) => (
                              <Card
                                key={conv.id}
                                className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50"
                                onClick={() => navigate(`/projects/${projectId}/conversations/${conv.id}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-foreground">{conv.title}</h5>
                                    <Badge variant="outline" className={getStatusColor(conv.status)}>
                                      {conv.status === 'active' ? 'Ongoing' : conv.status === 'ended' ? 'Finished' : conv.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{conv.conversation_type}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{conv.message_count} messages</span>
                                    <span>•</span>
                                    <span>{conv.participant_count} participants</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="p-6 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <div className="space-y-3">
                    {project.team_members.map((member) => (
                      <Card key={member.id} className="border-0 bg-gradient-to-br from-white to-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                            {member.is_user && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="memory" className="p-6 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Project Memory</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Brain className="w-4 h-4" />
                    <span>AI agents remember all conversations and interactions</span>
                  </div>
                  
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">Search Project Memory</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search conversations, decisions, or topics..."
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline" className="w-full">
                          <Brain className="w-4 h-4 mr-2" />
                          Search Memory
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="calls" className="p-6 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Voice Calls</h3>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-green-600 to-green-700"
                      onClick={handleStartInstantCall}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-4 text-center">
                        <Phone className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-foreground mb-2">Start Instant Call</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Jump into a call with your team right now
                        </p>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={handleStartInstantCall}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Start Now
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-4 text-center">
                        <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-foreground mb-2">Schedule Call</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Plan a meeting for a specific date and time
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowScheduleCall(true)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Call
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="p-6 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Code Files</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowUploadCode(true)}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardContent className="p-4 text-center">
                      <Code className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                      <p className="text-muted-foreground">No code files uploaded</p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setShowUploadCode(true)}
                      >
                        Upload Code
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel - Dashboard */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Project Dashboard
              </CardTitle>
              <CardDescription>
                Your personalized workspace insights and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Feedback */}
                  {dashboardData?.dashboard?.feedback && (
                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          AI Insights
                        </h4>
                        <p className="text-muted-foreground">{dashboardData.dashboard.feedback}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tasks */}
                  {dashboardData?.tasks && dashboardData.tasks.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Your Tasks
                      </h4>
                      <div className="space-y-2">
                        {dashboardData.tasks.map((task: any, index: number) => (
                          <Card key={index} className="border-0 bg-gradient-to-br from-white to-gray-50">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-sm text-foreground">{task}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {dashboardData?.dashboard?.suggestions && dashboardData.dashboard.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Suggestions
                      </h4>
                      <div className="space-y-2">
                        {dashboardData.dashboard.suggestions.map((suggestion: string, index: number) => (
                          <Card key={index} className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-foreground">{suggestion}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* New Conversation Modal */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Create a new conversation with your team members.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateConversation} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                required
                value={newConversationForm.title}
                onChange={(e) => setNewConversationForm({...newConversationForm, title: e.target.value})}
                placeholder="Enter conversation title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                required
                value={newConversationForm.type}
                onChange={(e) => setNewConversationForm({...newConversationForm, type: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select conversation type</option>
                {CONVERSATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={newConversationForm.description}
                onChange={(e) => setNewConversationForm({...newConversationForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Describe the conversation topic"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewConversation(false)}
                disabled={sending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="flex-1"
              >
                {sending ? 'Creating...' : 'Start Conversation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Call Modal */}
      <Dialog open={showScheduleCall} onOpenChange={setShowScheduleCall}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Call</DialogTitle>
            <DialogDescription>
              Schedule a voice call with your team members.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleScheduleCall} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Call Title</label>
              <Input
                required
                value={callForm.title}
                onChange={(e) => setCallForm({...callForm, title: e.target.value})}
                placeholder="Enter call title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Call Type</label>
              <select
                required
                value={callForm.type}
                onChange={(e) => setCallForm({...callForm, type: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CALL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  required
                  value={callForm.date}
                  onChange={(e) => setCallForm({...callForm, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  required
                  value={callForm.time}
                  onChange={(e) => setCallForm({...callForm, time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <select
                value={callForm.duration}
                onChange={(e) => setCallForm({...callForm, duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Participants</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {project?.team_members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 border rounded-md">
                    <input
                      type="checkbox"
                      checked={callForm.participants.includes(member.id.toString())}
                      onChange={() => toggleParticipant(member.id.toString())}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agenda (Optional)</label>
              <textarea
                value={callForm.agenda}
                onChange={(e) => setCallForm({...callForm, agenda: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Meeting agenda or topics to discuss"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleCall(false)}
                disabled={sending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="flex-1"
              >
                {sending ? 'Scheduling...' : 'Schedule Call'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Code Modal */}
      <Dialog open={showUploadCode} onOpenChange={setShowUploadCode}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Code Files</DialogTitle>
            <DialogDescription>
              Share code files with your team for review and collaboration.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCodeUpload} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Files</label>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.yaml,.yml,.md,.txt"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Supported: JS, TS, Python, Java, C/C++, CSS, HTML, JSON, Markdown, Text files
              </p>
            </div>

            {uploadForm.files.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Files</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadForm.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-auto p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CODE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Describe the purpose of these files or what they contain"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadCode(false)}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || uploadForm.files.length === 0}
                className="flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectPage;
