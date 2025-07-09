// 📄 PAGE: CoachPage.tsx - AI-Powered Personal Mentor & Skill Development Coach
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  Target, 
  TrendingUp,
  Star,
  Map,
  CheckCircle2,
  Clock,
  Award,
  Users,
  BarChart3,
  Calendar,
  MessageCircle,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DataManager from '../utils/dataManager';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'feedback' | 'roadmap' | 'analysis' | 'skill-insight';
  analysisData?: {
    skillsUsed?: string[];
    improvementAreas?: string[];
    confidence?: number;
    communicationStyle?: string;
  };
}

interface AIGeneratedProject {
  id: string;
  title: string;
  description: string;
  targetSkills: string[];
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  scenarios: string[];
  learningObjectives: string[];
  successMetrics: string[];
  aiPersonas: {
    manager: { name: string; personality: string; focus: string };
    colleagues: { name: string; personality: string; role: string }[];
  };
}

interface SkillRoadmap {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  projects: AIGeneratedProject[];
  milestones: {
    week: number;
    title: string;
    expectedSkills: string[];
    assessmentType: string;
  }[];
}

const CoachPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [currentRoadmap, setCurrentRoadmap] = useState<SkillRoadmap | null>(null);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [userData, setUserData] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Load user data and initialize component
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    
    isInitializedRef.current = true;
    
    // Load user data for personalized coaching
    const loadedUserData = DataManager.getUserSkillData();
    const loadedUserProgress = DataManager.getUserProgress();
    
    if (!loadedUserData || !loadedUserData.name) {
      navigate('/onboarding');
      return;
    }
    
    setUserData(loadedUserData);
    setUserProgress(loadedUserProgress);

    // Load existing roadmap and journey status
    const savedRoadmap = localStorage.getItem('aiCoachRoadmap');
    const journeyStatus = localStorage.getItem('journeyStarted');
    if (savedRoadmap) {
      setCurrentRoadmap(JSON.parse(savedRoadmap));
    }
    if (journeyStatus === 'true') {
      setJourneyStarted(true);
    }

    // Load messages
    const savedMessages = localStorage.getItem('aiCoachMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } else {
      // Initialize with personalized AI coach welcome
      const welcomeMessage: Message = {
        id: 'ai-welcome',
        content: `Hello ${loadedUserData?.name || 'there'}! I'm your AI Career Coach, and I'm here to be your personal mentor throughout your professional development journey.

I've analyzed your profile and here's what I found:
• Experience Level: ${loadedUserData?.experienceLevel || 'Not specified'}
• Primary Goals: ${loadedUserData?.careerGoals?.slice(0, 3).join(', ') || 'Skill development'}
• Focus Areas: ${loadedUserData?.improvementAreas?.slice(0, 2).join(', ') || 'Communication, Leadership'}

Here's what I can help you with:
• Create personalized skill development roadmaps
• Analyze your progress and provide real-time feedback
• Design custom project scenarios for practice
• Mentor you through challenges and celebrations
• Monitor your conversations and suggest improvements

I'm always here to chat - ask me anything about your career, current projects, or skill development. What would you like to explore first?`,
        sender: 'coach',
        timestamp: new Date(),
        type: 'feedback'
      };
      setMessages([welcomeMessage]);
    }
  }, [navigate]); // Only depend on navigate

  // Auto-scroll to bottom when messages change - use a more efficient approach
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]); // Only depend on messages length, not the entire messages array

  // Helper function to save messages to localStorage
  const saveMessagesToStorage = useCallback((messagesToSave: Message[]) => {
    if (messagesToSave.length > 0) {
      const messagesToSaveFormatted = messagesToSave.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem('aiCoachMessages', JSON.stringify(messagesToSaveFormatted));
    }
  }, []);

  // Helper function to save roadmap to localStorage
  const saveRoadmapToStorage = useCallback((roadmap: SkillRoadmap) => {
    localStorage.setItem('aiCoachRoadmap', JSON.stringify(roadmap));
  }, []);

  // Helper function to save journey status
  const saveJourneyStatus = useCallback((status: boolean) => {
    localStorage.setItem('journeyStarted', status.toString());
  }, []);

  // AI-powered roadmap generation based on user data
  const generatePersonalizedRoadmap = useCallback(async (): Promise<SkillRoadmap> => {
    const userGoals = userData?.careerGoals || [];
    const experienceLevel = userData?.experienceLevel || 'entry';
    
    // Generate AI-powered projects based on user's specific needs
    const projects: AIGeneratedProject[] = [
      {
        id: 'proj-communication',
        title: 'Communication Mastery Challenge',
        description: `Designed specifically for your goal to ${userGoals[0] || 'improve communication skills'}. Practice essential workplace conversations in a safe environment.`,
        targetSkills: ['Communication', 'Active Listening', 'Confidence', 'Professional Presence'],
        duration: '2 weeks',
        difficulty: experienceLevel === 'entry' ? 'Beginner' : experienceLevel === 'senior' ? 'Advanced' : 'Intermediate',
        scenarios: [
          'Leading your first team meeting',
          'Presenting project updates to stakeholders',
          'Handling difficult feedback conversations',
          'Networking at a professional event'
        ],
        learningObjectives: [
          'Develop clear and confident speaking skills',
          'Master active listening techniques',
          'Build professional presence and credibility',
          'Learn to handle challenging conversations gracefully'
        ],
        successMetrics: [
          'Complete 5 conversation scenarios',
          'Receive positive feedback on communication style',
          'Demonstrate improved confidence levels',
          'Successfully navigate conflict resolution'
        ],
        aiPersonas: {
          manager: {
            name: 'Sarah Chen',
            personality: 'Supportive yet challenging, focuses on growth',
            focus: 'Communication development and leadership skills'
          },
          colleagues: [
            {
              name: 'Marcus Rodriguez',
              personality: 'Direct and analytical, detail-oriented',
              role: 'Senior Analyst'
            },
            {
              name: 'Emma Thompson',
              personality: 'Collaborative and creative, team-focused',
              role: 'Design Lead'
            }
          ]
        }
      },
      {
        id: 'proj-leadership',
        title: 'Leadership Development Intensive',
        description: `Building on your communication skills to develop ${userGoals[1] || 'leadership abilities'}. Lead complex projects and guide team dynamics.`,
        targetSkills: ['Leadership', 'Decision Making', 'Team Management', 'Strategic Thinking'],
        duration: '3 weeks',
        difficulty: 'Intermediate',
        scenarios: [
          'Managing a cross-functional project team',
          'Making difficult resource allocation decisions',
          'Resolving team conflicts and tensions',
          'Presenting strategic recommendations to executives'
        ],
        learningObjectives: [
          'Develop authentic leadership style',
          'Master team motivation and delegation',
          'Build strategic thinking capabilities',
          'Learn to make confident decisions under pressure'
        ],
        successMetrics: [
          'Successfully lead a virtual team project',
          'Demonstrate improved decision-making speed',
          'Resolve complex team dynamics',
          'Present compelling strategic recommendations'
        ],
        aiPersonas: {
          manager: {
            name: 'David Park',
            personality: 'Strategic and mentoring, focuses on big picture',
            focus: 'Leadership development and strategic thinking'
          },
          colleagues: [
            {
              name: 'Jennifer Walsh',
              personality: 'Results-driven and ambitious, competitive',
              role: 'Product Manager'
            },
            {
              name: 'Ahmed Hassan',
              personality: 'Methodical and precise, quality-focused',
              role: 'Quality Assurance Lead'
            }
          ]
        }
      },
      {
        id: 'proj-mastery',
        title: 'Advanced Professional Mastery',
        description: `The culmination of your development journey, focusing on ${userGoals[2] || 'advanced professional skills'}. Handle complex business challenges.`,
        targetSkills: ['Strategic Planning', 'Stakeholder Management', 'Innovation', 'Mentoring'],
        duration: '4 weeks',
        difficulty: 'Advanced',
        scenarios: [
          'Leading organizational change initiative',
          'Managing C-level stakeholder relationships',
          'Mentoring junior team members',
          'Driving innovation in traditional processes'
        ],
        learningObjectives: [
          'Master complex stakeholder management',
          'Develop change leadership capabilities',
          'Build mentoring and coaching skills',
          'Drive innovation and transformation'
        ],
        successMetrics: [
          'Successfully lead a change management project',
          'Build strong relationships with senior stakeholders',
          'Effectively mentor junior colleagues',
          'Propose and implement innovative solutions'
        ],
        aiPersonas: {
          manager: {
            name: 'Rachel Kim',
            personality: 'Visionary and empowering, focuses on transformation',
            focus: 'Executive presence and strategic impact'
          },
          colleagues: [
            {
              name: 'Thomas Anderson',
              personality: 'Experienced and wise, change-resistant',
              role: 'Senior Director'
            },
            {
              name: 'Lisa Zhang',
              personality: 'Eager and talented, seeks mentorship',
              role: 'Junior Developer'
            }
          ]
        }
      }
    ];

    const roadmap: SkillRoadmap = {
      id: `roadmap-${Date.now()}`,
      title: `${userData?.name || 'Your'} Personalized Career Development Roadmap`,
      description: `A custom-designed 9-week journey to achieve your goals: ${userGoals.slice(0, 3).join(', ') || 'Build essential workplace skills'}. Each project is tailored to your experience level and learning preferences.`,
      totalDuration: '9 weeks',
      projects: projects,
      milestones: [
        {
          week: 2,
          title: 'Communication Foundation',
          expectedSkills: ['Clear Communication', 'Active Listening', 'Professional Presence'],
          assessmentType: 'Conversation Analysis & Peer Feedback'
        },
        {
          week: 5,
          title: 'Leadership Emergence',
          expectedSkills: ['Team Leadership', 'Decision Making', 'Conflict Resolution'],
          assessmentType: 'Project Leadership Evaluation'
        },
        {
          week: 9,
          title: 'Professional Mastery',
          expectedSkills: ['Strategic Thinking', 'Stakeholder Management', 'Mentoring'],
          assessmentType: 'Comprehensive Skills Assessment'
        }
      ]
    };

    return roadmap;
  }, [userData]); // Dependencies: userData

  // AI-powered message processing and response generation
  const generateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    const userName = userData?.name || 'there';
    
    // Roadmap management and modification
    if (lowerMessage.includes('change roadmap') || lowerMessage.includes('modify roadmap') || lowerMessage.includes('update roadmap')) {
      if (currentRoadmap) {
        return `I can definitely help you modify your roadmap, ${userName}! I have the ability to adapt your development plan based on your evolving needs and feedback.\n\n**Current Roadmap: "${currentRoadmap.title}"**\n\n**What I can modify:**\n• Add or remove projects based on your interests\n• Adjust difficulty levels and timelines\n• Change focus areas and target skills\n• Update AI team members and scenarios\n• Modify milestones and assessments\n\n**Tell me specifically what you'd like to change:**\n• "Add a project focused on [specific skill]"\n• "Make the leadership project more challenging"\n• "Change the timeline for [project name]"\n• "I want to focus more on [specific area]"\n\nYour roadmap is dynamic and should evolve with you. What adjustments would you like to make?`;
      } else {
        return `I'd be happy to create a roadmap for you first, ${userName}! Once we have your initial roadmap, I can continuously modify and adapt it based on your progress, feedback, and changing goals.\n\nWould you like me to generate your personalized roadmap now?`;
      }
    }

    // Meeting and conversation insights
    if (lowerMessage.includes('meeting') || lowerMessage.includes('conversation') || lowerMessage.includes('team discussion')) {
      return `I have access to all your meeting data and conversation history, ${userName}! I can analyze your interactions to provide personalized insights.\n\n**What I can tell you about your meetings:**\n• Communication patterns and effectiveness\n• Areas where you excelled or need improvement\n• Feedback from AI team members\n• Skill development opportunities from real conversations\n• Progress tracking across different interaction types\n\n**Meeting Analysis I provide:**\n• Daily standups: Communication clarity and team engagement\n• Code reviews: Technical communication and feedback delivery\n• One-on-ones: Relationship building and professional development\n• Project planning: Leadership and strategic thinking\n\n**I can help you with:**\n• Preparing for upcoming meetings\n• Analyzing past conversation performance\n• Suggesting conversation starters\n• Improving specific interaction skills\n\nWhat specific meeting or conversation aspect would you like to discuss?`;
    }

    // Progress and analytics
    if (lowerMessage.includes('progress') || lowerMessage.includes('analytics') || lowerMessage.includes('performance')) {
      const completedProjects = userProgress?.completedProjects || 0;
      const skillsImproved = userProgress?.skillsImproved || [];
      const conversationCount = messages.filter(m => m.sender === 'user').length;
      
      return `Let me give you a comprehensive progress analysis, ${userName}!\n\n**📊 Your Performance Dashboard:**\n• Projects Completed: ${completedProjects}\n• Skills Actively Developing: ${skillsImproved.join(', ') || 'Communication, Leadership'}\n• Coach Interactions: ${conversationCount} conversations\n• Journey Status: ${journeyStarted ? 'Active' : 'Planning Phase'}\n\n**🎯 Skill Development Tracking:**\n• Primary Focus: ${userData?.careerGoals?.[0] || 'Professional Growth'}\n• Improvement Areas: ${userData?.improvementAreas?.join(', ') || 'Communication, Leadership'}\n• Learning Style: ${userData?.preferredLearningStyle || 'Interactive Practice'}\n\n**📈 Recent Insights:**\n• I've been tracking your conversation patterns\n• Your engagement level shows strong commitment\n• ${journeyStarted ? 'Your journey momentum is building well' : 'You\'re ready to begin your structured journey'}\n\n**🔄 Continuous Improvement:**\nI adapt your roadmap based on your progress, feedback, and evolving goals. Your development plan is always current and relevant.\n\nWould you like me to focus on any specific area or adjust your roadmap based on your current progress?`;
    }

    // Roadmap details and project information
    if (lowerMessage.includes('roadmap') || lowerMessage.includes('plan') || lowerMessage.includes('journey')) {
      if (currentRoadmap && journeyStarted) {
        return `Your roadmap is your active development guide, ${userName}! Here's everything about your journey:

"${currentRoadmap.title}"
${currentRoadmap.description}

Your Projects:
${currentRoadmap.projects.map((p, i) => `${i + 1}. ${p.title} (${p.difficulty} - ${p.duration})
   Focus: ${p.targetSkills.slice(0, 3).join(', ')}
   AI Team: ${p.aiPersonas.manager.name} + ${p.aiPersonas.colleagues.length} colleagues`).join('\n\n')}

Milestones:
${currentRoadmap.milestones.map(m => `Week ${m.week}: ${m.title}`).join('\n')}

Roadmap Management:
• I can modify any aspect of your roadmap
• Add new projects or adjust existing ones
• Change timelines based on your pace
• Update focus areas as your interests evolve

Integration with Everything:
• I track your meeting performance
• I analyze your conversation skills
• I adjust recommendations based on real interactions
• I provide personalized coaching throughout

What specific aspect of your roadmap would you like to explore or modify?`;
      } else if (currentRoadmap && !journeyStarted) {
        return `Your roadmap is ready for activation, ${userName}! I've created "${currentRoadmap.title}" specifically for your goals.

What's Included:
• ${currentRoadmap.projects.length} custom projects
• ${currentRoadmap.totalDuration} structured timeline
• AI team members tailored to your learning style
• Real-time progress tracking and adjustments

Smart Features:
• I continuously adapt based on your performance
• Integration with all your meetings and conversations
• Personalized feedback from every interaction
• Flexible modification whenever you need changes

Ready to Start:
Once you begin your journey, I'll actively track your progress across all projects and conversations, providing real-time coaching and roadmap adjustments.

Ready to officially start your development journey?`;
      } else {
        return `I'll create a comprehensive roadmap for you, ${userName}! My roadmaps are intelligent and adaptive.\n\n**🧠 What Makes My Roadmaps Special:**\n• Based on your specific goals: ${userData?.careerGoals?.join(', ') || 'Professional development'}\n• Matched to your experience level: ${userData?.experienceLevel || 'Entry'}\n• Integrated with meeting and conversation analysis\n• Continuously adaptable as you progress\n\n**📊 Full Integration:**\n• I track all your project conversations\n• I analyze your meeting performance\n• I adjust recommendations based on real interactions\n• I provide coaching throughout your journey\n\n**🔄 Dynamic and Flexible:**\n• Modify projects anytime based on your feedback\n• Adjust timelines to match your pace\n• Add new focus areas as interests evolve\n• Update difficulty levels as you grow\n\nShall I generate your personalized, adaptive roadmap now?`;
      }
    }

    // Project-specific questions
    if (lowerMessage.includes('project') || lowerMessage.includes('scenario') || lowerMessage.includes('practice')) {
      if (currentRoadmap) {
        const projects = currentRoadmap.projects;
        return `Let me explain your projects in detail, ${userName}!\n\n**🎭 Your Custom Projects:**\n${projects.map((p, i) => `**${i + 1}. ${p.title}**\n• Level: ${p.difficulty}\n• Duration: ${p.duration}\n• Skills: ${p.targetSkills.join(', ')}\n• AI Team: ${p.aiPersonas.manager.name} (Manager) + ${p.aiPersonas.colleagues.map(c => c.name).join(', ')}\n• Practice Scenarios: ${p.scenarios.length} realistic situations`).join('\n\n')}\n\n**🎯 How Projects Work:**\n• Each project has realistic workplace scenarios\n• AI team members have unique personalities and roles\n• I track your performance across all conversations\n• Real-time feedback and coaching throughout\n• Skills development measured and tracked\n\n**📊 Meeting Integration:**\n• All project meetings are analyzed\n• I provide insights on communication effectiveness\n• Team dynamics and interaction patterns tracked\n• Continuous improvement suggestions based on real data\n\n**🔧 Customization:**\n• I can modify any project based on your feedback\n• Adjust difficulty, timeline, or focus areas\n• Add new scenarios or team members\n• Change objectives to match your evolving goals\n\nWhich project interests you most, or would you like me to modify any aspect of them?`;
      } else {
        return `I'll create custom projects for you, ${userName}! My projects are designed to be realistic, engaging, and directly tied to your goals.\n\n**🎭 What My Projects Include:**\n• Realistic workplace scenarios\n• AI team members with unique personalities\n• Meeting and conversation tracking\n• Real-time performance analysis\n• Continuous coaching and feedback\n\n**📊 Smart Integration:**\n• Every conversation is analyzed for skill development\n• Meeting performance directly impacts roadmap adjustments\n• Progress tracking across all interactions\n• Personalized coaching based on real data\n\n**🎯 Tailored to You:**\n• Based on your goals: ${userData?.careerGoals?.join(', ') || 'Professional development'}\n• Matched to your level: ${userData?.experienceLevel || 'Entry'}\n• Focus areas: ${userData?.improvementAreas?.join(', ') || 'Communication, Leadership'}\n\nShall I create your personalized project roadmap now?`;
      }
    }

    // Skill assessment and feedback
    if (lowerMessage.includes('assess') || lowerMessage.includes('evaluate') || lowerMessage.includes('skills') || lowerMessage.includes('feedback')) {
      const currentSkills = userData?.currentSkills || [];
      const gaps = userData?.improvementAreas || [];
      const completedProjects = userProgress?.completedProjects || 0;
      
      return `Let me provide a comprehensive skill assessment, ${userName}!\n\n**💪 Current Strengths:**\n${currentSkills.slice(0, 4).map((skill: string) => `✅ ${skill} - Strong foundation, continue building`).join('\n')}\n\n**🎯 Development Areas:**\n${gaps.slice(0, 3).map((area: string) => `📈 ${area} - High-impact area for your goals`).join('\n')}\n\n**📊 Performance Analysis:**\n• Projects Completed: ${completedProjects}\n• Meeting Interactions: I track all your conversations\n• Communication Patterns: Analyzed across all interactions\n• Skill Progression: Continuously monitored\n\n**🔍 Real-Time Insights:**\n• I analyze every meeting you have\n• Conversation effectiveness is measured\n• Team interaction patterns are tracked\n• Feedback is immediate and actionable\n\n**📈 Adaptive Development:**\n• Your roadmap adjusts based on assessed performance\n• Projects modified to target specific skill gaps\n• Difficulty levels adapted to your progression\n• Focus areas updated as you improve\n\n**🎯 My Recommendation:**\nBased on your current assessment, focus on ${gaps[0] || 'communication skills'} through structured practice in realistic scenarios.\n\nWould you like me to create specific practice opportunities or modify your roadmap to address any particular skill area?`;
    }

    // Career advice and strategy
    if (lowerMessage.includes('career') || lowerMessage.includes('advice') || lowerMessage.includes('next step') || lowerMessage.includes('guidance')) {
      return `Here's my strategic career guidance based on your complete profile, ${userName}!\n\n**🎯 Immediate Focus (Next 2-4 weeks):**\n• Primary Challenge: ${userData?.workplaceChallenges?.[0] || 'Professional communication'}\n• Development Method: Structured practice through realistic scenarios\n• Goal Alignment: Direct support for ${userData?.careerGoals?.[0] || 'career advancement'}\n• Success Metrics: Measurable through meeting analysis\n\n**📈 Strategic Development (1-3 months):**\n• Skill Building: ${userData?.improvementAreas?.join(', ') || 'Leadership, Communication'}\n• Project-Based Learning: Real scenarios with AI team feedback\n• Performance Tracking: Comprehensive meeting and conversation analysis\n• Roadmap Evolution: Continuous adaptation based on progress\n\n**🚀 Long-term Vision (6-12 months):**\n• Career Positioning: ${userData?.careerGoals?.[1] || 'Leadership advancement'}\n• Mastery Development: Advanced scenarios and complex challenges\n• Integration: All skills working together in realistic situations\n• Impact Measurement: Clear progress tracking and goal achievement\n\n**💡 My Integrated Approach:**\n• I analyze every interaction you have\n• Roadmap adjustments based on real performance\n• Meeting insights drive development recommendations\n• Continuous coaching throughout your journey\n\n**🔧 Adaptive Strategy:**\n• Your roadmap evolves as you do\n• Projects modified based on your feedback and progress\n• New challenges added as you master current skills\n• Timeline adjustments to match your pace\n\nWhat specific career challenge would you like to tackle first through structured practice?`;
    }

    // Default intelligent mentor response
    const topics = lowerMessage.split(' ').filter(word => word.length > 3);
    const relevantTopics = topics.slice(0, 3).join(', ');
    
    return `I'm here to help with ${relevantTopics || 'your professional development'}, ${userName}! As your AI mentor, I have comprehensive knowledge of your journey.

What I Know About You:
• Your goals: ${userData?.careerGoals?.slice(0, 2).join(', ') || 'Professional growth'}
• Your focus areas: ${userData?.improvementAreas?.slice(0, 2).join(', ') || 'Communication, Leadership'}
• Your progress: ${userProgress?.completedProjects || 0} projects completed
• Your interactions: I analyze all your meetings and conversations

How I Can Help:
• Roadmap Management: Create, modify, and adapt your development plan
• Meeting Analysis: Insights from all your conversations and interactions
• Real-time Coaching: Immediate feedback and guidance
• Progress Tracking: Comprehensive performance monitoring
• Skill Development: Targeted practice through realistic scenarios

My Capabilities:
• Analyze your meeting performance and communication patterns
• Modify your roadmap based on progress and feedback
• Create custom projects tailored to your evolving needs
• Provide insights from all your interactions and conversations
• Adapt recommendations based on real-time data

${currentRoadmap ? `Your roadmap "${currentRoadmap.title}" is ready for your input and modifications!` : 'Would you like me to create a personalized roadmap for your goals?'}

What specific aspect of your development would you like to explore or modify?`;
  }, [userData, currentRoadmap, userProgress, messages, journeyStarted]);

  // Handle message sending with AI analysis
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      saveMessagesToStorage(newMessages);
      return newMessages;
    });
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(currentMessage);
      
      const coachMessage: Message = {
        id: `coach-${Date.now()}`,
        content: aiResponse,
        sender: 'coach',
        timestamp: new Date(),
        type: 'feedback',
        analysisData: {
          skillsUsed: ['Communication', 'Critical Thinking'],
          confidence: Math.random() * 0.3 + 0.7,
          communicationStyle: 'Professional and clear'
        }
      };

      setMessages(prev => {
        const newMessages = [...prev, coachMessage];
        saveMessagesToStorage(newMessages);
        return newMessages;
      });
      setIsTyping(false);

      // Check if roadmap generation was requested
      if (currentMessage.toLowerCase().includes('roadmap') || currentMessage.toLowerCase().includes('plan')) {
        setTimeout(() => {
          handleGenerateRoadmap();
        }, 1000);
      }
    }, 1500);
  }, [inputMessage, generateAIResponse, saveMessagesToStorage]);

  // Generate personalized roadmap
  const handleGenerateRoadmap = useCallback(async () => {
    setIsGeneratingRoadmap(true);
    
    try {
      const roadmap = await generatePersonalizedRoadmap();
      setCurrentRoadmap(roadmap);
      saveRoadmapToStorage(roadmap);
      
      const roadmapMessage: Message = {
        id: `roadmap-${Date.now()}`,
        content: `Your Personalized Roadmap is Ready!

I've created "${roadmap.title}" - a comprehensive ${roadmap.totalDuration} development journey with ${roadmap.projects.length} custom projects.

Key Highlights:
${roadmap.projects.map((p, i) => `${i + 1}. ${p.title} (${p.duration})`).join('\n')}

Each project includes realistic scenarios, AI team members tuned to your learning style, and detailed progress tracking. Click the "View Roadmap" tab to explore your journey!

Ready to start your first project?`,
        sender: 'coach',
        timestamp: new Date(),
        type: 'roadmap'
      };
      
      setMessages(prev => {
        const newMessages = [...prev, roadmapMessage];
        saveMessagesToStorage(newMessages);
        return newMessages;
      });
      setActiveTab('roadmap');
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  }, [generatePersonalizedRoadmap, saveRoadmapToStorage, saveMessagesToStorage]);

  // Start the journey - makes roadmap permanent
  const handleStartJourney = useCallback(() => {
    if (!currentRoadmap) return;
    
    setJourneyStarted(true);
    saveJourneyStatus(true);
    localStorage.setItem('journeyStartDate', new Date().toISOString());
    
    const journeyMessage: Message = {
      id: `journey-start-${Date.now()}`,
      content: `Journey Started!

Congratulations on committing to your growth! Your "${currentRoadmap.title}" is now your permanent development roadmap.

What happens next:
• Your roadmap is permanently accessible in the "My Roadmap" tab
• I'll track your progress across all projects
• You'll receive personalized feedback and guidance
• Each project you complete builds toward your career goals

Your first project: ${currentRoadmap.projects[0]?.title}
Focus skills: ${currentRoadmap.projects[0]?.targetSkills.slice(0, 3).join(', ')}

I'm excited to be your mentor throughout this journey. Ready to start your first project?`,
      sender: 'coach',
      timestamp: new Date(),
      type: 'roadmap'
    };
    
    setMessages(prev => {
      const newMessages = [...prev, journeyMessage];
      saveMessagesToStorage(newMessages);
      return newMessages;
    });
  }, [currentRoadmap, saveJourneyStatus, saveMessagesToStorage]);

  // Start a specific project
  const handleStartProject = (project: AIGeneratedProject) => {
    const projectContext = {
      id: project.id,
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      goals: project.learningObjectives,
      teamMembers: project.aiPersonas,
      userProgress: userProgress,
      startedAt: new Date().toISOString(),
      coachGenerated: true,
      targetSkills: project.targetSkills,
      scenarios: project.scenarios
    };
    
    localStorage.setItem('currentProjectContext', JSON.stringify(projectContext));
    localStorage.setItem('currentProjectId', project.id);
    
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">AI Career Coach</h1>
                  <p className="text-sm text-gray-600">Your intelligent mentor for professional growth</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
              {journeyStarted && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Journey Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>AI Mentor Chat</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center space-x-2">
              <Map className="w-4 h-4" />
              <span>{journeyStarted ? 'My Journey' : 'My Roadmap'}</span>
              {journeyStarted && <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">Active</Badge>}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Progress Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* User Profile Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-white border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center text-gray-800">
                      <Users className="w-4 h-4 mr-2" />
                      Your Profile
                      {journeyStarted && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">Journey Active</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium text-gray-900">{userData?.experienceLevel || 'Entry'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Projects:</span>
                      <span className="font-medium text-gray-900">{userProgress?.completedProjects || 0} completed</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-gray-600 text-xs mb-1">Goals:</div>
                      <div className="flex flex-wrap gap-1">
                        {(userData?.careerGoals?.slice(0, 2) || ['Communication']).map((goal: string) => (
                          <Badge key={goal} variant="outline" className="text-xs">{goal}</Badge>
                        ))}
                      </div>
                    </div>
                    {journeyStarted && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-green-600 font-medium text-sm">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          Journey Started
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(localStorage.getItem('journeyStartDate') || '').toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Chat Area */}
              <div className="lg:col-span-3">
                <Card className="h-[650px] flex flex-col bg-white border shadow-sm">
                  <CardHeader className="flex-shrink-0 border-b">
                    <CardTitle className="flex items-center text-gray-900">
                      <Brain className="w-5 h-5 mr-2" />
                      Chat with Your AI Career Coach
                    </CardTitle>
                    <CardDescription>
                      Ask me anything about your career development, roadmap, projects, or get personalized advice
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-4">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-lg p-4 ${
                            message.sender === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-2 ${
                              message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="flex-shrink-0 space-y-3 border-t pt-4">
                      {/* Suggested Questions */}
                      {messages.length <= 1 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500 w-full mb-1">Try asking:</span>
                          {[
                            "Create my roadmap",
                            "What should I focus on?",
                            "How do I start my journey?",
                            "Tell me about my progress"
                          ].map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              onClick={() => setInputMessage(suggestion)}
                              className="text-xs h-7 px-3"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Ask your AI coach anything..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isTyping}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            {currentRoadmap ? (
              <div className="space-y-6">
                {/* Roadmap Header */}
                <Card className="bg-white border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-900">{currentRoadmap.title}</h2>
                        <p className="text-gray-600 mb-4">{currentRoadmap.description}</p>
                      </div>
                      {!journeyStarted && (
                        <Button 
                          onClick={handleStartJourney}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Start Journey
                        </Button>
                      )}
                      {journeyStarted && (
                        <Badge className="bg-green-100 text-green-800 px-4 py-2">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Journey Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {currentRoadmap.totalDuration}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        {currentRoadmap.projects.length} Projects
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        {currentRoadmap.milestones.length} Milestones
                      </div>
                      {journeyStarted && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Started {new Date(localStorage.getItem('journeyStartDate') || '').toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentRoadmap.projects.map((project, index) => (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow bg-white border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={
                            project.difficulty === 'Beginner' ? 'border-green-500 text-green-700' :
                            project.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-700' :
                            'border-red-500 text-red-700'
                          }>
                            {project.difficulty}
                          </Badge>
                          <span className="text-sm text-gray-500">{project.duration}</span>
                        </div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Target Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {project.targetSkills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">AI Team</h4>
                            <div className="text-xs text-gray-600">
                              <div>Manager: {project.aiPersonas.manager.name}</div>
                              <div>{project.aiPersonas.colleagues.length} colleagues</div>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleStartProject(project)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Project
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Milestones */}
                <Card className="bg-white border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Map className="w-5 h-5 mr-2" />
                      Development Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentRoadmap.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">W{milestone.week}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Skills: {milestone.expectedSkills.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Assessment: {milestone.assessmentType}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="text-center py-12 bg-white border">
                <CardContent>
                  <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Roadmap Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Let your AI coach create a personalized development roadmap for you
                  </p>
                  <Button 
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating Roadmap...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate My Roadmap
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Projects Completed:</span>
                    <span className="font-semibold">{userProgress?.completedProjects || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skills Developed:</span>
                    <span className="font-semibold">{userProgress?.skillsImproved?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversations:</span>
                    <span className="font-semibold">{messages.filter(m => m.sender === 'user').length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(userData?.currentSkills || ['Communication', 'Teamwork']).slice(0, 4).map((skill: string) => (
                      <div key={skill} className="flex items-center justify-between">
                        <span className="text-sm">{skill}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Growth Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                    Growth Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(userData?.improvementAreas || ['Leadership', 'Public Speaking']).slice(0, 4).map((area: string) => (
                      <div key={area} className="flex items-center justify-between">
                        <span className="text-sm">{area}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-orange-500 rounded-full" style={{ width: `${Math.random() * 40 + 30}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity & AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.slice(-3).reverse().map((message) => (
                    <div key={message.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {message.sender === 'coach' ? 'AI Coach Analysis' : 'Your Question'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {message.content.slice(0, 150)}...
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachPage;
