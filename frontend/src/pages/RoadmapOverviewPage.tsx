// 📄 PAGE: RoadmapOverviewPage.tsx - Comprehensive Roadmap Display
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  Brain, 
  Play, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  Star,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
}

const RoadmapOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState<any>(null);

  useEffect(() => {
    const data = DataManager.getRoadmapData();
    if (data) {
      setRoadmapData(data);
    }
  }, []);

  const startFirstProject = () => {
    if (roadmapData?.projects?.[0]) {
      DataManager.setCurrentProject(roadmapData.projects[0]);
      navigate('/project/' + roadmapData.projects[0].id);
    }
  };

  const viewDetailedRoadmap = () => {
    navigate('/roadmap-details');
  };

  const openCoachChat = () => {
    navigate('/coach-chat');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!roadmapData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Learning Roadmap</h1>
              <p className="text-gray-600">Personalized projects designed for your growth</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={openCoachChat}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Coach
              </Button>
              <Button variant="outline" onClick={viewDetailedRoadmap}>
                <Map className="w-4 h-4 mr-2" />
                Detailed Roadmap
              </Button>
            </div>
          </div>

          {/* Roadmap Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Your Journey Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{roadmapData.projects.length}</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{roadmapData.timeline.totalDuration}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {roadmapData.projects.reduce((total: number, proj: Project) => total + proj.teamMembers.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{roadmapData.userAnalysis.areasForImprovement.length}</div>
                  <div className="text-sm text-gray-600">Focus Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {roadmapData.projects.map((project: Project, index: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">{project.description}</CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(project.difficulty)}>
                        {project.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{project.duration}</span>
                        <Users className="w-4 h-4 ml-4" />
                        <span>{project.teamMembers.length} team members</span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Target Skills:</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.targetSkills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Your Team:</h4>
                        <div className="space-y-1">
                          {project.teamMembers.slice(0, 2).map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="text-gray-700">{member.name}</span>
                              <span className="text-gray-500">({member.role})</span>
                            </div>
                          ))}
                          {project.teamMembers.length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{project.teamMembers.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index === 0 && (
                        <Button 
                          onClick={startFirstProject}
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start This Project
                        </Button>
                      )}
                      
                      {index > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Available after completing previous project</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Focus Areas */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Your Development Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Building on Your Strengths:</h4>
                  <div className="space-y-2">
                    {roadmapData.userAnalysis.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Areas for Growth:</h4>
                  <div className="space-y-2">
                    {roadmapData.userAnalysis.areasForImprovement.map((area: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-orange-500" />
                Ready to Begin?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">
                    Your first project <strong>"{roadmapData.projects[0]?.title}"</strong> is ready to start. 
                    You'll be working with {roadmapData.projects[0]?.teamMembers.length} AI team members 
                    in a realistic work environment.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={startFirstProject} size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      Start Your Journey
                    </Button>
                    <Button variant="outline" onClick={openCoachChat}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Talk to Coach
                    </Button>
                  </div>
                </div>
                <div className="sm:w-48">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Brain className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">
                      Your AI coach is always available to help and answer questions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoadmapOverviewPage;
