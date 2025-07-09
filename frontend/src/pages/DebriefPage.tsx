// 📄 PAGE: DebriefPage.tsx - AI Coach debrief and growth insights
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, CheckCircle, ArrowRight, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface DebriefData {
  projectTitle: string;
  completionDate: string;
  totalConversations: number;
  strengthsShown: string[];
  improvementAreas: string[];
  specificFeedback: string;
  nextSteps: string[];
  skillsImproved: string[];
  overallRating: number;
}

const DebriefPage: React.FC = () => {
  const navigate = useNavigate();
  const [debriefData, setDebriefData] = useState<DebriefData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate AI analysis of project work
    const analyzeProject = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock debrief data (in real app, this would come from AI analysis)
      const mockDebrief: DebriefData = {
        projectTitle: "E-commerce Website Redesign",
        completionDate: new Date().toLocaleDateString(),
        totalConversations: 23,
        strengthsShown: [
          "Clear communication of technical concepts",
          "Proactive problem-solving approach",
          "Good collaboration with team members",
          "Effective time management",
          "Constructive feedback to teammates"
        ],
        improvementAreas: [
          "Speaking up more confidently in group discussions",
          "Providing more detailed project updates",
          "Asking clarifying questions when requirements are unclear"
        ],
        specificFeedback: "You demonstrated excellent technical communication skills and showed real growth in team collaboration. Your ability to explain complex concepts clearly was particularly impressive. Focus on building confidence in group settings and don't hesitate to ask questions when something isn't clear.",
        nextSteps: [
          "Practice presenting technical solutions to larger groups",
          "Work on asking more strategic questions during planning sessions",
          "Continue developing your natural mentoring abilities",
          "Take on a leadership role in the next project"
        ],
        skillsImproved: [
          "Technical Communication",
          "Team Collaboration", 
          "Problem Solving",
          "Time Management"
        ],
        overallRating: 8.5
      };
      
      setDebriefData(mockDebrief);
      setIsAnalyzing(false);
    };

    analyzeProject();
  }, []);

  const startNewProject = () => {
    // In real app, this would create a new project
    navigate('/project');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Brain className="h-10 w-10 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Performance</h2>
          <p className="text-gray-600 mb-6">Your AI coach is reviewing all your conversations and work...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!debriefData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Award className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Project Complete! 🎉</h1>
          <p className="text-xl text-gray-600">Your AI coach has analyzed your performance and created this detailed debrief</p>
        </motion.div>

        {/* Project Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-3 h-5 w-5 text-blue-600" />
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Project: {debriefData.projectTitle}</h3>
                  <p className="text-gray-600">Completed on {debriefData.completionDate}</p>
                  <p className="text-gray-600">{debriefData.totalConversations} conversations with AI team members</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{debriefData.overallRating}/10</div>
                  <p className="text-gray-600">Overall Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Improved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-3 h-5 w-5 text-blue-600" />
                Skills You Improved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {debriefData.skillsImproved.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Strengths and Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-8 mb-8"
        >
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">What You Did Well ✨</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {debriefData.strengthsShown.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Areas to Focus On 🎯</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {debriefData.improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <Target className="mr-2 h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Coach Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-3 h-5 w-5 text-blue-600" />
                Your AI Coach's Detailed Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-800 leading-relaxed italic">"{debriefData.specificFeedback}"</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-3 h-5 w-5 text-blue-600" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {debriefData.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="mr-2 h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={startNewProject} size="lg" className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Start New Project
          </Button>
          <Button onClick={goToDashboard} variant="outline" size="lg" className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            View Progress Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default DebriefPage;
