// 📄 PAGE: StreamlinedOnboardingPage.tsx - One-time comprehensive onboarding
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Brain, 
  Target, 
  CheckCircle2, 
  User,
  Briefcase,
  TrendingUp,
  Clock,
  BookOpen,
  Users,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import DataManager, { UserSkillData } from '../utils/dataManager';

interface OnboardingData {
  // Personal Info
  name: string;
  email: string;
  currentRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior';
  
  // Skills & Goals
  currentSkills: string[];
  careerGoals: string[];
  improvementAreas: string[];
  
  // Work Context
  workplaceChallenges: string[];
  communicationConcerns: string[];
  teamSize: string;
  workEnvironment: string;
  
  // Learning Preferences
  preferredLearningStyle: string;
  availableTimePerWeek: string;
  preferredProjectTypes: string[];
  
  // Motivation
  primaryMotivation: string;
  successMetrics: string[];
}

const StreamlinedOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    currentRole: '',
    experienceLevel: 'mid',
    currentSkills: [],
    careerGoals: [],
    improvementAreas: [],
    workplaceChallenges: [],
    communicationConcerns: [],
    teamSize: '',
    workEnvironment: '',
    preferredLearningStyle: '',
    availableTimePerWeek: '',
    preferredProjectTypes: [],
    primaryMotivation: '',
    successMetrics: []
  });

  useEffect(() => {
    // Check if user has already completed onboarding
    const onboardingComplete = localStorage.getItem('hasCompletedOnboarding');
    if (onboardingComplete === 'true') {
      navigate('/workspace');
    }
  }, [navigate]);

  const totalSteps = 6;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(item)
        ? (prev[field] as string[]).filter(i => i !== item)
        : [...(prev[field] as string[]), item]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    // Convert onboarding data to UserSkillData format
    const userSkillData: UserSkillData = {
      ...data,
      completedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Complete onboarding using DataManager
    DataManager.completeOnboarding(userSkillData);
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
    
    // Redirect to workspace
    navigate('/workspace');
  };

  const skillOptions = [
    'Communication', 'Leadership', 'Project Management', 'Problem Solving',
    'Team Collaboration', 'Technical Skills', 'Creative Thinking', 'Data Analysis',
    'Presentation Skills', 'Time Management', 'Conflict Resolution', 'Strategic Planning'
  ];

  const careerGoalOptions = [
    'Get promoted to senior role', 'Become a team leader', 'Improve technical skills',
    'Better work-life balance', 'Change career direction', 'Start own business',
    'Become subject matter expert', 'Develop management skills', 'Increase salary',
    'Work internationally', 'Build professional network', 'Gain industry recognition'
  ];

  const improvementOptions = [
    'Public speaking', 'Giving feedback', 'Difficult conversations', 'Meeting facilitation',
    'Delegation', 'Decision making', 'Networking', 'Mentoring others',
    'Managing up', 'Cross-team collaboration', 'Handling pressure', 'Setting boundaries'
  ];

  const challengeOptions = [
    'Remote team coordination', 'Unclear project requirements', 'Tight deadlines',
    'Limited resources', 'Conflicting priorities', 'Communication gaps',
    'Lack of feedback', 'Team conflicts', 'Technical debt', 'Changing requirements',
    'Stakeholder management', 'Knowledge sharing'
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get to know you</h2>
              <p className="text-gray-600">Help us personalize your career development journey</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's your name?</label>
                <Input
                  placeholder="Enter your name"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  className="text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's your email?</label>
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={data.email}
                  onChange={(e) => updateData('email', e.target.value)}
                  className="text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's your current role?</label>
                <Input
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  value={data.currentRole}
                  onChange={(e) => updateData('currentRole', e.target.value)}
                  className="text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Experience level?</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['entry', 'mid', 'senior'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={data.experienceLevel === level ? 'default' : 'outline'}
                      onClick={() => updateData('experienceLevel', level)}
                      className="capitalize"
                    >
                      {level === 'entry' ? 'Entry Level' : level === 'mid' ? 'Mid Level' : 'Senior Level'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your career goals?</h2>
              <p className="text-gray-600">Select 2-3 goals that matter most to you</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {careerGoalOptions.map((goal) => (
                <Button
                  key={goal}
                  variant={data.careerGoals.includes(goal) ? 'default' : 'outline'}
                  onClick={() => toggleArrayItem('careerGoals', goal)}
                  className="h-auto py-3 text-left text-sm"
                >
                  {goal}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What skills do you want to improve?</h2>
              <p className="text-gray-600">Choose areas where you'd like to grow</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {improvementOptions.map((area) => (
                <Button
                  key={area}
                  variant={data.improvementAreas.includes(area) ? 'default' : 'outline'}
                  onClick={() => toggleArrayItem('improvementAreas', area)}
                  className="h-auto py-3 text-left text-sm"
                >
                  {area}
                </Button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What challenges do you face at work?</h2>
              <p className="text-gray-600">Select the situations you'd like to practice</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {challengeOptions.map((challenge) => (
                <Button
                  key={challenge}
                  variant={data.workplaceChallenges.includes(challenge) ? 'default' : 'outline'}
                  onClick={() => toggleArrayItem('workplaceChallenges', challenge)}
                  className="h-auto py-3 text-left text-sm"
                >
                  {challenge}
                </Button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication areas you'd like to improve</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Public speaking', 'Team meetings', 'Client presentations', 'Difficult conversations', 'Email communication', 'Cross-team collaboration'].map((concern) => (
                  <Button
                    key={concern}
                    variant={data.communicationConcerns.includes(concern) ? 'default' : 'outline'}
                    onClick={() => toggleArrayItem('communicationConcerns', concern)}
                    className="h-auto py-3 text-left text-sm"
                  >
                    {concern}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How do you prefer to learn?</h2>
              <p className="text-gray-600">This helps us customize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Learning style</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Hands-on practice', 'Step-by-step guidance', 'Learn by doing', 'Structured lessons'].map((style) => (
                    <Button
                      key={style}
                      variant={data.preferredLearningStyle === style ? 'default' : 'outline'}
                      onClick={() => updateData('preferredLearningStyle', style)}
                      className="h-auto py-3 text-sm"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Time you can dedicate per week</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1-2 hours', '3-5 hours', '6-10 hours', '10+ hours'].map((time) => (
                    <Button
                      key={time}
                      variant={data.availableTimePerWeek === time ? 'default' : 'outline'}
                      onClick={() => updateData('availableTimePerWeek', time)}
                      className="text-sm"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Types of projects you'd like to practice</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Team leadership', 'Client management', 'Cross-functional collaboration', 'Crisis management', 'Process improvement', 'Presentation skills'].map((projectType) => (
                    <Button
                      key={projectType}
                      variant={data.preferredProjectTypes.includes(projectType) ? 'default' : 'outline'}
                      onClick={() => toggleArrayItem('preferredProjectTypes', projectType)}
                      className="h-auto py-3 text-left text-sm"
                    >
                      {projectType}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfect! You're all set</h2>
              <p className="text-gray-600">Your AI coach is ready to create your personalized journey</p>
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Profile: {data.name} - {data.currentRole}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Goals: {data.careerGoals.length} selected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Focus areas: {data.improvementAreas.length} selected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Learning style: {data.preferredLearningStyle}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Your AI Coach is ready!</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Based on your answers, I'll create personalized projects and provide ongoing guidance 
                    tailored specifically to your goals and learning style.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim() && data.currentRole.trim();
      case 2:
        return data.careerGoals.length >= 1;
      case 3:
        return data.improvementAreas.length >= 1;
      case 4:
        return data.workplaceChallenges.length >= 1;
      case 5:
        return data.preferredLearningStyle && data.availableTimePerWeek;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            {currentStep === totalSteps ? 'Launch Workspace' : 'Next'}
            {currentStep !== totalSteps && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedOnboardingPage;
