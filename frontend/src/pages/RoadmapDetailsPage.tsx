// 📄 PAGE: RoadmapDetailsPage.tsx - Detailed Roadmap Explanation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Target,
  Clock,
  Award,
  CheckCircle2,
  Star,
  Brain,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import DataManager from '../utils/dataManager';
import ProjectCard from '../components/ProjectCard';
import LoadingOrEmpty from '../components/LoadingOrEmpty';

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
}

const RoadmapDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  // Track completed projects
  const [completedProjects, setCompletedProjects] = useState<number>(0);

  useEffect(() => {
    const data = DataManager.getRoadmapData();
    if (data) {
      setRoadmapData(data);
      // Expand first project by default
      if (data.projects.length > 0) {
        setExpandedProjects([data.projects[0].id]);
      }
    }
    // Get completed projects count from localStorage or DataManager
    const progress = DataManager.getUserProgress();
    setCompletedProjects(progress?.completedProjects || 0);
  }, []);

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startProject = (projectId: string, index: number) => {
    // Only allow starting the next available project
    if (index > completedProjects) return;
    // Set current project in DataManager
    if (roadmapData && roadmapData.projects && roadmapData.projects[index]) {
      DataManager.setCurrentProject(roadmapData.projects[index]);
    }
    navigate('/project/' + projectId);
  };

  // Call this when a project is completed (e.g., from EnhancedProjectPage)
  const completeProject = (index: number) => {
    if (index === completedProjects) {
      DataManager.updateUserProgress({ completedProjects: completedProjects + 1 });
      setCompletedProjects(completedProjects + 1);
    }
  };

  if (!roadmapData || !roadmapData.userAnalysis || !roadmapData.timeline || !Array.isArray(roadmapData.projects)) {
    return (
      <LoadingOrEmpty loading={!roadmapData} empty emptyMessage="No roadmap data available. Please complete onboarding or generate a roadmap." />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* User Info Button */}
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => navigate('/user-profile')}>
              View My Profile
            </Button>
          </div>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Detailed Roadmap</h1>
              <p className="text-gray-600">Complete breakdown of your learning journey</p>
            </div>
          </div>

          {/* Roadmap Analysis */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                AI Coach Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Your Profile Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Current Strengths:</h4>
                      {(Array.isArray(roadmapData.userAnalysis.strengths) && roadmapData.userAnalysis.strengths.length > 0) ? roadmapData.userAnalysis.strengths.map((strength: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600">{strength}</span>
                        </div>
                      )) : <div className="text-gray-400">No strengths identified yet.</div>}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Development Areas:</h4>
                      {(Array.isArray(roadmapData.userAnalysis.areasForImprovement) && roadmapData.userAnalysis.areasForImprovement.length > 0) ? roadmapData.userAnalysis.areasForImprovement.map((area: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600">{area}</span>
                        </div>
                      )) : <div className="text-gray-400">No development areas identified yet.</div>}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Learning Approach</h4>
                  <p className="text-blue-700">
                    Based on your profile, I've designed a <strong>{roadmapData.userAnalysis.preferredLearningStyle || '-'}</strong> approach 
                    that matches your <strong>{roadmapData.userAnalysis.communicationStyle || '-'}</strong> communication style. 
                    Each project progressively builds on your strengths while addressing improvement areas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Learning Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-purple-600">{roadmapData.timeline.totalDuration || '-'}</div>
                  <div className="text-gray-600">Total estimated duration</div>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(roadmapData.timeline.milestones) && roadmapData.timeline.milestones.length > 0) ? roadmapData.timeline.milestones.map((milestone: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-200" />
                      <span className="text-gray-700">{milestone}</span>
                    </div>
                  )) : <div className="text-gray-400">No milestones available.</div>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Projects */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Breakdown</h2>
            <LoadingOrEmpty
              loading={!roadmapData.projects}
              empty={roadmapData.projects.length === 0}
              emptyMessage="No projects in your roadmap yet."
            >
              {roadmapData.projects.map((project: Project, index: number) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  expanded={expandedProjects.includes(project.id)}
                  onToggle={toggleProjectExpansion}
                  completedProjects={completedProjects}
                  onStart={startProject}
                />
              ))}
            </LoadingOrEmpty>
          </div>
          {/* Bottom Actions */}
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => navigate('/roadmap-overview')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
            <Button variant="outline" onClick={() => navigate('/coach-chat')}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Coach Questions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailsPage;
