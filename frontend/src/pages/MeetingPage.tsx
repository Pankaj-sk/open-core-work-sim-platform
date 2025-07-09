// 📄 PAGE: MeetingPage.tsx - Real-time AI meeting assistant
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Download,
  BarChart3,
  Share2,
  Square,
  Circle,
  Search,
  Copy,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';

interface Participant {
  id: string;
  name: string;
  role?: string;
  joinTime: string;
  speakingTime: number;
  isActive: boolean;
  isSpeaking: boolean;
}

interface Message {
  id: string;
  speakerId: string;
  speakerName: string;
  content: string;
  timestamp: string;
  confidence: number;
  isActionItem?: boolean;
  isDecision?: boolean;
  isImportant?: boolean;
}

interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  extractedFrom: string;
  timestamp: string;
}

interface MeetingInsights {
  duration: number;
  participantCount: number;
  speakingDistribution: { [participantId: string]: number };
  keyTopics: string[];
  actionItems: ActionItem[];
  decisions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementScore: number;
  nextSteps: string[];
}

const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  // Core meeting state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Audio controls
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // AI insights
  const [insights, setInsights] = useState<MeetingInsights>({
    duration: 0,
    participantCount: 0,
    speakingDistribution: {},
    keyTopics: [],
    actionItems: [],
    decisions: [],
    sentiment: 'neutral',
    engagementScore: 0.7,
    nextSteps: []
  });
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('transcript');
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Utility functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const extractActionItems = useCallback((text: string): ActionItem[] => {
    const actionPatterns = [
      /(?:action|todo|task|assign|follow[- ]?up|next step)[^.]*?([^.]+)/gi,
      /([^.]*(?:will|should|need to|must|have to)[^.]*)/gi,
      /([^.]*(?:by|before|due)[^.]*)/gi
    ];
    
    const items: ActionItem[] = [];
    actionPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (match.length > 10 && match.length < 200) {
            items.push({
              id: Date.now().toString() + index,
              task: match.trim(),
              priority: 'medium',
              extractedFrom: text.substring(0, 50) + '...',
              timestamp: new Date().toISOString()
            });
          }
        });
      }
    });
    
    return items.slice(0, 5); // Limit to 5 most recent
  }, []);

  const generateInsights = useCallback(() => {
    const now = Date.now();
    const recentMessages = messages.filter(m => 
      now - new Date(m.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    // Extract key topics from recent messages
    const allText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    const commonWords = allText.split(' ')
      .filter(word => word.length > 4)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const keyTopics = Object.entries(commonWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    // Calculate speaking distribution
    const speakingTime = participants.reduce((acc, p) => {
      acc[p.id] = p.speakingTime;
      return acc;
    }, {} as Record<string, number>);
    
    // Extract action items from all messages
    const allActionItems: ActionItem[] = [];
    messages.forEach(msg => {
      const items = extractActionItems(msg.content);
      allActionItems.push(...items);
    });
    
    setInsights({
      duration,
      participantCount: participants.length,
      speakingDistribution: speakingTime,
      keyTopics,
      actionItems: allActionItems.slice(-10), // Keep latest 10
      decisions: recentMessages.filter(m => 
        m.content.toLowerCase().includes('decide') || 
        m.content.toLowerCase().includes('agree')
      ).map(m => m.content),
      sentiment: 'positive', // TODO: Implement sentiment analysis
      engagementScore: Math.min(participants.length * 0.2 + 0.3, 1),
      nextSteps: allActionItems.slice(-3).map(item => item.task)
    });
  }, [messages, participants, duration, extractActionItems]);

  // Meeting controls
  const startMeeting = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
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
          
          if (finalTranscript.trim()) {
            const newMessage: Message = {
              id: Date.now().toString(),
              speakerId: 'current-user',
              speakerName: 'You',
              content: finalTranscript.trim(),
              timestamp: new Date().toISOString(),
              confidence: event.results[event.resultIndex][0].confidence || 0.9
            };
            
            setMessages(prev => [...prev, newMessage]);
            setCurrentTranscript('');
            
            // Update speaking time
            setParticipants(prev => prev.map(p => 
              p.id === 'current-user' 
                ? { ...p, speakingTime: p.speakingTime + finalTranscript.split(' ').length }
                : p
            ));
          }
        };
        
        recognitionRef.current.start();
        setIsListening(true);
      }
      
      // Add current user as participant
      setParticipants([{
        id: 'current-user',
        name: 'You',
        role: 'Host',
        joinTime: new Date().toISOString(),
        speakingTime: 0,
        isActive: true,
        isSpeaking: false
      }]);
      
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  const endMeeting = useCallback(() => {
    // Stop all recordings and timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsListening(false);
    
    // Save meeting summary
    const summary = {
      id: meetingId,
      duration,
      participants: participants.length,
      messages: messages.length,
      insights,
      endTime: new Date().toISOString()
    };
    
    localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(summary));
    
    // Show end screen or redirect
    navigate('/dashboard', { state: { meetingEnded: true, summary } });
  }, [duration, participants, messages, insights, meetingId, navigate]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(prev => !prev);
  }, [isMuted]);

  const exportSummary = useCallback(() => {
    const summary = {
      meetingId,
      duration: formatDuration(duration),
      participants: participants.map(p => ({ name: p.name, speakingTime: p.speakingTime })),
      keyTopics: insights.keyTopics,
      actionItems: insights.actionItems,
      decisions: insights.decisions,
      transcript: messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.speakerName}: ${m.content}`).join('\n')
    };
    
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meetingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meetingId, duration, participants, insights, messages]);

  // Generate insights periodically
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(generateInsights, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isRecording, generateInsights]);

  // Filter messages based on search
  const filteredMessages = messages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.speakerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                AI Meeting Assistant
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span>{isRecording ? 'Recording' : 'Ready'}</span>
                </div>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration)}</span>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>{participants.length} participants</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exportSummary}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Meeting Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 p-6 flex flex-col"
        >
          {!isRecording ? (
            /* Start Meeting Screen */
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-lg mx-auto">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mic className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Start Meeting
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Click start to begin recording and get AI-powered insights for your meeting.
                  </p>
                  <Button onClick={startMeeting} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Circle className="w-5 h-5 mr-2" />
                    Start Meeting
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Active Meeting Screen */
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Transcript */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Live Transcript
                      <Badge variant="outline" className="ml-auto">
                        {messages.length} messages
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-96 overflow-y-auto space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {message.speakerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{message.speakerName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm bg-gray-50 p-2 rounded">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {currentTranscript && (
                      <div className="flex items-start gap-3 opacity-60">
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            You
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm bg-blue-50 p-2 rounded animate-pulse">
                            {currentTranscript}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights Sidebar */}
              <div>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="insights">
                      <Brain className="w-4 h-4 mr-1" />
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                      <Target className="w-4 h-4 mr-1" />
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="insights" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Engagement Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={insights.engagementScore * 100} className="h-2" />
                        <p className="text-xs text-gray-600 mt-2">
                          {Math.round(insights.engagementScore * 100)}% engaged
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Key Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {insights.keyTopics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Speaking Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex justify-between text-sm mb-1">
                            <span>{participant.name}</span>
                            <span>{participant.speakingTime}s</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Action Items</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {insights.actionItems.map((item) => (
                          <div key={item.id} className="p-2 bg-gray-50 rounded text-xs">
                            <p className="font-medium">{item.task}</p>
                            <p className="text-gray-600 mt-1">
                              Priority: {item.priority}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {insights.nextSteps.map((step, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                            {step}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Meeting Controls */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-t border-gray-200 p-4"
        >
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full w-12 h-12"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={endMeeting}
              className="rounded-full w-12 h-12"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={exportSummary}
              className="rounded-full w-12 h-12"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-xs text-gray-600">
              Press Ctrl+M to mute • Ctrl+E to end meeting
            </p>
          </div>
        </motion.div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meeting Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Microphone</label>
              <p className="text-xs text-gray-600">
                Microphone access is required for transcription
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <p className="text-xs text-gray-600">
                Currently set to English (US)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingPage;
