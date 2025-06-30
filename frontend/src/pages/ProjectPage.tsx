import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

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
  
  // UI States
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({
    title: '',
    conversationType: '',
    participants: [] as string[]
  });
  const [activeTab, setActiveTab] = useState<'conversations' | 'team' | 'memory'>('conversations');

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadConversations();
    }
  }, [projectId]);

  useEffect(() => {
    if (location.state && (location.state as any).reload) {
      loadConversations();
    }
    // eslint-disable-next-line
  }, [location.state]);

  const loadProject = async () => {
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
  };

  const loadConversations = async () => {
    try {
      const response = await apiService.getProjectConversations(projectId!);
      if (response.success) {
        setConversations(response.data?.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    }
  };

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
  console.log('Dashboard conversations:', conversations);

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
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  conv.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {conv.status}
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      The AI team members maintain persistent memory of all project activities, 
                      conversations, and decisions. This enables realistic workplace dynamics 
                      where agents remember previous interactions and build on past discussions.
                    </p>
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
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                  <p className="text-sm">Choose a conversation from the list or start a new one</p>
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
    </div>
  );
};

export default ProjectPage; 