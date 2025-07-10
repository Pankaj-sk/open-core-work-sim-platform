// 📄 PAGE: RoadmapPage.tsx - Detailed Roadmap View (No Project Access)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  Brain, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  Star,
  ArrowRight,
  Trophy,
  BookOpen,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import DataManager from '../utils/dataManager';

interface Project {
  id: string;
  title: string;
  description: string;
  targetSkills: string[];
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  teamMembers: {
    name: string;
    role: string;
    personality: string;
    workingStyle: string;
  }[];
  objectives: string[];
  challenges: string[];
  expectedOutcomes: string[];
  status: 'upcoming' | 'current' | 'completed';
  completionPercentage?: number;
}

const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = DataManager.getRoadmapData();
    if (data) {
      setRoadmapData(data);
    } else {
      // Generate default roadmap if none exists
      generateDefaultRoadmap();
    }
    setLoading(false);
  }, []);

  const generateDefaultRoadmap = () => {
    const userData = DataManager.getUserData();
    const defaultRoadmap = {
      userAnalysis: {
        strengths: userData?.currentSkills || ['Communication', 'Problem Solving'],
        areasForImprovement: userData?.improvementAreas || ['Technical Leadership', 'Project Management'],
        careerGoals: userData?.careerGoals || ['Senior Developer'],
        currentLevel: userData?.experienceLevel || 'Intermediate'
      },
      timeline: {
        totalDuration: '6 months',
        estimatedCompletion: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      projects: [
        {
          id: 'project-1',
          title: 'E-commerce Platform Development',
          description: 'Build a full-stack e-commerce solution with modern technologies',
          targetSkills: ['React', 'Node.js', 'Database Design', 'API Development'],
          duration: '8 weeks',
          difficulty: 'Intermediate',
          teamMembers: [
            { name: 'Sarah Chen', role: 'Senior Developer', personality: 'Methodical and thorough', workingStyle: 'Detail-oriented' },
            { name: 'Mike Rodriguez', role: 'Product Manager', personality: 'Strategic and communicative', workingStyle: 'Big-picture focused' },
            { name: 'Alex Kim', role: 'Designer', personality: 'Creative and user-focused', workingStyle: 'Iterative design' }
          ],
          objectives: [
            'Implement user authentication and authorization',
            'Design and build product catalog system',
            'Create shopping cart and checkout flow',
            'Integrate payment processing'
          ],
          challenges: [
            'Handle high-traffic scenarios',
            'Ensure data security and privacy',
            'Optimize for mobile responsiveness'
          ],
          expectedOutcomes: [
            'Full-stack development skills',
            'Experience with payment systems',
            'Understanding of e-commerce architecture'
          ],
          status: 'current',
          completionPercentage: 25
        },
        {
          id: 'project-2',
          title: 'Analytics Dashboard',
          description: 'Create a comprehensive analytics dashboard with real-time data visualization',
          targetSkills: ['Data Visualization', 'React', 'D3.js', 'API Integration'],
          duration: '6 weeks',
          difficulty: 'Advanced',
          teamMembers: [
            { name: 'Emma Thompson', role: 'Data Scientist', personality: 'Analytical and precise', workingStyle: 'Data-driven' },
            { name: 'James Wilson', role: 'Frontend Architect', personality: 'Innovative and efficient', workingStyle: 'Performance-focused' }
          ],
          objectives: [
            'Build interactive charts and graphs',
            'Implement real-time data updates',
            'Create customizable dashboard layouts',
            'Add export and sharing capabilities'
          ],
          challenges: [
            'Handle large datasets efficiently',
            'Ensure smooth real-time updates',
            'Make complex data understandable'
          ],
          expectedOutcomes: [
            'Advanced React and D3.js skills',
            'Data visualization expertise',
            'Performance optimization experience'
          ],
          status: 'upcoming',
          completionPercentage: 0
        },
        {
          id: 'project-3',
          title: 'Mobile App Development',
          description: 'Develop a cross-platform mobile application using React Native',
          targetSkills: ['React Native', 'Mobile UI/UX', 'API Integration', 'App Store Deployment'],
          duration: '10 weeks',
          difficulty: 'Advanced',
          teamMembers: [
            { name: 'Lily Chang', role: 'Mobile Developer', personality: 'Detail-oriented and patient', workingStyle: 'User-experience focused' },
            { name: 'David Kumar', role: 'DevOps Engineer', personality: 'Systematic and reliable', workingStyle: 'Process-oriented' }
          ],
          objectives: [
            'Create native-feeling mobile interfaces',
            'Implement offline functionality',
            'Add push notifications',
            'Deploy to app stores'
          ],
          challenges: [
            'Ensure cross-platform compatibility',
            'Optimize for different screen sizes',
            'Handle app store approval process'
          ],
          expectedOutcomes: [
            'Mobile development expertise',
            'Cross-platform development skills',
            'App deployment experience'
          ],
          status: 'upcoming',
          completionPercentage: 0
        }
      ]
    };
    setRoadmapData(defaultRoadmap);
    DataManager.saveRoadmapData(defaultRoadmap);
  };

  const openCoachChat = () => {
    navigate('/coach');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      case 'upcoming': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (!roadmapData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Roadmap Available</h3>
            <p className="text-gray-600 mb-6">Complete your onboarding to generate your personalized learning roadmap.</p>
            <Button onClick={() => navigate('/onboarding')}>
              Complete Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallProgress = roadmapData.projects.reduce((acc: number, project: Project) => {
    return acc + (project.completionPercentage || 0);
  }, 0) / roadmapData.projects.length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Map className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">Your Learning Roadmap</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A personalized journey designed to help you achieve your career goals through hands-on projects and skill development.
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button variant="outline" onClick={openCoachChat}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Coach
          </Button>
          <Button variant="outline" onClick={goToDashboard}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Journey Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{roadmapData.projects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{roadmapData.timeline.totalDuration}</div>
              <div className="text-sm text-gray-600">Estimated Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {roadmapData.projects.reduce((total: number, proj: Project) => total + proj.teamMembers.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-8">
              {roadmapData.projects.map((project: Project, index: number) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  {/* Timeline dot */}
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)} border-4 border-white shadow-sm z-10`}></div>
                  
                  {/* Project card */}
                  <Card className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription className="mt-1">{project.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getDifficultyColor(project.difficulty)}>
                            {project.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {project.duration}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress bar for current/completed projects */}
                      {project.status !== 'upcoming' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.completionPercentage || 0}%</span>
                          </div>
                          <Progress value={project.completionPercentage || 0} className="h-2" />
                        </div>
                      )}

                      {/* Skills */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Skills You'll Develop:</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.targetSkills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Team members */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Your Team:</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.teamMembers.slice(0, 3).map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {member.name[0]}
                              </div>
                              <span className="text-sm text-gray-700">{member.name}</span>
                              <span className="text-xs text-gray-500">({member.role})</span>
                            </div>
                          ))}
                          {project.teamMembers.length > 3 && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1 text-sm text-gray-600">
                              +{project.teamMembers.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Objectives */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Key Objectives:</h4>
                        <div className="space-y-1">
                          {project.objectives.slice(0, 3).map((objective, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <Target className="w-3 h-3 text-blue-500" />
                              <span>{objective}</span>
                            </div>
                          ))}
                          {project.objectives.length > 3 && (
                            <div className="text-xs text-gray-500 ml-5">
                              +{project.objectives.length - 3} more objectives
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expected outcomes */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">What You'll Gain:</h4>
                        <div className="space-y-1">
                          {project.expectedOutcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <Trophy className="w-3 h-3 text-yellow-500" />
                              <span>{outcome}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Building on Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roadmapData.userAnalysis.strengths.map((strength: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Star className="w-4 h-4 text-green-600" />
                  <span className="text-gray-800">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500" />
              Areas for Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roadmapData.userAnalysis.areasForImprovement.map((area: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-800">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Your Career Destination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 bg-blue-50 rounded-full px-6 py-3">
              <Trophy className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-medium text-blue-800">
                {roadmapData.userAnalysis.careerGoals.join(', ')}
              </span>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Every project in your roadmap is strategically designed to build the skills and experience needed to achieve your career goals.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="text-center">
        <div className="flex gap-4 justify-center">
          <Button onClick={goToDashboard} size="lg">
            <ArrowRight className="w-5 h-5 mr-2" />
            Start Your Journey
          </Button>
          <Button variant="outline" onClick={openCoachChat} size="lg">
            <MessageCircle className="w-5 h-5 mr-2" />
            Discuss with Coach
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
