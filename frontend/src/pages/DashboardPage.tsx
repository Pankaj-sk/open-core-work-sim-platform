// 📄 PAGE: DashboardPage.tsx - Enhanced dashboard with projects and analytics
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Target, MessageSquare, Award, TrendingUp, Play, Users, CheckCircle, BarChart3, Calendar, Clock, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DataManager from '../utils/dataManager';

interface UserProgress {
  completedProjects: number;
  currentProject: string | null;
  skillsImproved: string[];
  nextGoal: string;
  coachFeedback: string;
}

interface ProjectRoadmap {
  id: string;
  title: string;
  description: string;
  goals: string[];
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Available' | 'In Progress' | 'Completed';
  aiTeamMembers: {
    manager: string;
    teammates: string[];
  };
  completedAt?: string;
  progress: number;
}

interface AnalyticsSnapshot {
  weeklyProgress: number;
  skillsImproved: number;
  conversationsCompleted: number;
  avgSessionTime: string;
  lastAnalysis: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [projects, setProjects] = useState<ProjectRoadmap[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = DataManager.hasCompletedOnboarding();
    if (!onboardingComplete) {
      navigate('/onboarding');
      return;
    }
    setHasCompletedOnboarding(true);
    // Load user progress
    const progress = DataManager.getUserProgress();
    setUserProgress(progress);
    // Load projects from roadmap data (no hardcoded projects)
    const roadmap = DataManager.getRoadmapData();
    setProjects(roadmap?.projects || []);
    // Load analytics from progress (no random or hardcoded analytics)
    setAnalytics({
      weeklyProgress: progress?.completedProjects ? Math.min(100, progress.completedProjects * 20) : 0,
      skillsImproved: progress?.skillsImproved?.length || 0,
      conversationsCompleted: progress?.conversationsCompleted || 0,
      avgSessionTime: '-',
      lastAnalysis: progress?.lastActiveDate ? new Date(progress.lastActiveDate).toLocaleDateString() : '-'
    });
  }, [navigate]);

  const startProject = (projectId: string) => {
    // Set current project and navigate to coach introduction
    localStorage.setItem('currentProjectId', projectId);
    localStorage.setItem('projectStartMode', 'coach-intro');
    navigate(`/coach?project=${projectId}`);
  };

  const viewAnalytics = () => {
    navigate('/analytics');
  };

  if (!hasCompletedOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Target className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Learning Dashboard 📊
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore AI-designed projects and track your professional growth
          </p>
        </motion.div>

        {/* Quick Stats */}
        {userProgress && analytics ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-4 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Projects Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userProgress.completedProjects ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.weeklyProgress ?? 0}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Skills Improved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analytics.skillsImproved ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={viewAnalytics}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Detailed Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-blue-600 font-medium">View Full Report →</div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="text-center text-gray-500 mb-8">No analytics data available yet.</div>
        )}

        {/* AI Coach Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="mr-3 h-6 w-6 text-blue-600" />
                AI Coach Designed Projects
              </h2>
              <p className="text-gray-600 mt-1">Personalized challenges based on your goals and progress</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {(Array.isArray(projects) && projects.length > 0) ? projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">{project.description}</CardDescription>
                      </div>
                      <Badge 
                        variant={project.difficulty === 'Beginner' ? 'secondary' : 
                                project.difficulty === 'Intermediate' ? 'default' : 'destructive'}
                      >
                        {project.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Learning Goals:</h4>
                      <ul className="space-y-1">
                        {(Array.isArray(project.goals) ? project.goals.slice(0, 2) : []).map((goal, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="mr-2 h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {goal}
                          </li>
                        ))}
                        {Array.isArray(project.goals) && project.goals.length > 2 && (
                          <li className="text-sm text-gray-500">+{project.goals.length - 2} more goals</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {project.estimatedDuration || '-'}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {(project.aiTeamMembers && Array.isArray(project.aiTeamMembers.teammates)) ? (project.aiTeamMembers.teammates.length + 1) : 1} AI personas
                      </div>
                    </div>

                    <Button 
                      onClick={() => startProject(project.id)} 
                      className="w-full"
                      disabled={project.status === 'In Progress'}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {project.status === 'Available' ? 'Start Project' : 
                       project.status === 'In Progress' ? 'Continue Project' : 'Review Project'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="col-span-full text-center text-gray-500">No projects available yet. Complete onboarding or generate a roadmap to get started.</div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/coach')}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="mr-3 h-5 w-5 text-blue-600" />
                Chat with Coach
              </CardTitle>
              <CardDescription>Get personalized guidance and feedback</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/roadmap')}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="mr-3 h-5 w-5 text-green-600" />
                View Roadmap
              </CardTitle>
              <CardDescription>See your detailed career development plan</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={viewAnalytics}>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="mr-3 h-5 w-5 text-purple-600" />
                Performance Analytics
              </CardTitle>
              <CardDescription>Deep insights into your progress and growth</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
