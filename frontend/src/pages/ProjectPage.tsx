import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Phone
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';

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
  
  // Dashboard States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // UI States
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({
    title: '',
    conversationType: '',
    participants: [] as string[]
  });
  const [activeTab, setActiveTab] = useState<'conversations' | 'team' | 'memory' | 'calls' | 'code'>('conversations');

  // Calls & Code States
  const [calls, setCalls] = useState<any[]>([]);
  const [codeUploads, setCodeUploads] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [callMessage, setCallMessage] = useState<string>('');
  const [callMessages, setCallMessages] = useState<any[]>([]);
  const [newCall, setNewCall] = useState({
    title: '',
    description: '',
    callType: '1on1',
    scheduledAt: '',
    participants: [] as string[]
  });
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    reviewType: 'general'
  });

  // Function definitions
  const getQuickStartTime = (minutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now.toISOString().slice(0, 16);
  };

  const loadProject = useCallback(async () => {
    try {
      const response = await apiService.getProjectDetails(projectId!);
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        setProject(null);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadConversations = useCallback(async () => {
    try {
      // Debug logging removed
      const response = await apiService.getProjectConversations(projectId!);
      // Debug logging removed
      
      // Handle different response formats
      let conversations = [];
      if (response.success && response.data?.conversations) {
        conversations = response.data.conversations;
      } else if ((response as any).conversations) {
        // Direct response format from backend
        conversations = (response as any).conversations;
      }
      
      // Debug logging removed
      setConversations(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    }
  }, [projectId]);

  const loadDashboardData = useCallback(async () => {
    if (!projectId || !project) return;
    
    try {
      setDashboardLoading(true);
      // Debug logging removed
      
      // Load both dashboard content and role-specific tasks
      const [dashboardResponse, tasksResponse] = await Promise.all([
        apiService.getDashboardData(projectId),
        apiService.getRoleTasks(projectId, project.user_role)
      ]);
      
      // Debug logging removed
      // Debug logging removed
      
      if (dashboardResponse.success && tasksResponse.success) {
        setDashboardData({
          dashboard: dashboardResponse.data,
          tasks: tasksResponse.data
        });
      } else {
        console.error('Failed to load dashboard data:', { dashboardResponse, tasksResponse });
        // Set fallback message instead of hardcoded content
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
      // Set error message instead of hardcoded content
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

  // Load dashboard data after project is loaded
  useEffect(() => {
    if (project && projectId) {
      loadDashboardData();
    }
  }, [project, projectId, loadDashboardData]);

  useEffect(() => {
    if (location.state && (location.state as any).reload) {
      // Debug logging removed
      // Force reload conversations with a slight delay to ensure backend processing is complete
      setTimeout(() => {
        loadConversations();
      }, 500);
      // Clear the reload state to prevent repeated reloads
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location.state, loadConversations]);

  // Auto-refresh conversations every 30 seconds to catch status updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadConversationDetails = async (conversationId: string) => {
    try {
      setConversationLoading(true);
      const response = await apiService.getConversationDetails(projectId!, conversationId);
      if (response.success && response.data) {
        setCurrentConversation(response.data);
      } else {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error);
      setCurrentConversation(null);
    } finally {
      setConversationLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentConversation) return;

    try {
      setSending(true);
      const response = await apiService.sendMessage(
        projectId!,
        currentConversation.conversation.id,
        messageInput
      );

      if (response.success) {
        setMessageInput('');
        // Reload conversation to get AI responses
        await loadConversationDetails(currentConversation.conversation.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async () => {
    if (!newConversationForm.title || !newConversationForm.conversationType) return;

    try {
      const response = await apiService.startConversation(
        projectId!,
        newConversationForm.conversationType,
        newConversationForm.title,
        newConversationForm.participants
      );

      if (response.success) {
        setShowNewConversation(false);
        setNewConversationForm({
          title: '',
          conversationType: '',
          participants: []
        });
        await loadConversations();
        // Defensive: Always use the conversation.id returned from backend for navigation
        navigate(`/projects/${projectId}/conversations/${response.data.conversation.id}`);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const endConversation = async () => {
    if (!currentConversation) return;

    try {
      await apiService.endConversation(projectId!, currentConversation.conversation.id);
      setCurrentConversation(null);
      loadConversations();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  // Calls & Code Functions
  const fetchCalls = useCallback(async () => {
    try {
      const response = await fetch(`/api/calls/project/${projectId}`);
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Error fetching calls:', error);
      // Add some mock data for testing
      setCalls([
        {
          id: 1,
          title: "Daily Standup",
          call_type: "group",
          status: "scheduled",
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          dominant_emotion: "neutral"
        },
        {
          id: 2,
          title: "Code Review Session",
          call_type: "1on1",
          status: "scheduled",
          scheduled_at: new Date(Date.now() + 7200000).toISOString(),
          dominant_emotion: "confident"
        }
      ]);
    }
  }, [projectId]);

  const fetchCodeUploads = useCallback(async () => {
    try {
      const response = await fetch(`/api/code/project/${projectId}`);
      const data = await response.json();
      setCodeUploads(data);
    } catch (error) {
      console.error('Error fetching code uploads:', error);
      // Add some mock data for testing
      setCodeUploads([
        {
          id: 1,
          original_filename: "authentication.py",
          file_type: "python",
          uploaded_at: new Date().toISOString(),
          quality_score: 0.85,
          complexity_score: 0.65,
          description: "User authentication module"
        },
        {
          id: 2,
          original_filename: "dashboard.tsx",
          file_type: "typescript",
          uploaded_at: new Date(Date.now() - 3600000).toISOString(),
          quality_score: 0.92,
          complexity_score: 0.78,
          description: "Main dashboard component"
        }
      ]);
    }
  }, [projectId]);

  const fetchAvailableAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/agents');
      const data = await response.json();
      setAvailableAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  const scheduleCall = async () => {
    try {
      const formData = new FormData();
      formData.append('call_type', newCall.callType);
      formData.append('title', newCall.title);
      formData.append('description', newCall.description);
      formData.append('project_id', projectId!);
      formData.append('creator_id', '1');
      formData.append('scheduled_at', newCall.scheduledAt);
      formData.append('participants', JSON.stringify(newCall.participants));

      const response = await fetch('/api/calls/schedule', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowScheduleForm(false);
        setNewCall({ title: '', description: '', callType: '1on1', scheduledAt: '', participants: [] });
        fetchCalls();
      }
    } catch (error) {
      console.error('Error scheduling call:', error);
    }
  };

  const startCall = async (callId: number) => {
    try {
      const response = await fetch(`/api/calls/${callId}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const call = calls.find(c => c.id === callId);
        if (call) {
          setActiveCall(call);
          await fetchCallMessages(callId);
          
          const welcomeMessage = `Call started: ${call.title}. AI personas are now available for interaction.`;
          setCallMessages(prev => [...prev, {
            sender_type: 'system',
            sender_name: 'System',
            message: welcomeMessage,
            timestamp: new Date().toISOString()
          }]);
        }
        fetchCalls();
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = async (callId: number) => {
    try {
      const response = await fetch(`/api/calls/${callId}/end`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setActiveCall(null);
        setCallMessages([]);
        fetchCalls();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const sendCallMessage = async (callId: number, message: string) => {
    if (!message.trim()) return;

    try {
      // Add user message immediately for better UX
      const userMessage = {
        sender_type: 'user',
        sender_name: 'You',
        message: message,
        timestamp: new Date().toISOString()
      };
      setCallMessages(prev => [...prev, userMessage]);

      const formData = new FormData();
      formData.append('sender_type', 'user');
      formData.append('sender_id', '1');
      formData.append('sender_name', 'User');
      formData.append('message', message);

      const response = await fetch(`/api/calls/${callId}/message`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setCallMessage('');
        // The user message is already added above
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const uploadCode = async () => {
    try {
      if (!uploadForm.file) {
        console.error('No file selected');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('project_id', projectId!);
      formData.append('uploader_id', '1');
      formData.append('description', uploadForm.description);

      const response = await fetch('/api/code/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Code uploaded with analysis:', result.analysis);
        setShowUploadForm(false);
        setUploadForm({ file: null, description: '', reviewType: 'general' });
        fetchCodeUploads();
      }
    } catch (error) {
      console.error('Error uploading code:', error);
    }
  };

  const fetchCallMessages = async (callId: number) => {
    try {
      const response = await fetch(`/api/calls/${callId}/messages`);
      const data = await response.json();
      setCallMessages(data);
    } catch (error) {
      console.error('Error fetching call messages:', error);
    }
  };

  const chatWithAgent = async (agentId: string, message: string) => {
    if (!message.trim()) return;

    try {
      const response = await fetch(`/api/v1/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      
      // Find agent name
      const agent = availableAgents.find(a => a.id === agentId);
      
      // Add the AI response to call messages
      setCallMessages(prev => [...prev, {
        sender_type: 'ai',
        sender_name: agent?.name || 'AI Assistant',
        message: data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error chatting with agent:', error);
    }
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: { [key: string]: string } = {
      'happy': 'bg-green-100 text-green-800',
      'confident': 'bg-blue-100 text-blue-800',
      'nervous': 'bg-yellow-100 text-yellow-800',
      'frustrated': 'bg-red-100 text-red-800',
      'calm': 'bg-purple-100 text-purple-800',
      'excited': 'bg-orange-100 text-orange-800'
    };
    return colors[emotion] || 'bg-gray-100 text-gray-800';
  };

  // Load calls and code data when the calls or code tab is active
  useEffect(() => {
    if ((activeTab === 'calls' || activeTab === 'code') && projectId) {
      fetchCalls();
      fetchCodeUploads();
      fetchAvailableAgents();
    }
  }, [activeTab, projectId, fetchCalls, fetchCodeUploads, fetchAvailableAgents]);

  // Utility: Group conversations by day
  const groupConversationsByDay = (convs: Conversation[]) => {
    if (!convs.length) return {};
    // Defensive: filter out conversations with missing or invalid start_time
    const validConvs = convs.filter(c => c.start_time && !isNaN(Date.parse(c.start_time)));
    if (!validConvs.length) return {};
    // Find the earliest day
    const sorted = [...validConvs].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const firstDay = parseISO(sorted[0].start_time);
    const groups: { [day: string]: Conversation[] } = {};
    sorted.forEach(conv => {
      const dayNum = differenceInCalendarDays(parseISO(conv.start_time), firstDay) + 1;
      const dayLabel = `Day ${dayNum}`;
      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(conv);
    });
    return groups;
  };

  // Add debug log
  // Debug logging removed

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.project.name}</h1>
            <p className="text-gray-600 mt-1">{project.project.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users size={16} />
                {project.team_members.length} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                Created {new Date(project.project.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <User size={16} />
                Your role: {project.user_role}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Conversations/Team/Memory */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'conversations'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Team
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'memory'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Memory
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calls'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Calls
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'code'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Code
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'conversations' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Conversations</h3>
                    <button
                      onClick={() => setShowNewConversation(true)}
                      className="btn-primary text-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {conversations.length === 0 && (
                      <div className="text-gray-500 text-center">No conversations found.</div>
                    )}
                    {Object.entries(groupConversationsByDay(conversations)).map(([day, convs]) => (
                      <div key={day}>
                        <div className="font-bold text-primary-700 mb-2">{day}</div>
                        <div className="space-y-2">
                          {convs.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => navigate(`/projects/${projectId}/conversations/${conv.id}`)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors border-gray-200 hover:border-gray-300`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{conv.title}</h4>
                                  <p className="text-sm text-gray-500">{conv.conversation_type}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  conv.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : conv.status === 'ended'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {conv.status === 'active' ? 'Ongoing' : conv.status === 'ended' ? 'Finished' : conv.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>{conv.message_count} messages</span>
                                <span>•</span>
                                <span>{conv.participant_count} participants</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <div className="space-y-3">
                    {(project?.team_members || []).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        {member.is_user && (
                          <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Project Memory</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Brain size={16} />
                    <span>AI agents remember all conversations and interactions</span>
                  </div>
                  
                  {/* Memory Search */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Project Memory
                      </label>
                      <input
                        type="text"
                        placeholder="Search conversations, decisions, or topics..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <button className="btn-primary text-sm">
                      Search Memories
                    </button>
                  </div>

                  {/* Memory Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Total Messages</p>
                          <p className="text-lg font-bold text-blue-700">
                            {conversations.reduce((sum, c) => sum + c.message_count, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Conversations</p>
                          <p className="text-lg font-bold text-green-700">{conversations.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Memories */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Project Activity</h4>
                    <div className="space-y-3">
                      {conversations.slice(0, 3).map((conv) => (
                        <div key={conv.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{conv.title}</p>
                            <p className="text-xs text-gray-500">
                              {conv.conversation_type} • {conv.message_count} messages • 
                              {new Date(conv.start_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Memory Insights */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">🧠 Memory Insights</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      The AI team members maintain persistent memory using advanced vector embeddings 
                      and semantic search to recall relevant context from past interactions.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-purple-600">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        <span>Vector embeddings enable semantic memory search</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-600">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        <span>Conversation context is preserved across sessions</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-600">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        <span>Agents remember project decisions and team dynamics</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Meeting Calls</h3>
                    <button
                      onClick={() => setShowScheduleForm(true)}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <Video size={14} />
                      Schedule Call
                    </button>
                  </div>

                  {/* Active Call */}
                  {activeCall && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Active: {activeCall.title}</span>
                        </div>
                        <button
                          onClick={() => endCall(activeCall.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          End Call
                        </button>
                      </div>
                      
                      {/* Call Messages */}
                      <div className="bg-white rounded p-3 mb-3 max-h-40 overflow-y-auto">
                        {callMessages.map((msg, index) => (
                          <div key={index} className={`mb-2 p-2 rounded text-sm ${
                            msg.sender_type === 'user' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                          }`}>
                            <div className="font-medium text-xs text-gray-600">{msg.sender_name}</div>
                            <div>{msg.message}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Message Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={callMessage}
                          onChange={(e) => setCallMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              sendCallMessage(activeCall.id, callMessage);
                            }
                          }}
                        />
                        <button
                          onClick={() => sendCallMessage(activeCall.id, callMessage)}
                          disabled={!callMessage.trim()}
                          className="px-3 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 text-sm"
                        >
                          Send
                        </button>
                      </div>
                      
                      {/* Quick Agent Chat */}
                      {availableAgents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="text-xs font-medium text-green-700 mb-2">Quick Chat with AI Personas:</div>
                          <div className="flex flex-wrap gap-1">
                            {availableAgents.slice(0, 3).map((agent) => (
                              <button
                                key={agent.id}
                                onClick={() => {
                                  if (callMessage.trim()) {
                                    chatWithAgent(agent.id, callMessage);
                                  }
                                }}
                                disabled={!callMessage.trim()}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                              >
                                {agent.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scheduled Calls */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Scheduled Calls
                    </h4>
                    <div className="space-y-2">
                      {calls.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-2">No calls scheduled</div>
                      ) : (
                        calls.map((call) => (
                          <div key={call.id} className="flex justify-between items-center p-2 border border-gray-200 rounded">
                            <div>
                              <div className="font-medium text-sm">{call.title}</div>
                              <div className="text-xs text-gray-500">
                                {call.call_type} • {new Date(call.scheduled_at).toLocaleString()}
                              </div>
                            </div>
                            {call.status === 'scheduled' && (
                              <button
                                onClick={() => startCall(call.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Code Review & Analysis</h3>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <Upload size={14} />
                      Upload Code
                    </button>
                  </div>

                  {/* Code Uploads */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Code Uploads
                    </h4>
                    <div className="space-y-2">
                      {codeUploads.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-2">No code uploaded</div>
                      ) : (
                        codeUploads.map((upload) => (
                          <div key={upload.id} className="flex justify-between items-center p-2 border border-gray-200 rounded">
                            <div>
                              <div className="font-medium text-sm">{upload.original_filename}</div>
                              <div className="text-xs text-gray-500">
                                {upload.file_type} • Quality: {Math.round(upload.quality_score * 100)}% • 
                                Complexity: {Math.round(upload.complexity_score * 100)}%
                              </div>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                              View Analysis
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Conversation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
            {currentConversation ? (
              <>
                {/* Conversation Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{currentConversation.conversation.title}</h3>
                      <p className="text-sm text-gray-500">
                        {currentConversation.conversation.conversation_type} • 
                        {currentConversation.conversation.status === 'active' ? ' Active' : ' Ended'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={endConversation}
                        className="btn-secondary text-sm"
                      >
                        End
                      </button>
                      <button
                        onClick={() => setCurrentConversation(null)}
                        className="btn-secondary text-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    (currentConversation?.messages || []).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_name === 'You' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_name === 'You'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">{message.sender_name}</div>
                          <div>{message.content}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                {currentConversation.conversation.status === 'active' && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sending}
                        className="btn-primary px-4"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Workspace Dashboard</h2>
                    <p className="text-gray-600">Stay on top of your tasks, assignments, and workplace activities</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Active Chats</p>
                          <p className="text-xl font-semibold text-gray-900">{conversations.filter(c => c.status === 'active').length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Team Members</p>
                          <p className="text-xl font-semibold text-gray-900">{project?.team_members?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <History className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Messages</p>
                          <p className="text-xl font-semibold text-gray-900">{conversations.reduce((sum, c) => sum + c.message_count, 0)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Project Days</p>
                          <p className="text-xl font-semibold text-gray-900">{Object.keys(groupConversationsByDay(conversations)).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI-Generated Orders from Management */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">📋 Orders from Management</h3>
                        {dashboardLoading ? (
                          <div className="animate-pulse bg-gray-200 h-5 w-12 rounded"></div>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            AI Generated
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      {dashboardLoading ? (
                        <div className="space-y-4">
                          <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
                        </div>
                      ) : dashboardData?.dashboard?.tasks?.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardData.dashboard.tasks.slice(0, 3).map((task: any, index: number) => (
                            <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border-l-4 ${
                              task.priority === 'urgent' ? 'bg-red-50 border-red-400' :
                              task.priority === 'high' ? 'bg-yellow-50 border-yellow-400' :
                              'bg-blue-50 border-blue-400'
                            }`}>
                              <User className={`h-5 w-5 mt-0.5 ${
                                task.priority === 'urgent' ? 'text-red-600' :
                                task.priority === 'high' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">AI Manager</p>
                                  <span className={`text-xs font-medium ${
                                    task.priority === 'urgent' ? 'text-red-600' :
                                    task.priority === 'high' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`}>{task.priority?.toUpperCase()}</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{task.title}</p>
                                <p className="text-xs text-gray-500 mt-2">AI Generated • Status: {task.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">
                            {dashboardData?.dashboard?.feedback || "Configure AI API keys to get personalized management orders"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI-Generated My Responsibilities */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">📋 My Responsibilities</h3>
                    </div>
                    <div className="p-6">
                      {dashboardLoading ? (
                        <div className="space-y-3">
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                        </div>
                      ) : dashboardData?.tasks?.length > 0 ? (
                        <div className="space-y-3">
                          {dashboardData.tasks.slice(0, 4).map((task: any, index: number) => (
                            <div key={index} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <div className="flex items-start space-x-3">
                                <div className={`h-4 w-4 mt-1 ${
                                  task.priority === 'high' ? 'text-red-600' :
                                  task.priority === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {task.title?.includes('review') || task.title?.includes('feedback') ? 
                                    <MessageSquare className="h-4 w-4" /> :
                                  task.title?.includes('team') || task.title?.includes('collaborate') ?
                                    <Users className="h-4 w-4" /> :
                                  task.title?.includes('meeting') || task.title?.includes('demo') ?
                                    <Calendar className="h-4 w-4" /> :
                                    <Brain className="h-4 w-4" />
                                  }
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                  <p className="text-xs text-gray-500">{task.description || task.estimated_time} • Role: {task.role}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">
                            {dashboardData?.dashboard?.responsibilities?.length > 0 ? 
                              dashboardData.dashboard.responsibilities.join(', ') :
                              "Configure AI API keys to get personalized responsibilities"
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI-Generated Team Assignments */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">👥 Team Assignments</h3>
                    </div>
                    <div className="p-6">
                      {dashboardLoading ? (
                        <div className="space-y-4">
                          <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
                        </div>
                      ) : dashboardData?.dashboard?.suggestions?.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardData.dashboard.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">AI Suggestion #{index + 1}</p>
                                <p className="text-sm text-gray-700 mt-1">{suggestion}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-500">Generated by AI • Team Assignment</p>
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">AI Generated</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">
                            Configure AI API keys to get team assignment suggestions
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI-Generated Upcoming Deadlines */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">⏰ Upcoming Deadlines</h3>
                    </div>
                    <div className="p-6">
                      {dashboardLoading ? (
                        <div className="space-y-3">
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
                        </div>
                      ) : dashboardData?.dashboard?.deadlines?.length > 0 ? (
                        <div className="space-y-3">
                          {dashboardData.dashboard.deadlines.map((deadline: any, index: number) => (
                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                              index === 0 ? 'bg-red-50' : index === 1 ? 'bg-yellow-50' : 'bg-blue-50'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <Clock className={`h-4 w-4 ${
                                  index === 0 ? 'text-red-600' : index === 1 ? 'text-yellow-600' : 'text-blue-600'
                                }`} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                                  <p className={`text-xs ${
                                    index === 0 ? 'text-red-600' : index === 1 ? 'text-yellow-600' : 'text-blue-600'
                                  }`}>Due: {deadline.date}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${
                                index === 0 ? 'text-red-600' : index === 1 ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {index === 0 ? 'URGENT' : index === 1 ? 'THIS WEEK' : 'UPCOMING'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">
                            Configure AI API keys to get personalized deadline tracking
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversation-Based Quick Actions */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">� Quick Conversation Actions</h3>
                    </div>
                    <div className="p-6">
                      {/* Main Actions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button 
                          onClick={() => setShowNewConversation(true)}
                          className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                        >
                          <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                          <p className="text-sm font-medium text-gray-700 group-hover:text-blue-900">Start New Chat</p>
                          <p className="text-xs text-gray-500 text-center">Begin team discussion</p>
                        </button>
                        
                        <button 
                          onClick={() => setShowNewConversation(true)}
                          className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
                        >
                          <Users className="h-6 w-6 text-gray-400 group-hover:text-green-600 mb-2" />
                          <p className="text-sm font-medium text-gray-700 group-hover:text-green-900">Ask for Help</p>
                          <p className="text-xs text-gray-500 text-center">Get team assistance</p>
                        </button>
                        
                        <button 
                          onClick={() => setShowNewConversation(true)}
                          className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                        >
                          <MessageSquare className="h-6 w-6 text-gray-400 group-hover:text-purple-600 mb-2" />
                          <p className="text-sm font-medium text-gray-700 group-hover:text-purple-900">Status Update</p>
                          <p className="text-xs text-gray-500 text-center">Share progress</p>
                        </button>
                      </div>

                      {/* AI-Generated Conversation Suggestions */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 AI Conversation Suggestions</h4>
                        <div className="space-y-2">
                          {dashboardLoading ? (
                            <div className="space-y-2">
                              <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
                              <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
                              <div className="animate-pulse bg-gray-200 h-6 rounded"></div>
                            </div>
                          ) : dashboardData?.dashboard?.suggestions?.length > 0 ? (
                            dashboardData.dashboard.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">🤖 {suggestion}</span>
                                <button 
                                  onClick={() => setShowNewConversation(true)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Start
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 text-center py-2">
                              Configure AI API keys to get conversation suggestions
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Insights */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">� Team Communication</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Active Conversations */}
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Active Chats</h4>
                          <p className="text-2xl font-bold text-blue-600 mb-1">{conversations.filter(c => c.status === 'active').length}</p>
                          <p className="text-xs text-gray-500">Ongoing discussions</p>
                        </div>
                        
                        {/* Messages Today */}
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                            <History className="h-6 w-6 text-green-600" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Total Messages</h4>
                          <p className="text-2xl font-bold text-green-600 mb-1">{conversations.reduce((sum, c) => sum + c.message_count, 0)}</p>
                          <p className="text-xs text-gray-500">In all conversations</p>
                        </div>
                        
                        {/* Team Members Available */}
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Team Members</h4>
                          <p className="text-2xl font-bold text-purple-600 mb-1">{project?.team_members?.length || 0}</p>
                          <p className="text-xs text-gray-500">Available to chat</p>
                        </div>
                      </div>
                      
                      {/* Communication Tips */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">💡 Communication Tip</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Start conversations with specific team members to get help with tasks, 
                          share updates, or discuss project details. Each team member has their own expertise!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Helpful tip */}
                  <div className="text-center text-gray-500 text-sm mt-8">
                    💡 <strong>Tip:</strong> Select a conversation from the left panel to start chatting with your team members
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Start New Conversation
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newConversationForm.title}
                  onChange={(e) => setNewConversationForm({...newConversationForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter conversation title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newConversationForm.conversationType}
                  onChange={(e) => setNewConversationForm({...newConversationForm, conversationType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select conversation type</option>
                  {CONVERSATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participants
                </label>
                <div className="space-y-2">
                  {(project?.team_members || []).map((member) => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newConversationForm.participants.includes(member.name)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...newConversationForm.participants, member.name]
                            : newConversationForm.participants.filter(p => p !== member.name);
                          setNewConversationForm({...newConversationForm, participants: updated});
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{member.name} ({member.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={startNewConversation}
                  className="btn-primary flex-1"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Schedule New Call
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
                <select
                  value={newCall.callType}
                  onChange={(e) => setNewCall({...newCall, callType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="1on1">1:1 Meeting</option>
                  <option value="group">Group Call</option>
                  <option value="client">Client Call</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newCall.title}
                  onChange={(e) => setNewCall({...newCall, title: e.target.value})}
                  placeholder="Call title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCall.description}
                  onChange={(e) => setNewCall({...newCall, description: e.target.value})}
                  placeholder="Call description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling Option</label>
                <div className="space-y-3">
                  {/* Quick Duration Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Quick Start (immediate)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setNewCall({...newCall, scheduledAt: getQuickStartTime(5)})}
                        className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        5 min
                      </button>
                      <button
                        onClick={() => setNewCall({...newCall, scheduledAt: getQuickStartTime(10)})}
                        className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        10 min
                      </button>
                      <button
                        onClick={() => setNewCall({...newCall, scheduledAt: getQuickStartTime(15)})}
                        className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        15 min
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Or schedule for later</label>
                    <input
                      type="datetime-local"
                      value={newCall.scheduledAt}
                      onChange={(e) => setNewCall({...newCall, scheduledAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Participants</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {availableAgents.map((agent) => (
                    <label key={agent.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCall.participants.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCall({...newCall, participants: [...newCall.participants, agent.id]});
                          } else {
                            setNewCall({...newCall, participants: newCall.participants.filter(p => p !== agent.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        <strong>{agent.name}</strong> - {agent.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={scheduleCall}
                  className="btn-primary flex-1"
                >
                  Schedule Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Code Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Code for Review
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code File</label>
                <input
                  type="file"
                  accept=".py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.html,.css,.json,.xml,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.yml,.yaml,.md,.sql"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: Python, JavaScript, TypeScript, Java, C++, HTML, CSS, JSON, and more
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Type</label>
                <select
                  value={uploadForm.reviewType || 'general'}
                  onChange={(e) => setUploadForm({...uploadForm, reviewType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="general">General Review</option>
                  <option value="security">Security Analysis</option>
                  <option value="performance">Performance Review</option>
                  <option value="style">Code Style & Best Practices</option>
                  <option value="bugs">Bug Detection</option>
                  <option value="documentation">Documentation Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  placeholder="Describe the code or what specific feedback you're looking for"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadCode}
                  disabled={!uploadForm.file}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Upload & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
