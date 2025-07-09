import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  Target, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Users,
  Brain,
  Map,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import DataManager, { UserSkillData } from '../utils/dataManager';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SimWorld',
    description: 'Let\'s get to know you and your professional goals',
    icon: <User className="w-6 h-6" />
  },
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    icon: <User className="w-6 h-6" />
  },
  {
    id: 'experience',
    title: 'Current Experience',
    description: 'What\'s your current role and experience level?',
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    id: 'skills',
    title: 'Current Skills',
    description: 'What skills do you currently have?',
    icon: <TrendingUp className="w-6 h-6" />
  },
  {
    id: 'goals',
    title: 'Career Goals',
    description: 'What do you want to achieve in your career?',
    icon: <Target className="w-6 h-6" />
  },
  {
    id: 'challenges',
    title: 'Challenges & Pain Points',
    description: 'What workplace situations do you find difficult?',
    icon: <AlertCircle className="w-6 h-6" />
  },
  {
    id: 'communication',
    title: 'Communication Preferences',
    description: 'How do you prefer to learn and communicate?',
    icon: <MessageSquare className="w-6 h-6" />
  },
  {
    id: 'preferences',
    title: 'Learning Preferences',
    description: 'How much time can you dedicate and what would you like to practice?',
    icon: <Clock className="w-6 h-6" />
  },
  {
    id: 'summary',
    title: 'Summary & Confirmation',
    description: 'Review your profile and start your journey',
    icon: <CheckCircle className="w-6 h-6" />
  }
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: 'New to the workforce or changing careers' },
  { value: 'junior', label: 'Junior', description: '1-2 years of experience' },
  { value: 'mid', label: 'Mid-Level', description: '3-5 years of experience' },
  { value: 'senior', label: 'Senior', description: '5+ years of experience' }
];

const COMMON_SKILLS = [
  'Communication', 'Leadership', 'Project Management', 'Problem Solving',
  'Teamwork', 'Time Management', 'Critical Thinking', 'Adaptability',
  'Technical Writing', 'Public Speaking', 'Conflict Resolution', 'Mentoring',
  'Strategic Planning', 'Data Analysis', 'Customer Service', 'Negotiation'
];

const CAREER_GOALS = [
  'Advance to management/leadership role', 'Improve communication skills',
  'Build stronger professional relationships', 'Enhance presentation abilities',
  'Develop conflict resolution skills', 'Become a better team player',
  'Increase confidence in meetings', 'Learn to give effective feedback',
  'Master difficult conversations', 'Improve emotional intelligence',
  'Build networking skills', 'Enhance decision-making abilities'
];

const WORKPLACE_CHALLENGES = [
  'Speaking up in meetings', 'Dealing with difficult colleagues',
  'Managing workplace stress', 'Handling criticism/feedback',
  'Leading team discussions', 'Managing conflicts',
  'Time management and prioritization', 'Remote work communication',
  'Presenting to senior leadership', 'Building rapport with new team members',
  'Setting boundaries', 'Managing workload expectations'
];

const COMMUNICATION_CONCERNS = [
  'Speaking clearly and confidently', 'Active listening', 'Written communication',
  'Body language and presence', 'Emotional intelligence', 'Cross-cultural communication',
  'Remote communication', 'Difficult conversations', 'Public speaking',
  'Assertiveness without aggression', 'Empathy and understanding', 'Feedback delivery'
];

const PROJECT_TYPES = [
  'Team collaboration projects', 'Leadership scenarios', 'Client interaction simulations',
  'Presentation and public speaking', 'Conflict resolution scenarios', 'Performance review discussions',
  'Project management challenges', 'Cross-functional team projects', 'Crisis management situations',
  'Innovation and brainstorming sessions', 'Remote work collaboration', 'Mentoring scenarios'
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserSkillData>>({
    name: '',
    email: '',
    currentRole: '',
    experienceLevel: '',
    currentSkills: [],
    careerGoals: [],
    improvementAreas: [],
    workplaceChallenges: [],
    communicationConcerns: [],
    preferredProjectTypes: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear any existing data and start fresh - Always reset on page load
  useEffect(() => {
    console.log('🧹 Starting fresh onboarding - clearing any existing data...');
    DataManager.resetAllData();
  }, []);

  // If somehow user already completed onboarding (shouldn't happen due to reset above)
  useEffect(() => {
    if (DataManager.hasCompletedOnboarding()) {
      console.log('⚠️ User somehow already completed onboarding, redirecting...');
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = formData.currentSkills || [];
    const updated = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    setFormData(prev => ({ ...prev, currentSkills: updated }));
  };

  const handleArrayToggle = (field: keyof UserSkillData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const updated = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const handleInputChange = (field: keyof UserSkillData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = (): boolean => {
    // If currentStep is out of bounds, consider it valid (mentor intro step)
    if (currentStep >= ONBOARDING_STEPS.length) {
      return true;
    }
    
    const step = ONBOARDING_STEPS[currentStep];
    switch (step.id) {
      case 'welcome':
        return true;
      case 'personal':
        return !!(formData.name && formData.email);
      case 'experience':
        return !!(formData.currentRole && formData.experienceLevel);
      case 'skills':
        return (formData.currentSkills?.length || 0) >= 3;
      case 'goals':
        return (formData.careerGoals?.length || 0) >= 2;
      case 'challenges':
        return (formData.workplaceChallenges?.length || 0) >= 2;
      case 'communication':
        return (formData.communicationConcerns?.length || 0) >= 2;
      case 'preferences':
        return !!(formData.availableTimePerWeek && formData.preferredLearningStyle && 
                 (formData.preferredProjectTypes?.length || 0) >= 2);
      case 'summary':
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) return;

    setIsSubmitting(true);
    try {
      // Ensure all required fields have values
      const completeData: UserSkillData = {
        name: formData.name?.trim() || '',
        email: formData.email?.trim() || '',
        currentRole: formData.currentRole?.trim() || '',
        experienceLevel: formData.experienceLevel || 'entry',
        currentSkills: formData.currentSkills || [],
        careerGoals: formData.careerGoals || [],
        improvementAreas: formData.improvementAreas || [],
        workplaceChallenges: formData.workplaceChallenges || [],
        communicationConcerns: formData.communicationConcerns || [],
        availableTimePerWeek: formData.availableTimePerWeek || '4-6',
        preferredLearningStyle: formData.preferredLearningStyle || 'hands-on',
        preferredProjectTypes: formData.preferredProjectTypes || [],
        completedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      // Validate that essential data is present
      if (!completeData.name || !completeData.email || !completeData.experienceLevel) {
        throw new Error('Missing essential user information');
      }

      if (completeData.careerGoals.length === 0) {
        completeData.careerGoals = ['Improve communication skills', 'Build confidence'];
      }

      if (completeData.improvementAreas.length === 0) {
        completeData.improvementAreas = ['Communication', 'Leadership'];
      }

      // Save the complete data
      DataManager.completeOnboarding(completeData);
      
      // Double-check the data was saved properly
      const savedData = DataManager.getUserSkillData();
      if (!savedData || !savedData.name) {
        throw new Error('Data was not saved properly');
      }

      console.log('✅ Onboarding completed successfully with data:', completeData);
      console.log('✅ Verified saved data:', savedData);
      
      // Clear any existing coach data to ensure fresh start
      localStorage.removeItem('aiCoachMessages');
      localStorage.removeItem('aiCoachRoadmap');
      localStorage.removeItem('hasAutoGeneratedRoadmap');
      localStorage.removeItem('journeyStarted');
      
      // Show mentor introduction step
      setCurrentStep(ONBOARDING_STEPS.length);
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      alert('There was an error saving your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    // Safety check for out-of-bounds access
    if (currentStep >= ONBOARDING_STEPS.length) {
      return null; // This should never happen since the JSX checks the bound
    }
    
    const step = ONBOARDING_STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-3xl font-bold">Welcome to SimWorld</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SimWorld is your AI-powered career development platform designed to help you build 
              essential workplace skills through realistic simulations and personalized coaching.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <Card className="p-4">
                <Brain className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold">AI-Powered Coaching</h3>
                <p className="text-sm text-gray-600">Get personalized feedback and guidance</p>
              </Card>
              <Card className="p-4">
                <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold">Realistic Scenarios</h3>
                <p className="text-sm text-gray-600">Practice real workplace situations</p>
              </Card>
              <Card className="p-4">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold">Track Progress</h3>
                <p className="text-sm text-gray-600">Monitor your skill development</p>
              </Card>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tell us about yourself</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Professional Experience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Role/Title *</label>
                <Input
                  value={formData.currentRole || ''}
                  onChange={(e) => handleInputChange('currentRole', e.target.value)}
                  placeholder="e.g., Software Developer, Marketing Coordinator, Sales Associate"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level *</label>
                <div className="grid gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <Card 
                      key={level.value}
                      className={`cursor-pointer transition-colors p-4 ${
                        formData.experienceLevel === level.value 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('experienceLevel', level.value)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.experienceLevel === level.value 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{level.label}</h3>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Current Skills</h2>
            <p className="text-gray-600">Select at least 3 skills you currently have (choose all that apply):</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMMON_SKILLS.map((skill) => (
                <div
                  key={skill}
                  className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                    formData.currentSkills?.includes(skill)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.currentSkills?.includes(skill)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.currentSkills?.includes(skill) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{skill}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Selected:</strong> {(formData.currentSkills?.length || 0)} skills
                {(formData.currentSkills?.length || 0) < 3 && 
                  ` (${3 - (formData.currentSkills?.length || 0)} more needed)`
                }
              </p>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Career Goals</h2>
            <p className="text-gray-600">What do you want to achieve? Select at least 2 goals:</p>
            <div className="space-y-3">
              {CAREER_GOALS.map((goal) => (
                <Card
                  key={goal}
                  className={`cursor-pointer p-4 transition-colors ${
                    formData.careerGoals?.includes(goal)
                      ? 'bg-green-50 border-green-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleArrayToggle('careerGoals', goal)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.careerGoals?.includes(goal)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.careerGoals?.includes(goal) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{goal}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'challenges':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Workplace Challenges</h2>
            <p className="text-gray-600">What situations do you find challenging? Select at least 2:</p>
            <div className="space-y-3">
              {WORKPLACE_CHALLENGES.map((challenge) => (
                <Card
                  key={challenge}
                  className={`cursor-pointer p-4 transition-colors ${
                    formData.workplaceChallenges?.includes(challenge)
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleArrayToggle('workplaceChallenges', challenge)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.workplaceChallenges?.includes(challenge)
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.workplaceChallenges?.includes(challenge) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{challenge}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Communication Preferences</h2>
            <p className="text-gray-600">Which communication areas would you like to improve? Select at least 2:</p>
            <div className="space-y-3">
              {COMMUNICATION_CONCERNS.map((concern) => (
                <Card
                  key={concern}
                  className={`cursor-pointer p-4 transition-colors ${
                    formData.communicationConcerns?.includes(concern)
                      ? 'bg-purple-50 border-purple-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleArrayToggle('communicationConcerns', concern)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.communicationConcerns?.includes(concern)
                        ? 'bg-purple-500 border-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.communicationConcerns?.includes(concern) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{concern}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Learning Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">How much time can you dedicate per week? *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['1-3 hours', '4-6 hours', '7-10 hours', '10+ hours'].map((time) => (
                    <Card
                      key={time}
                      className={`cursor-pointer p-3 text-center transition-colors ${
                        formData.availableTimePerWeek === time
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('availableTimePerWeek', time)}
                    >
                      <span className="text-sm font-medium">{time}</span>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Learning Style *</label>
                <div className="grid gap-2">
                  {[
                    { value: 'hands-on', label: 'Hands-on Practice', desc: 'Learning by doing and practicing' },
                    { value: 'guided', label: 'Guided Learning', desc: 'Step-by-step instructions and examples' },
                    { value: 'independent', label: 'Independent Exploration', desc: 'Self-directed learning and discovery' }
                  ].map((style) => (
                    <Card
                      key={style.value}
                      className={`cursor-pointer p-4 transition-colors ${
                        formData.preferredLearningStyle === style.value
                          ? 'bg-green-50 border-green-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('preferredLearningStyle', style.value)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.preferredLearningStyle === style.value
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{style.label}</h3>
                          <p className="text-sm text-gray-600">{style.desc}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Project Types (select at least 2) *</label>
                <div className="space-y-2">
                  {PROJECT_TYPES.map((project) => (
                    <Card
                      key={project}
                      className={`cursor-pointer p-3 transition-colors ${
                        formData.preferredProjectTypes?.includes(project)
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleArrayToggle('preferredProjectTypes', project)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          formData.preferredProjectTypes?.includes(project)
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.preferredProjectTypes?.includes(project) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{project}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Ready to Start Your Journey!</h2>
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Your Profile Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Role:</strong> {formData.currentRole}</p>
                  <p><strong>Experience:</strong> {EXPERIENCE_LEVELS.find(l => l.value === formData.experienceLevel)?.label}</p>
                  <p><strong>Time Commitment:</strong> {formData.availableTimePerWeek}</p>
                </div>
                <div>
                  <p><strong>Skills:</strong> {formData.currentSkills?.length} selected</p>
                  <p><strong>Goals:</strong> {formData.careerGoals?.length} selected</p>
                  <p><strong>Focus Areas:</strong> {formData.communicationConcerns?.length} selected</p>
                  <p><strong>Learning Style:</strong> {formData.preferredLearningStyle}</p>
                </div>
              </div>
            </Card>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your AI coach will create a personalized learning path</li>
                <li>• You'll get access to realistic workplace scenarios</li>
                <li>• Practice sessions will be tailored to your goals and experience</li>
                <li>• Track your progress with detailed feedback and insights</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {currentStep >= ONBOARDING_STEPS.length ? 'Meet Your AI Mentor' : 'Career Development Setup'}
            </h1>
            <Badge variant="outline" className="text-sm">
              {currentStep >= ONBOARDING_STEPS.length 
                ? 'Ready for AI Coach!' 
                : `Step ${currentStep + 1} of ${ONBOARDING_STEPS.length}`
              }
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: currentStep >= ONBOARDING_STEPS.length 
                  ? '100%' 
                  : `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          {currentStep < ONBOARDING_STEPS.length ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  {ONBOARDING_STEPS[currentStep].icon}
                  <span>{ONBOARDING_STEPS[currentStep].title}</span>
                </CardTitle>
                <p className="text-gray-600">{ONBOARDING_STEPS[currentStep].description}</p>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </>
          ) : (
            /* Mentor Introduction */
            <div className="text-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Setup Complete!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Based on your responses, I've assigned you a personal AI Career Coach who will:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Target className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-semibold">Analyze Your Profile</span>
                    </div>
                    <p className="text-sm text-gray-600">Review your goals, skills, and challenges</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Map className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold">Design Your Roadmap</span>
                    </div>
                    <p className="text-sm text-gray-600">Create personalized projects just for you</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-semibold">Provide Guidance</span>
                    </div>
                    <p className="text-sm text-gray-600">Answer questions and mentor you</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="font-semibold">Track Progress</span>
                    </div>
                    <p className="text-sm text-gray-600">Monitor your skill development</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/coach')}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Meet Your AI Coach
                </Button>
              </motion.div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep === ONBOARDING_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing Setup...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
