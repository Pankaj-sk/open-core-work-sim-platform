import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Users, 
  MessageSquare,
  Settings,
  ArrowLeft,
  Activity,
  Brain,
  Heart,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Loader,
  Video,
  Camera,
  CameraOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';

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
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

const CallPage: React.FC = () => {
  const { projectId, callId } = useParams<{ projectId: string; callId: string }>();
  const navigate = useNavigate();
  
  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // Video states
  const [videoEnabled, setVideoEnabled] = useState(false);
  
  // Call states
  const [callData, setCallData] = useState<any>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  
  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: 'default'
  });
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      frustrated: 'bg-red-100 text-red-800'
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  const startCallTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const handleUserMessage = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: CallMessage = {
      id: Date.now().toString(),
      senderId: 'user-current',
      senderName: 'You',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isAudio: true,
      emotion: 'neutral',
      confidence: 0.8
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate AI responses
    setTimeout(() => {
      const aiParticipants = participants.filter(p => p.isAI);
      if (aiParticipants.length > 0) {
        const randomAI = aiParticipants[Math.floor(Math.random() * aiParticipants.length)];
        const aiResponse: CallMessage = {
          id: (Date.now() + 1).toString(),
          senderId: randomAI.id,
          senderName: randomAI.name,
          message: `Thanks for sharing that perspective. As a ${randomAI.role}, I think we should consider...`,
          timestamp: new Date().toISOString(),
          isAudio: true,
          emotion: 'focused',
          confidence: 0.9
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    }, 1000 + Math.random() * 2000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const endCall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setCallStatus('ended');
    
    setTimeout(() => {
      navigate(`/projects/${projectId}`, { 
        state: { reload: true }
      });
    }, 2000);
  };

  // Initialize call
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
      
      // Mock participants for demo
      setParticipants([
        {
          id: 'user-current',
          name: 'You',
          role: 'Developer',
          isAI: false,
          isUser: true,
          currentEmotion: 'neutral',
          confidence: 0.8,
          isActive: true,
          isSpeaking: false
        },
        {
          id: 'ai-sarah',
          name: 'Sarah Chen',
          role: 'Project Manager',
          isAI: true,
          isUser: false,
          currentEmotion: 'focused',
          confidence: 0.9,
          isActive: true,
          isSpeaking: false
        },
        {
          id: 'ai-mike',
          name: 'Mike Johnson',
          role: 'Senior Developer',
          isAI: true,
          isUser: false,
          currentEmotion: 'neutral',
          confidence: 0.85,
          isActive: true,
          isSpeaking: false
        }
      ]);
    }
  }, [callId, projectId, startCallTimer]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          handleUserMessage(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (callStatus === 'ended') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen p-6"
      >
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Call Ended</h2>
            <p className="text-muted-foreground mb-4">
              Duration: {formatDuration(callDuration)}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Returning to project dashboard...
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}`)} className="w-full">
              Back to Project
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {callData?.title || 'Team Call'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>{callData?.isInstant ? 'Instant Call' : 'Live'}</span>
                </div>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDuration(callDuration)}</span>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>{participants.filter(p => p.isActive).length} participants</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card className={`h-full border-0 shadow-lg relative overflow-hidden ${
                  participant.isSpeaking ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardContent className="p-0 h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
                    {/* Video placeholder */}
                    <div className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-white/20">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-white font-medium">{participant.name}</h3>
                      <p className="text-white/60 text-sm">{participant.role}</p>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {participant.isAI && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Brain className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      {participant.isUser && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          You
                        </Badge>
                      )}
                    </div>
                    
                    {/* Emotion indicator */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className={getEmotionColor(participant.currentEmotion)}>
                        {participant.currentEmotion}
                      </Badge>
                    </div>
                    
                    {/* Mute indicator */}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {participant.isUser && isMuted && (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <MicOff className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar */}
        {(showTranscript || showParticipants) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 bg-white border-l border-gray-200 flex flex-col"
          >
            {showTranscript && (
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Live Transcript
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{message.senderName}</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-foreground bg-gray-50 p-2 rounded">
                        {message.message}
                      </p>
                    </div>
                  ))}
                  {currentTranscript && (
                    <div className="space-y-1 opacity-60">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">You (speaking...)</span>
                      </div>
                      <p className="text-sm text-foreground bg-blue-50 p-2 rounded">
                        {currentTranscript}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showParticipants && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants ({participants.length})
                </h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {participant.isAI && <Brain className="w-3 h-3 text-purple-600" />}
                        <div className={`w-2 h-2 rounded-full ${
                          participant.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
            variant={videoEnabled ? "default" : "outline"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {videoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={isListening ? "default" : "outline"}
            size="lg"
            onClick={toggleListening}
            className="rounded-full w-12 h-12"
          >
            {isListening ? <Activity className="w-5 h-5 animate-pulse" /> : <Activity className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-12 h-12"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            {isListening ? 'Listening...' : 'Click microphone to speak'}
          </p>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
            <DialogDescription>
              Adjust your call preferences and audio settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show Transcript</span>
              <Button
                variant={showTranscript ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? 'On' : 'Off'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show Participants</span>
              <Button
                variant={showParticipants ? "default" : "outline"}
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                {showParticipants ? 'On' : 'Off'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Volume</label>
              <Progress value={voiceSettings.volume * 100} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Speech Rate</label>
              <Progress value={voiceSettings.rate * 50} className="w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallPage;
