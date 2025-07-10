// 📄 PAGE: CoachPage.tsx - AI Coach Introduction & Roadmap Generation
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
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
  MessageCircle,
  Play,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DataManager from '../utils/dataManager';

const CoachPage: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const data = DataManager.getUserData();
    if (data) {
      setUserData(data);
    }
  }, []);

  const generateRoadmap = () => {
    navigate('/roadmap-generation');
  };

  const goToCoachChat = () => {
    navigate('/coach-chat');
  };

  const renderIntroduction = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
        >
          <Brain className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Meet Your AI Coach</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Hello! I'm your personal AI Career Coach. I've carefully reviewed everything you shared during onboarding.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            What I Know About You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Your Goals</h4>
                <div className="space-y-2">
                  {userData?.careerGoals?.map((goal: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Your Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {userData?.currentSkills?.slice(0, 4).map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Focus Areas</h4>
                <div className="space-y-2">
                  {userData?.improvementAreas?.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Learning Style</h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">{userData?.preferredLearningStyle}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">Your Coach Speaking</h3>
                <p className="text-blue-700 leading-relaxed">
                  Based on your profile, I understand you're looking to {userData?.careerGoals?.[0]?.toLowerCase() || 'advance your career'} 
                  and strengthen your skills in {userData?.improvementAreas?.slice(0, 2).join(' and ')?.toLowerCase() || 'key areas'}. 
                  I've designed a personalized learning path that will help you achieve these goals through realistic project experiences.
                </p>
                <p className="text-blue-700 leading-relaxed mt-3">
                  Your roadmap will include hands-on projects where you'll work with AI team members, practice real workplace scenarios, 
                  and develop the exact skills you need. Each project is carefully crafted to match your {userData?.preferredLearningStyle} learning style.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-gray-600 mb-6">
          Are you ready for me to create your personalized learning roadmap?
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={generateRoadmap} size="lg" className="min-w-[200px]">
            <Play className="w-4 h-4 mr-2" />
            Yes, Generate My Roadmap
          </Button>
          <Button variant="outline" onClick={goToCoachChat} size="lg">
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Questions First
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Main Content */}
          {renderIntroduction()}
        </div>
      </div>
    </div>
  );
};

export default CoachPage;
