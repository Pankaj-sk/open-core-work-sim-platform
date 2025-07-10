// 📄 PAGE: RoadmapGenerationPage.tsx - AI Roadmap Generation & Analysis
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2,
  Play,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import DataManager from '../utils/dataManager';

interface GeneratedProject {
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

interface RoadmapData {
  userAnalysis: {
    strengths: string[];
    areasForImprovement: string[];
    careerGoals: string[];
    preferredLearningStyle: string;
    communicationStyle: string;
  };
  projects: GeneratedProject[];
  timeline: {
    totalDuration: string;
    milestones: string[];
  };
}

const API_URL = process.env.REACT_APP_API_URL;

const RoadmapGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'analyzing' | 'generating' | 'complete'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [showCoachDialog, setShowCoachDialog] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [coachResponse, setCoachResponse] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    generateRoadmap();
  }, []);

  const generateRoadmap = async () => {
    setApiError(null);
    // Simulate AI analysis and roadmap generation
    const steps = [
      { step: 'analyzing', duration: 2000, progress: 33 },
      { step: 'generating', duration: 3000, progress: 66 },
      { step: 'complete', duration: 1000, progress: 100 }
    ];
    for (const { step: currentStep, duration, progress } of steps) {
      setStep(currentStep as any);
      setProgress(progress);
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    // Generate personalized roadmap based on user data
    const userData = DataManager.getUserData();
    try {
      const generatedRoadmap = await createPersonalizedRoadmap(userData);
      setRoadmapData(generatedRoadmap);
      DataManager.saveRoadmapData(generatedRoadmap);
      setShowCoachDialog(true);
    } catch (err: any) {
      setApiError(err.message || 'Failed to generate roadmap.');
      setRoadmapData(null);
    }
  };

  const createPersonalizedRoadmap = async (userData: any): Promise<RoadmapData> => {
    // Fetch roadmap from backend API
    const response = await fetch(`${API_URL}/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userData })
    });
    if (!response.ok) throw new Error('Failed to generate roadmap from API.');
    return await response.json();
  };

  const handleCoachQuestion = async () => {
    if (!userQuestion.trim()) return;
    setCoachResponse('');
    try {
      const response = await fetch(`${API_URL}/coach/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          roadmap: roadmapData,
          user: DataManager.getUserData()
        })
      });
      if (!response.ok) throw new Error('Failed to get coach response');
      const data = await response.json();
      setCoachResponse(data.answer || '');
    } catch (err) {
      setCoachResponse('Sorry, there was a problem getting a response from your coach.');
    }
    setUserQuestion('');
  };

  const proceedToRoadmap = () => {
    // Save roadmap data and navigate to roadmap overview
    DataManager.saveRoadmapData(roadmapData);
    // Only set roadmapConfirmed when user clicks confirm (not before)
    navigate('/roadmap-overview');
  };

  // Add a new handler for confirming roadmap
  const handleConfirmRoadmap = () => {
    localStorage.setItem('roadmapConfirmed', 'true');
    navigate('/dashboard');
  };

  const renderAnalysisStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <Brain className="w-full h-full text-blue-500" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 w-16 h-16 mx-auto border-2 border-blue-200 rounded-full"
        />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Analyzing Your Profile</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        I'm carefully reviewing your responses, goals, and preferences to create the perfect learning path for you.
      </p>
    </motion.div>
  );

  const renderGeneratingStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="relative">
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <Sparkles className="w-full h-full text-purple-500" />
        </motion.div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Creating Your Roadmap</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Designing personalized projects and selecting the perfect AI team members to help you achieve your goals.
      </p>
    </motion.div>
  );

  const renderCompleteStep = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5 }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <CheckCircle2 className="w-full h-full text-green-500" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-800">Roadmap Complete!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Your personalized learning journey is ready. I've created {roadmapData?.projects.length} tailored projects for you.
      </p>
    </motion.div>
  );

  const renderCoachDialog = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Your AI Coach</h3>
          <p className="text-sm text-gray-600">Ready to guide your journey</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-700">
            Excellent! I've analyzed your profile and created a comprehensive roadmap with <strong>{roadmapData?.projects.length} personalized projects</strong>. 
            Each project is designed to target your specific improvement areas while building on your existing strengths.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Your Roadmap Overview:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• <strong>Duration:</strong> {roadmapData?.timeline.totalDuration}</li>
            <li>• <strong>Focus Areas:</strong> {roadmapData?.userAnalysis.areasForImprovement.join(', ')}</li>
            <li>• <strong>Team Members:</strong> {roadmapData?.projects.reduce((total, proj) => total + proj.teamMembers.length, 0)} AI colleagues</li>
          </ul>
        </div>

        {coachResponse && (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-gray-700">{coachResponse}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Any questions about your roadmap?"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleCoachQuestion()}
          />
          <Button onClick={handleCoachQuestion} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button onClick={handleConfirmRoadmap} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Confirm Roadmap & Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => setShowCoachDialog(false)}>
            Ask More Questions
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-2 md:px-8 lg:px-16 py-8">
        <div className="w-full max-w-6xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-full h-2 shadow-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {step === 'analyzing' && 'Analyzing your profile...'}
              {step === 'generating' && 'Creating your roadmap...'}
              {step === 'complete' && 'Generation complete!'}
            </p>
          </div>
          {/* API Error */}
          {apiError && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-8 text-center">
              <strong>API Error:</strong> {apiError}
            </div>
          )}
          {/* Main Content: Show roadmap after generation, not just summary */}
          {step === 'complete' && roadmapData ? (
            <>
              {/* Roadmap Overview */}
              <Card className="mb-8 w-full">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Your Personalized Roadmap</h2>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Timeline: <span className="text-blue-700">{roadmapData.timeline.totalDuration}</span></h3>
                    <ul className="flex flex-wrap gap-3">
                      {roadmapData.timeline.milestones.map((m, i) => (
                        <li key={i} className="bg-blue-50 px-3 py-1 rounded text-blue-800 text-sm">{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Focus Areas</h3>
                    <ul className="flex flex-wrap gap-3">
                      {roadmapData.userAnalysis.areasForImprovement.map((a, i) => (
                        <li key={i} className="bg-purple-50 px-3 py-1 rounded text-purple-800 text-sm">{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Projects</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {roadmapData.projects.map((project, idx) => (
                        <Card key={project.id} className="h-full">
                          <CardContent>
                            <div className="mb-2 text-sm text-gray-600">Duration: {project.duration} | Difficulty: {project.difficulty}</div>
                            <div className="mb-2 text-sm text-gray-600">Skills: {project.targetSkills.join(', ')}</div>
                            <div className="mb-2 text-sm text-gray-600">Objectives: {project.objectives.join(', ')}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Coach Dialog */}
              {renderCoachDialog()}
            </>
          ) : (
            <Card className="mb-8 w-full">
              <CardContent className="p-8">
                {step === 'analyzing' && renderAnalysisStep()}
                {step === 'generating' && renderGeneratingStep()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapGenerationPage;
