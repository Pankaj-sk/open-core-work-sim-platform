// 📄 PAGE: DashboardPage.tsx - Main dashboard for career development MVP
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Target, MessageSquare, Award, TrendingUp, Play, Users, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface UserProgress {
  completedProjects: number;
  currentProject: string | null;
  skillsImproved: string[];
  nextGoal: string;
  coachFeedback: string;
}

interface ProjectRoadmap {
  title: string;
  description: string;
  goals: string[];
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  aiTeamMembers: {
    manager: string;
    teammate: string;
  };
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('hasCompletedOnboarding');
    const skillData = localStorage.getItem('userSkillData');
    
    if (!onboardingComplete && !skillData) {
      navigate('/onboarding');
      return;
    }
    
    setHasCompletedOnboarding(true);
    
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem('userProgress');
    const skillDataParsed = JSON.parse(localStorage.getItem('userSkillData') || '{}');
    
    const dynamicProgress: UserProgress = {
      completedProjects: parseInt(localStorage.getItem('completedProjectsCount') || '0'),
      currentProject: localStorage.getItem('currentProjectId') || null,
      skillsImproved: savedProgress ? JSON.parse(savedProgress).skillsImproved || [] : [],
      nextGoal: Array.isArray(skillDataParsed.careerGoals) && skillDataParsed.careerGoals.length > 0 
        ? skillDataParsed.careerGoals[0] 
        : Array.isArray(skillDataParsed.improvementAreas) && skillDataParsed.improvementAreas.length > 0
          ? skillDataParsed.improvementAreas[0]
          : 'build workplace communication skills',
      coachFeedback: 'Welcome back! Your AI coach has prepared personalized challenges based on your goals.'
    };
    
    // Generate project roadmap based on user's actual data and progress
    const projectCount = dynamicProgress.completedProjects;
    const difficultyLevel = projectCount === 0 ? 'Beginner' : projectCount < 3 ? 'Intermediate' : 'Advanced';
    
    const dynamicRoadmap: ProjectRoadmap = {
      title: `${difficultyLevel} Project Challenge`,
      description: `A carefully designed ${difficultyLevel.toLowerCase()}-level project to help you practice ${
        Array.isArray(skillDataParsed.careerGoals) && skillDataParsed.careerGoals.length > 0 
          ? skillDataParsed.careerGoals.slice(0, 2).join(' and ')
          : 'essential workplace skills'
      }.`,
      goals: [
        'Practice professional communication and collaboration',
        'Build confidence in team interactions',
        'Develop problem-solving skills in a work environment'
      ],
      estimatedDuration: projectCount === 0 ? '1-2 weeks' : projectCount < 3 ? '2-3 weeks' : '3-4 weeks',
      difficulty: difficultyLevel,
      aiTeamMembers: {
        manager: 'AI Project Manager - Experienced leader focused on guidance and mentorship',
        teammate: 'AI Team Member - Collaborative partner ready to work with you'
      }
    };
    
    setUserProgress(dynamicProgress);
    setRoadmap(dynamicRoadmap);
  }, [navigate]);

  const startProject = () => {
    // Store current project context in localStorage for ProjectPage to access
    if (roadmap && userProgress) {
      const projectContext = {
        title: roadmap.title,
        description: roadmap.description,
        difficulty: roadmap.difficulty,
        goals: roadmap.goals,
        teamMembers: roadmap.aiTeamMembers,
        userProgress: userProgress,
        startedAt: new Date().toISOString()
      };
      localStorage.setItem('currentProjectContext', JSON.stringify(projectContext));
      localStorage.setItem('currentProjectId', 'demo-project-1');
    }
    // Navigate to the project page with the demo project ID
    navigate('/project/demo-project-1');
  };

  const viewDebrief = () => {
    navigate('/debrief');
  };

  if (!hasCompletedOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Brain className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, Professional! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI coach has prepared your next career development challenge
          </p>
        </motion.div>

        {/* Progress Overview */}
        {userProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center">
                  <Award className="mr-2 h-5 w-5 text-yellow-600" />
                  Projects Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {userProgress.completedProjects}
                </div>
                <p className="text-gray-600">Career development projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                  Skills Improved
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {userProgress.skillsImproved.length}
                </div>
                <p className="text-gray-600">Professional competencies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center">
                  <Target className="mr-2 h-5 w-5 text-blue-600" />
                  Current Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm font-medium text-blue-600 mb-2">
                  {userProgress.nextGoal}
                </div>
                <p className="text-gray-600">Next development goal</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Coach Message */}
        {userProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-3 h-6 w-6 text-blue-600" />
                  Message from Your AI Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-gray-800 italic mb-4">"{userProgress.coachFeedback}"</p>
                  <p className="text-gray-700">
                    I've designed your next project specifically to help you {userProgress.nextGoal.toLowerCase()}. 
                    Are you ready to take on this new challenge?
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Project Roadmap */}
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="mr-3 h-6 w-6 text-blue-600" />
                    Your Next Project
                  </div>
                  <Badge variant={roadmap.difficulty === 'Beginner' ? 'secondary' : roadmap.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                    {roadmap.difficulty}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Estimated duration: {roadmap.estimatedDuration}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{roadmap.title}</h3>
                  <p className="text-gray-700">{roadmap.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Learning Goals:</h4>
                  <ul className="space-y-2">
                    {roadmap.goals.map((goal, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Your AI Team Members:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users className="mr-2 h-4 w-4 text-blue-600" />
                        <span className="font-medium">Project Manager</span>
                      </div>
                      <p className="text-sm text-gray-700">{roadmap.aiTeamMembers.manager}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users className="mr-2 h-4 w-4 text-green-600" />
                        <span className="font-medium">Teammate</span>
                      </div>
                      <p className="text-sm text-gray-700">{roadmap.aiTeamMembers.teammate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button onClick={startProject} size="lg" className="flex items-center">
                    <Play className="mr-2 h-5 w-5" />
                    Start Project
                  </Button>
                  {userProgress && userProgress.completedProjects > 0 && (
                    <Button onClick={viewDebrief} variant="outline" size="lg" className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      View Last Debrief
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Skills Progress */}
        {userProgress && userProgress.skillsImproved.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-3 h-6 w-6 text-green-600" />
                  Skills You've Improved
                </CardTitle>
                <CardDescription>
                  Track your professional development journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userProgress.skillsImproved.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
