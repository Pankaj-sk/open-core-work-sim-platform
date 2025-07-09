// 📄 PAGE: CallPage.tsx - Advanced voice/video call simulation page with real-time features
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  PhoneOff,
  Users, 
  MessageSquare,
  Settings,
  ArrowLeft,
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  Share2,
  Download,
  BarChart3,
  TrendingUp,
  Heart,
  AlertCircle,
  Pause,
  Play,
  Circle,
  Square,
  Search,
  Copy,
  Moon,
  Sun,
  Star,
  Bookmark,
  Target,
  Trophy,
  Lightbulb,
  Layers,
  RefreshCw,
  Network,
  Signal,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

interface CallParticipant {
  id: string;
  name: string;
  role: string;
  isAI: boolean;
  isUser: boolean;
  currentEmotion: string;
  confidence: number;
  isActive: boolean;
  isSpeaking: boolean;
  avatar?: string;
  department?: string;
  expertise?: string[];
  mood?: 'engaged' | 'neutral' | 'distracted' | 'excited' | 'tired';
  stressLevel?: number;
  performanceScore?: number;
  lastActivity?: string;
  networkQuality?: 'excellent' | 'good' | 'poor' | 'offline';
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'laptop';
  timeZone?: string;
  joinTime?: string;
  notes?: string;
}

interface CallMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isAudio: boolean;
  emotion: string;
  confidence: number;
  transcription?: string;
  isImportant?: boolean;
  mentions?: string[];
  reactions?: { emoji: string; userId: string; timestamp: string }[];
  actionItems?: string[];
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  language?: string;
  duration?: number;
  audioUrl?: string;
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
  language: string;
  autoTranscribe: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

interface CallAnalytics {
  totalParticipants: number;
  averageEngagement: number;
  keyTopics: string[];
  sentimentTrend: { time: string; sentiment: number }[];
  participationRate: { [participantId: string]: number };
  actionItems: string[];
  decisions: string[];
  nextSteps: string[];
}

interface NetworkStats {
  latency: number;
  bandwidth: number;
  packetsLost: number;
  quality: 'excellent' | 'good' | 'poor';
  jitter: number;
}

// TODO: Implement when recording features are added
// interface CallRecording {
//   id: string;
//   startTime: string;
//   endTime?: string;
//   duration: number;
//   audioUrl?: string;
//   transcriptUrl?: string;
//   participants: string[];
//   highlights: { timestamp: string; content: string; type: 'decision' | 'action' | 'insight' }[];
// }

interface CallPreferences {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'speaker' | 'sidebar';
  autoMute: boolean;
  autoRecord: boolean;
  showCaptions: boolean;
  aiAssistant: boolean;
  smartNotifications: boolean;
  backgroundBlur: boolean;
  virtualBackground?: string;
  customStatus?: string;
}

const CallPage: React.FC = () => {
  const { projectId, callId } = useParams<{ projectId: string; callId: string }>();
  const navigate = useNavigate();
  
  // Core call states
  const [callData, setCallData] = useState<any>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'paused' | 'ended'>('connecting');
  // const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null); // TODO: Implement speaker tracking
  
  // Audio/Video states
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  // const [audioEnabled, setAudioEnabled] = useState(true); // TODO: Implement audio controls
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  // const [isProcessingAudio, setIsProcessingAudio] = useState(false); // TODO: Implement audio processing
  
  // Advanced features
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics>({
    totalParticipants: 0,
    averageEngagement: 0,
    keyTopics: [],
    sentimentTrend: [],
    participationRate: {},
    actionItems: [],
    decisions: [],
    nextSteps: []
  });
  
  // const [callRecording, setCallRecording] = useState<CallRecording | null>(null); // TODO: Implement recording features
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    latency: 45,
    bandwidth: 150,
    packetsLost: 0,
    quality: 'excellent',
    jitter: 2
  });
  
  const [callPreferences, setCallPreferences] = useState<CallPreferences>({
    theme: 'light',
    layout: 'grid',
    autoMute: false,
    autoRecord: false,
    showCaptions: true,
    aiAssistant: true,
    smartNotifications: true,
    backgroundBlur: false
  });
  
  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showAiInsights, setShowAiInsights] = useState(false);
  // const [showRecording, setShowRecording] = useState(false); // TODO: Implement recording UI
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  
  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: 'default',
    language: 'en-US',
    autoTranscribe: true,
    noiseSuppression: true,
    echoCancellation: true
  });
  
  // AI insights
  const [aiInsights, setAiInsights] = useState<{
    suggestions: string[];
    emotionalState: string;
    engagementLevel: number;
    keyPoints: string[];
    recommendedActions: string[];
    meetingHealth: 'excellent' | 'good' | 'needs_attention';
  }>({
    suggestions: [],
    emotionalState: 'neutral',
    engagementLevel: 0.7,
    keyPoints: [],
    recommendedActions: [],
    meetingHealth: 'good'
  });
  
  // Refs - TODO: Implement media recording and audio processing when needed
  // const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // const audioChunksRef = useRef<Blob[]>([]);
  // const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Utility functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      neutral: 'bg-gray-100 text-gray-800',
      happy: 'bg-green-100 text-green-800',
      excited: 'bg-yellow-100 text-yellow-800',
      focused: 'bg-blue-100 text-blue-800',
      concerned: 'bg-orange-100 text-orange-800',
      frustrated: 'bg-red-100 text-red-800',
      confident: 'bg-purple-100 text-purple-800',
      tired: 'bg-gray-200 text-gray-700',
      engaged: 'bg-indigo-100 text-indigo-800'
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  const getEmotionIcon = (emotion: string) => {
    const icons = {
      neutral: Meh,
      happy: Smile,
      excited: Smile,
      focused: Brain,
      concerned: AlertCircle,
      frustrated: Frown,
      confident: Trophy,
      tired: Clock,
      engaged: Activity
    };
    return icons[emotion as keyof typeof icons] || Meh;
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      engaged: 'text-green-600',
      neutral: 'text-gray-600',
      distracted: 'text-yellow-600',
      excited: 'text-purple-600',
      tired: 'text-red-600'
    };
    return colors[mood as keyof typeof colors] || colors.neutral;
  };

  const getNetworkQualityColor = (quality: string) => {
    const colors = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      poor: 'text-red-600',
      offline: 'text-gray-400'
    };
    return colors[quality as keyof typeof colors] || colors.offline;
  };

  const generateAIInsights = useCallback((messages: CallMessage[], participants: CallParticipant[]) => {
    // const recentMessages = messages.slice(-10); // TODO: Use for more sophisticated analysis
    const keyTopics = ['project timeline', 'budget allocation', 'team coordination', 'risk assessment'];
    const suggestions = [
      'Consider scheduling a follow-up meeting to discuss budget details',
      'Document the decisions made today for future reference',
      'Assign action items to specific team members',
      'Review project milestones and adjust timeline if needed'
    ];
    
    const averageEngagement = participants.reduce((sum, p) => sum + (p.performanceScore || 0.7), 0) / participants.length;
    const emotionalState = participants.find(p => p.isUser)?.currentEmotion || 'neutral';
    
    setAiInsights({
      suggestions,
      emotionalState,
      engagementLevel: averageEngagement,
      keyPoints: keyTopics,
      recommendedActions: suggestions.slice(0, 3),
      meetingHealth: averageEngagement > 0.8 ? 'excellent' : averageEngagement > 0.6 ? 'good' : 'needs_attention'
    });
  }, []);

  const updateCallAnalytics = useCallback(() => {
    setCallAnalytics(prev => ({
      ...prev,
      totalParticipants: participants.length,
      averageEngagement: participants.reduce((sum, p) => sum + (p.performanceScore || 0.7), 0) / participants.length,
      keyTopics: ['project planning', 'resource allocation', 'timeline review'],
      participationRate: participants.reduce((acc, p) => {
        acc[p.id] = Math.random() * 0.3 + 0.7; // Mock participation rate
        return acc;
      }, {} as { [key: string]: number })
    }));
  }, [participants]);

  const simulateNetworkStats = useCallback(() => {
    setNetworkStats(prev => ({
      ...prev,
      latency: Math.random() * 50 + 20,
      bandwidth: Math.random() * 100 + 100,
      packetsLost: Math.floor(Math.random() * 3),
      jitter: Math.random() * 5 + 1
    }));
  }, []);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.userId === 'user-current' && r.emoji === emoji);
        
        if (existingReaction) {
          return {
            ...msg,
            reactions: reactions.filter(r => !(r.userId === 'user-current' && r.emoji === emoji))
          };
        } else {
          return {
            ...msg,
            reactions: [...reactions, { emoji, userId: 'user-current', timestamp: new Date().toISOString() }]
          };
        }
      }
      return msg;
    }));
  }, []);

  const handleBookmark = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isImportant: !msg.isImportant } : msg
    ));
  }, []);

  const exportTranscript = useCallback(() => {
    const transcript = messages.map(msg => 
      `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.senderName}: ${msg.message}`
    ).join('\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  const toggleRecording = useCallback(async () => {
    // TODO: Implement actual recording functionality
    if (!isRecording) {
      setIsRecording(true);
      // setCallRecording({
      //   id: Date.now().toString(),
      //   startTime: new Date().toISOString(),
      //   duration: 0,
      //   participants: participants.map(p => p.id),
      //   highlights: []
      // });
    } else {
      setIsRecording(false);
      // setCallRecording(prev => prev ? { ...prev, endTime: new Date().toISOString() } : null);
    }
  }, [isRecording]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const shareCall = useCallback(() => {
    const shareUrl = `${window.location.origin}/call/${projectId}/${callId}`;
    navigator.clipboard.writeText(shareUrl);
    // TODO: Add toast notification
  }, [projectId, callId]);

  const pauseCall = useCallback(() => {
    setCallStatus('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resumeCall = useCallback(() => {
    setCallStatus('active');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const focusOnParticipant = useCallback((participantId: string) => {
    setSelectedParticipant(participantId);
    setCallPreferences(prev => ({ ...prev, layout: 'speaker' }));
  }, []);

  const filterMessages = useMemo(() => {
    let filtered = messages;
    
    if (searchQuery) {
      filtered = filtered.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterEmotion !== 'all') {
      filtered = filtered.filter(msg => msg.emotion === filterEmotion);
    }
    
    return filtered;
  }, [messages, searchQuery, filterEmotion]);

  // Core handlers
  const startCallTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const handleUserMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const newMessage: CallMessage = {
      id: Date.now().toString(),
      senderId: 'user-current',
      senderName: 'You',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isAudio: true,
      emotion: 'neutral',
      confidence: 0.8,
      sentiment: 'neutral',
      keywords: message.split(' ').filter(word => word.length > 4),
      reactions: [],
      isImportant: false
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update current speaker (TODO: Implement proper speaker tracking)
    // setCurrentSpeaker('user-current');
    
    // Simulate AI responses with more realistic behavior
    setTimeout(() => {
      const aiParticipants = participants.filter(p => p.isAI && p.isActive);
      if (aiParticipants.length > 0) {
        const randomAI = aiParticipants[Math.floor(Math.random() * aiParticipants.length)];
        
        // Update AI participant speaking state
        setParticipants(prev => prev.map(p => 
          p.id === randomAI.id 
            ? { ...p, isSpeaking: true, lastActivity: new Date().toISOString() }
            : { ...p, isSpeaking: false }
        ));
        
        // setCurrentSpeaker(randomAI.id); // TODO: Implement speaker tracking
        
        const responses = [
          "That's a great point. I think we should consider the implications...",
          "I agree with that assessment. From my perspective as a " + randomAI.role + "...",
          "Interesting observation. Have we considered the potential risks?",
          "That aligns with our project goals. Let me add some context...",
          "I have some concerns about that approach. What if we tried...",
          "Excellent suggestion! This could really move us forward...",
          "I see the value in that. How do you think the team will respond?",
          "That's worth exploring further. What's our timeline for this?"
        ];
        
        const aiResponse: CallMessage = {
          id: (Date.now() + Math.random()).toString(),
          senderId: randomAI.id,
          senderName: randomAI.name,
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          isAudio: true,
          emotion: randomAI.currentEmotion,
          confidence: randomAI.confidence,
          sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
          keywords: [],
          reactions: [],
          isImportant: false
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // Stop speaking after response
        setTimeout(() => {
          setParticipants(prev => prev.map(p => 
            p.id === randomAI.id ? { ...p, isSpeaking: false } : p
          ));
          // setCurrentSpeaker(null); // TODO: Implement speaker tracking
        }, 2000);
      }
    }, 1000 + Math.random() * 3000);
  }, [participants]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    if (!videoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setVideoEnabled(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setVideoEnabled(false);
    }
  }, [videoEnabled]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening]);

  const endCall = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Save call data
    const callSummary = {
      duration: callDuration,
      participants: participants.length,
      messages: messages.length,
      analytics: callAnalytics,
      endTime: new Date().toISOString()
    };
    
    localStorage.setItem(`call-summary-${callId}`, JSON.stringify(callSummary));
    
    setCallStatus('ended');
    
    setTimeout(() => {
      navigate(`/projects/${projectId}`, { 
        state: { reload: true }
      });
    }, 2000);
  }, [callDuration, participants, messages, callAnalytics, callId, navigate, projectId]);

  // Initialize call and participants
  useEffect(() => {
    if (callId && projectId) {
      // Load call details from localStorage
      const storedCallData = localStorage.getItem(`call-${callId}`);
      if (storedCallData) {
        const callDetails = JSON.parse(storedCallData);
        setCallData(callDetails);
      }
      
      setCallStatus('active');
      startCallTimer();
      
      // Enhanced mock participants with more realistic data
      const enhancedParticipants: CallParticipant[] = [
        {
          id: 'user-current',
          name: 'You',
          role: 'Full Stack Developer',
          isAI: false,
          isUser: true,
          currentEmotion: 'neutral',
          confidence: 0.8,
          isActive: true,
          isSpeaking: false,
          department: 'Engineering',
          expertise: ['React', 'Node.js', 'TypeScript'],
          mood: 'engaged',
          stressLevel: 0.3,
          performanceScore: 0.85,
          networkQuality: 'excellent',
          deviceType: 'desktop',
          timeZone: 'PST',
          joinTime: new Date().toISOString()
        },
        {
          id: 'ai-sarah',
          name: 'Sarah Chen',
          role: 'Senior Project Manager',
          isAI: true,
          isUser: false,
          currentEmotion: 'focused',
          confidence: 0.9,
          isActive: true,
          isSpeaking: false,
          department: 'Product',
          expertise: ['Agile', 'Risk Management', 'Team Leadership'],
          mood: 'engaged',
          stressLevel: 0.2,
          performanceScore: 0.92,
          networkQuality: 'excellent',
          deviceType: 'desktop',
          timeZone: 'EST',
          joinTime: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: 'ai-mike',
          name: 'Mike Johnson',
          role: 'Senior Software Engineer',
          isAI: true,
          isUser: false,
          currentEmotion: 'neutral',
          confidence: 0.85,
          isActive: true,
          isSpeaking: false,
          department: 'Engineering',
          expertise: ['System Architecture', 'Performance', 'Security'],
          mood: 'neutral',
          stressLevel: 0.4,
          performanceScore: 0.78,
          networkQuality: 'good',
          deviceType: 'laptop',
          timeZone: 'CST',
          joinTime: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 'ai-lisa',
          name: 'Lisa Rodriguez',
          role: 'UX Designer',
          isAI: true,
          isUser: false,
          currentEmotion: 'excited',
          confidence: 0.88,
          isActive: true,
          isSpeaking: false,
          department: 'Design',
          expertise: ['User Research', 'Prototyping', 'Design Systems'],
          mood: 'excited',
          stressLevel: 0.1,
          performanceScore: 0.91,
          networkQuality: 'excellent',
          deviceType: 'tablet',
          timeZone: 'PST',
          joinTime: new Date(Date.now() - 180000).toISOString()
        }
      ];
      
      setParticipants(enhancedParticipants);
      
      // Initialize analytics tracking
      analyticsIntervalRef.current = setInterval(() => {
        updateCallAnalytics();
        generateAIInsights(messages, enhancedParticipants);
        simulateNetworkStats();
      }, 10000);
      
      // Simulate some initial conversation
      const initialMessages: CallMessage[] = [
        {
          id: '1',
          senderId: 'ai-sarah',
          senderName: 'Sarah Chen',
          message: "Good morning everyone! Thanks for joining today's sprint planning call. Let's review our current progress and plan for the next iteration.",
          timestamp: new Date(Date.now() - 180000).toISOString(),
          isAudio: true,
          emotion: 'focused',
          confidence: 0.9,
          sentiment: 'positive',
          keywords: ['sprint', 'planning', 'progress'],
          reactions: [],
          isImportant: true
        },
        {
          id: '2',
          senderId: 'ai-mike',
          senderName: 'Mike Johnson',
          message: "I've completed the backend API optimization. We're seeing a 40% performance improvement in response times.",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          isAudio: true,
          emotion: 'confident',
          confidence: 0.85,
          sentiment: 'positive',
          keywords: ['backend', 'API', 'optimization', 'performance'],
          reactions: [{ emoji: '👍', userId: 'ai-sarah', timestamp: new Date(Date.now() - 110000).toISOString() }],
          isImportant: false
        }
      ];
      
      setMessages(initialMessages);
    }
  }, [callId, projectId, startCallTimer, updateCallAnalytics, generateAIInsights, simulateNetworkStats, messages]); // Note: Dependencies simplified to avoid infinite loops

  // Initialize speech recognition with enhanced features
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = voiceSettings.language;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setCurrentTranscript(interimTranscript);
        
        if (finalTranscript) {
          handleUserMessage(finalTranscript);
          setCurrentTranscript('');
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setCurrentTranscript('');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [handleUserMessage, voiceSettings.language]);

  // Auto-pause/resume based on window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && callStatus === 'active') {
        pauseCall();
      } else if (!document.hidden && callStatus === 'paused') {
        resumeCall();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [callStatus, pauseCall, resumeCall]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'm':
            event.preventDefault();
            toggleMute();
            break;
          case 'e':
            event.preventDefault();
            endCall();
            break;
          case 's':
            event.preventDefault();
            setShowSettings(true);
            break;
          case 'r':
            event.preventDefault();
            toggleRecording();
            break;
          case 'f':
            event.preventDefault();
            toggleFullscreen();
            break;
        }
      }
      
      if (event.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen();
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleMute, endCall, toggleRecording, toggleFullscreen, isFullscreen, showSettings]);

  // Enhanced call ended state with analytics
  if (callStatus === 'ended') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-blue-50"
      >
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Call Completed</h2>
              <p className="text-muted-foreground">
                Great conversation! Here's a summary of your call.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{formatDuration(callDuration)}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-semibold">{participants.length}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="font-semibold">{messages.length}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="font-semibold">{Math.round(callAnalytics.averageEngagement * 100)}%</p>
              </div>
            </div>
            
            {callAnalytics.keyTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Key Topics Discussed</h3>
                <div className="flex flex-wrap gap-2">
                  {callAnalytics.keyTopics.map((topic, index) => (
                    <Badge key={index} variant="outline">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button onClick={exportTranscript} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Transcript
              </Button>
              <Button onClick={() => navigate(`/projects/${projectId}`)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${callPreferences.theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex-1 flex flex-col">
        {/* Enhanced Header with more controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {callData?.title || 'Team Call'}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        callStatus === 'active' ? 'bg-green-500 animate-pulse' : 
                        callStatus === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span>{callStatus === 'active' ? 'Live' : callStatus === 'paused' ? 'Paused' : 'Ended'}</span>
                    </div>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(callDuration)}</span>
                    <span>•</span>
                    <Users className="w-3 h-3" />
                    <span>{participants.filter(p => p.isActive).length} participants</span>
                    
                    {isRecording && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-red-600">
                          <Circle className="w-3 h-3 animate-pulse fill-current" />
                          <span>Recording</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Network Quality Indicator */}
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Signal className={`w-3 h-3 ${getNetworkQualityColor(networkStats.quality)}`} />
                  <span className="text-xs text-muted-foreground">{networkStats.latency}ms</span>
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <Button
                variant="ghost"
                size="sm"
                onClick={shareCall}
                className="hidden md:flex"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                className={`hidden md:flex ${isRecording ? 'text-red-600' : ''}`}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="hidden md:flex"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              {/* Pause/Resume */}
              {callStatus === 'active' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pauseCall}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : callStatus === 'paused' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resumeCall}
                  className="text-green-600 hover:text-green-700"
                >
                  <Play className="w-4 h-4" />
                </Button>
              ) : null}
              
              {/* Settings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Main Content with flexible layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Grid / Main Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 p-6 overflow-hidden"
          >
            {callPreferences.layout === 'grid' ? (
              // Grid Layout
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="relative cursor-pointer"
                    onClick={() => focusOnParticipant(participant.id)}
                  >
                    <Card className={`h-full border-0 shadow-lg relative overflow-hidden transition-all ${
                      participant.isSpeaking ? 'ring-4 ring-blue-500 shadow-blue-500/25' : ''
                    } ${selectedParticipant === participant.id ? 'ring-2 ring-purple-500' : ''}`}>
                      <CardContent className="p-0 h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
                        {/* Video placeholder or actual video */}
                        {videoEnabled && participant.isUser ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white/20">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="text-white font-semibold text-lg">{participant.name}</h3>
                            <p className="text-white/80 text-sm">{participant.role}</p>
                            {participant.department && (
                              <p className="text-white/60 text-xs mt-1">{participant.department}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Enhanced status indicators */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {participant.isAI && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          {participant.isUser && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              <Users className="w-3 h-3 mr-1" />
                              You
                            </Badge>
                          )}
                          {participant.networkQuality && (
                            <Badge variant="outline" className="bg-black/20 text-white border-white/20">
                              <Signal className={`w-3 h-3 mr-1 ${getNetworkQualityColor(participant.networkQuality)}`} />
                              {participant.networkQuality}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Emotion and mood indicators */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <Badge variant="outline" className={`${getEmotionColor(participant.currentEmotion)} border-white/20`}>
                            {React.createElement(getEmotionIcon(participant.currentEmotion), { className: 'w-3 h-3 mr-1' })}
                            {participant.currentEmotion}
                          </Badge>
                          {participant.mood && (
                            <Badge variant="outline" className="bg-black/20 text-white border-white/20">
                              <Heart className={`w-3 h-3 mr-1 ${getMoodColor(participant.mood)}`} />
                              {participant.mood}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Performance and stress indicators */}
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          {participant.performanceScore && (
                            <div className="bg-black/40 rounded-full px-2 py-1">
                              <span className="text-white text-xs">
                                {Math.round(participant.performanceScore * 100)}%
                              </span>
                            </div>
                          )}
                          {participant.stressLevel && participant.stressLevel > 0.7 && (
                            <div className="bg-red-500/80 rounded-full p-1">
                              <AlertCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Mute/Video indicators */}
                        <div className="absolute bottom-3 right-3 flex gap-2">
                          {participant.isUser && isMuted && (
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <MicOff className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {participant.isUser && !videoEnabled && (
                            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                              <CameraOff className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {participant.isSpeaking && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Speaker Layout
              <div className="h-full flex flex-col">
                {/* Main Speaker */}
                <div className="flex-1 mb-4">
                  {selectedParticipant ? (
                    <Card className="h-full border-0 shadow-lg relative overflow-hidden">
                      <CardContent className="p-0 h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
                        <div className="text-center">
                          <Avatar className="w-32 h-32 mx-auto mb-6 border-8 border-white/20">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                              {participants.find(p => p.id === selectedParticipant)?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <h2 className="text-white font-bold text-2xl mb-2">
                            {participants.find(p => p.id === selectedParticipant)?.name}
                          </h2>
                          <p className="text-white/80 text-lg">
                            {participants.find(p => p.id === selectedParticipant)?.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a participant to focus on</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Row */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex-shrink-0 w-24 h-18 cursor-pointer relative ${
                        selectedParticipant === participant.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedParticipant(participant.id)}
                    >
                      <Card className="h-full border-0 shadow-md">
                        <CardContent className="p-0 h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Enhanced Sidebar with tabs */}
          {(showTranscript || showParticipants || showAiInsights || showAnalytics) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
            >
              <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
                  <TabsTrigger value="transcript" className="text-xs">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="text-xs">
                    <Users className="w-4 h-4 mr-1" />
                    People
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">
                    <Brain className="w-4 h-4 mr-1" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Stats
                  </TabsTrigger>
                </TabsList>

                {/* Transcript Tab */}
                <TabsContent value="transcript" className="flex-1 flex flex-col p-4 pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Live Transcript</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportTranscript}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="space-y-2 mb-4">
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm"
                    />
                    <Select value={filterEmotion} onValueChange={setFilterEmotion}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Filter by emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All emotions</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="happy">Happy</SelectItem>
                        <SelectItem value="focused">Focused</SelectItem>
                        <SelectItem value="concerned">Concerned</SelectItem>
                        <SelectItem value="frustrated">Frustrated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {filterMessages.map((message) => (
                      <div key={message.id} className="group relative">
                        <div className="flex items-start gap-2">
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {message.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">
                                {message.senderName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                              <Badge variant="outline" className={`text-xs ${getEmotionColor(message.emotion)}`}>
                                {message.emotion}
                              </Badge>
                              {message.isImportant && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded leading-relaxed">
                              {message.message}
                            </p>
                            
                            {/* Message actions */}
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBookmark(message.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Bookmark className={`w-3 h-3 ${message.isImportant ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(message.message)}
                                className="h-6 px-2 text-xs"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              
                              {/* Quick reactions */}
                              <div className="flex gap-1">
                                {['👍', '👎', '❤️', '😊', '🤔'].map(emoji => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReaction(message.id, emoji)}
                                    className="h-6 w-6 p-0 text-xs"
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.reactions.map((reaction, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {reaction.emoji}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Current transcript */}
                    {currentTranscript && (
                      <div className="opacity-60 animate-pulse">
                        <div className="flex items-start gap-2">
                          <Avatar className="w-6 h-6 mt-1">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              Y
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">
                              You (speaking...)
                            </div>
                            <p className="text-sm text-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              {currentTranscript}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Participants Tab */}
                <TabsContent value="participants" className="flex-1 p-4 pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      Participants ({participants.length})
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {participants.filter(p => p.isActive).length} active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <Card key={participant.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {participant.name}
                              </p>
                              <div className="flex items-center gap-1">
                                {participant.isAI && <Brain className="w-3 h-3 text-purple-600" />}
                                <div className={`w-2 h-2 rounded-full ${
                                  participant.isActive ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{participant.role}</p>
                            {participant.department && (
                              <p className="text-xs text-muted-foreground">{participant.department}</p>
                            )}
                            
                            {/* Participant stats */}
                            <div className="flex items-center gap-4 mt-2">
                              {participant.performanceScore && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(participant.performanceScore * 100)}%
                                  </span>
                                </div>
                              )}
                              {participant.mood && (
                                <div className="flex items-center gap-1">
                                  <Heart className={`w-3 h-3 ${getMoodColor(participant.mood)}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {participant.mood}
                                  </span>
                                </div>
                              )}
                              {participant.networkQuality && (
                                <div className="flex items-center gap-1">
                                  <Signal className={`w-3 h-3 ${getNetworkQualityColor(participant.networkQuality)}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {participant.networkQuality}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Expertise tags */}
                            {participant.expertise && participant.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {participant.expertise.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* AI Insights Tab */}
                <TabsContent value="insights" className="flex-1 p-4 pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">AI Insights</h3>
                    <Badge variant="outline" className={`text-xs ${
                      aiInsights.meetingHealth === 'excellent' ? 'bg-green-100 text-green-800' :
                      aiInsights.meetingHealth === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aiInsights.meetingHealth}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Engagement Level */}
                    <Card className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground">Team Engagement</h4>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(aiInsights.engagementLevel * 100)}%
                        </span>
                      </div>
                      <Progress value={aiInsights.engagementLevel * 100} className="h-2" />
                    </Card>
                    
                    {/* Emotional State */}
                    <Card className="p-3">
                      <h4 className="text-sm font-medium text-foreground mb-2">Overall Mood</h4>
                      <Badge variant="outline" className={getEmotionColor(aiInsights.emotionalState)}>
                        {React.createElement(getEmotionIcon(aiInsights.emotionalState), { className: 'w-3 h-3 mr-1' })}
                        {aiInsights.emotionalState}
                      </Badge>
                    </Card>
                    
                    {/* Key Points */}
                    {aiInsights.keyPoints.length > 0 && (
                      <Card className="p-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">Key Discussion Points</h4>
                        <ul className="space-y-1">
                          {aiInsights.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                    
                    {/* Suggestions */}
                    {aiInsights.suggestions.length > 0 && (
                      <Card className="p-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">AI Suggestions</h4>
                        <div className="space-y-2">
                          {aiInsights.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    
                    {/* Recommended Actions */}
                    {aiInsights.recommendedActions.length > 0 && (
                      <Card className="p-3">
                        <h4 className="text-sm font-medium text-foreground mb-2">Recommended Actions</h4>
                        <div className="space-y-2">
                          {aiInsights.recommendedActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{action}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="flex-1 p-4 pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Call Analytics</h3>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Call Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-3 text-center">
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-foreground">{formatDuration(callDuration)}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </Card>
                      <Card className="p-3 text-center">
                        <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-foreground">{messages.length}</p>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </Card>
                    </div>
                    
                    {/* Network Quality */}
                    <Card className="p-3">
                      <h4 className="text-sm font-medium text-foreground mb-2">Network Quality</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Latency</span>
                          <span className="text-foreground">{Math.round(networkStats.latency)}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bandwidth</span>
                          <span className="text-foreground">{Math.round(networkStats.bandwidth)} kbps</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Packet Loss</span>
                          <span className="text-foreground">{networkStats.packetsLost}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quality</span>
                          <Badge variant="outline" className={`text-xs ${
                            networkStats.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                            networkStats.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {networkStats.quality}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Participation Rate */}
                    <Card className="p-3">
                      <h4 className="text-sm font-medium text-foreground mb-2">Participation</h4>
                      <div className="space-y-2">
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground flex-1">{participant.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((callAnalytics.participationRate[participant.id] || 0) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>

        {/* Enhanced Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCallPreferences(prev => ({ ...prev, layout: prev.layout === 'grid' ? 'speaker' : 'grid' }))}
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNetworkStats(!showNetworkStats)}
              >
                <Network className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCallPreferences(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
              >
                {callPreferences.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={toggleMute}
                className="rounded-full w-14 h-14 shadow-lg"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="lg"
                onClick={toggleVideo}
                className="rounded-full w-14 h-14 shadow-lg"
              >
                {videoEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
              </Button>

              <Button
                variant={isListening ? "default" : "outline"}
                size="lg"
                onClick={toggleListening}
                className="rounded-full w-14 h-14 shadow-lg"
              >
                {isListening ? (
                  <Activity className="w-6 h-6 animate-pulse" />
                ) : (
                  <Activity className="w-6 h-6" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full w-14 h-14 shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAiInsights(!showAiInsights)}
              >
                <Brain className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareCall}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              {isListening ? (
                <span className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Listening... Press Ctrl+M to mute
                </span>
              ) : (
                'Click microphone to speak • Press Ctrl+M to mute • Ctrl+E to end call'
              )}
            </p>
          </div>
        </motion.div>

        {/* Enhanced Settings Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Call Settings
              </DialogTitle>
              <DialogDescription>
                Customize your call experience with advanced settings and preferences.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred interface theme</p>
                    </div>
                    <Select 
                      value={callPreferences.theme} 
                      onValueChange={(value) => 
                        setCallPreferences(prev => ({ ...prev, theme: value as 'light' | 'dark' | 'auto' }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Layout</Label>
                      <p className="text-sm text-muted-foreground">How participants are displayed</p>
                    </div>
                    <Select 
                      value={callPreferences.layout} 
                      onValueChange={(value) => 
                        setCallPreferences(prev => ({ ...prev, layout: value as 'grid' | 'speaker' | 'sidebar' }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid View</SelectItem>
                        <SelectItem value="speaker">Speaker View</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Transcript</Label>
                      <p className="text-sm text-muted-foreground">Display live conversation transcript</p>
                    </div>
                    <Switch
                      checked={showTranscript}
                      onCheckedChange={setShowTranscript}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show Participants</Label>
                      <p className="text-sm text-muted-foreground">Display participant information panel</p>
                    </div>
                    <Switch
                      checked={showParticipants}
                      onCheckedChange={setShowParticipants}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Auto Record</Label>
                      <p className="text-sm text-muted-foreground">Automatically start recording calls</p>
                    </div>
                    <Switch
                      checked={callPreferences.autoRecord}
                      onCheckedChange={(checked: boolean) => 
                        setCallPreferences(prev => ({ ...prev, autoRecord: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Smart Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive AI-powered meeting insights</p>
                    </div>
                    <Switch
                      checked={callPreferences.smartNotifications}
                      onCheckedChange={(checked: boolean) => 
                        setCallPreferences(prev => ({ ...prev, smartNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="audio" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Voice Volume</Label>
                    <Slider
                      value={[voiceSettings.volume * 100]}
                      onValueChange={(value: number[]) => 
                        setVoiceSettings(prev => ({ ...prev, volume: value[0] / 100 }))
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>{Math.round(voiceSettings.volume * 100)}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Speech Rate</Label>
                    <Slider
                      value={[voiceSettings.rate * 100]}
                      onValueChange={(value: number[]) => 
                        setVoiceSettings(prev => ({ ...prev, rate: value[0] / 100 }))
                      }
                      max={200}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.5x</span>
                      <span>{voiceSettings.rate}x</span>
                      <span>2x</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Voice Pitch</Label>
                    <Slider
                      value={[voiceSettings.pitch * 100]}
                      onValueChange={(value: number[]) => 
                        setVoiceSettings(prev => ({ ...prev, pitch: value[0] / 100 }))
                      }
                      max={200}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Auto Transcribe</Label>
                      <p className="text-sm text-muted-foreground">Automatically transcribe speech to text</p>
                    </div>
                    <Switch
                      checked={voiceSettings.autoTranscribe}
                      onCheckedChange={(checked: boolean) => 
                        setVoiceSettings(prev => ({ ...prev, autoTranscribe: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Noise Suppression</Label>
                      <p className="text-sm text-muted-foreground">Filter out background noise</p>
                    </div>
                    <Switch
                      checked={voiceSettings.noiseSuppression}
                      onCheckedChange={(checked: boolean) => 
                        setVoiceSettings(prev => ({ ...prev, noiseSuppression: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Echo Cancellation</Label>
                      <p className="text-sm text-muted-foreground">Reduce audio echo and feedback</p>
                    </div>
                    <Switch
                      checked={voiceSettings.echoCancellation}
                      onCheckedChange={(checked: boolean) => 
                        setVoiceSettings(prev => ({ ...prev, echoCancellation: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="video" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Background Blur</Label>
                      <p className="text-sm text-muted-foreground">Blur your background during video calls</p>
                    </div>
                    <Switch
                      checked={callPreferences.backgroundBlur}
                      onCheckedChange={(checked: boolean) => 
                        setCallPreferences(prev => ({ ...prev, backgroundBlur: checked }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Virtual Background</Label>
                    <Select 
                      value={callPreferences.virtualBackground || 'none'} 
                      onValueChange={(value) => 
                        setCallPreferences(prev => ({ ...prev, virtualBackground: value === 'none' ? undefined : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select background" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="home">Home Office</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="space">Space</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Custom Status</Label>
                    <Input
                      placeholder="e.g., In a meeting, Do not disturb"
                      value={callPreferences.customStatus || ''}
                      onChange={(e) => 
                        setCallPreferences(prev => ({ ...prev, customStatus: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">AI Assistant</Label>
                      <p className="text-sm text-muted-foreground">Enable AI-powered meeting assistance</p>
                    </div>
                    <Switch
                      checked={callPreferences.aiAssistant}
                      onCheckedChange={(checked: boolean) => 
                        setCallPreferences(prev => ({ ...prev, aiAssistant: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Show AI Insights</Label>
                      <p className="text-sm text-muted-foreground">Display real-time AI insights and suggestions</p>
                    </div>
                    <Switch
                      checked={showAiInsights}
                      onCheckedChange={setShowAiInsights}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Auto-detect Action Items</Label>
                      <p className="text-sm text-muted-foreground">Automatically identify and highlight action items</p>
                    </div>
                    <Switch
                      checked={callPreferences.smartNotifications}
                      onCheckedChange={(checked: boolean) => 
                        setCallPreferences(prev => ({ ...prev, smartNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">AI Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Real-time sentiment analysis</li>
                      <li>• Automatic meeting summaries</li>
                      <li>• Action item detection</li>
                      <li>• Engagement monitoring</li>
                      <li>• Smart conversation insights</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
export default CallPage;
