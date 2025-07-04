import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, FileText, TrendingUp, Clock, Star, ArrowRight, Sparkles, Zap, Target, Award, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: number;
}

const HomePage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/scenarios`);
      if (response.ok) {
        const data = await response.json();
        const scenariosData = data.scenarios || {};
        
        const scenariosList: Scenario[] = Object.entries(scenariosData).map(([id, scenario]: [string, any]) => ({
          id,
          name: scenario.name || id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: scenario.description || 'No description available',
          difficulty: scenario.difficulty || 'Unknown',
          duration: scenario.duration || 30
        }));
        
        setScenarios(scenariosList);
      } else {
        console.error('Failed to fetch scenarios');
        setScenarios([
          {
            id: 'team_meeting',
            name: 'Team Meeting',
            description: 'Lead a team meeting with various personalities and drive productive discussions',
            difficulty: 'Easy',
            duration: 30
          },
          {
            id: 'client_presentation',
            name: 'Client Presentation', 
            description: 'Present a proposal to a challenging client and handle objections gracefully',
            difficulty: 'Medium',
            duration: 45
          },
          {
            id: 'crisis_management',
            name: 'Crisis Management',
            description: 'Handle a workplace crisis with multiple stakeholders under pressure',
            difficulty: 'Hard',
            duration: 60
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setScenarios([
        {
          id: 'team_meeting',
          name: 'Team Meeting',
          description: 'Lead a team meeting with various personalities and drive productive discussions',
          difficulty: 'Easy',
          duration: 30
        },
        {
          id: 'client_presentation',
          name: 'Client Presentation', 
          description: 'Present a proposal to a challenging client and handle objections gracefully',
          difficulty: 'Medium',
          duration: 45
        },
        {
          id: 'crisis_management',
          name: 'Crisis Management',
          description: 'Handle a workplace crisis with multiple stakeholders under pressure',
          difficulty: 'Hard',
          duration: 60
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Simulations',
      description: 'Practice real workplace scenarios with intelligent AI agents that respond naturally to your actions.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Dynamic Role Playing',
      description: 'Choose from various professional roles and interact with different personality types.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Automated Artifacts',
      description: 'Generate meeting minutes, reports, and action items automatically from your simulations.',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress and receive detailed feedback on your communication and leadership skills.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { icon: Play, value: '500+', label: 'Simulations Completed' },
    { icon: Users, value: '50+', label: 'AI Agents Available' },
    { icon: Award, value: '95%', label: 'User Satisfaction' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div 
      className="min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 lg:py-32 overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Workplace Training</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Master{' '}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Workplace Skills
              </span>
              <br />
              with AI Simulations
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Practice real workplace scenarios with intelligent AI agents. 
              Develop communication, leadership, and problem-solving skills in a safe, interactive environment.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              variants={itemVariants}
            >
              {isAuthenticated ? (
                // Buttons for authenticated users
                <>
                  <Link to="/simulation">
                    <Button size="lg" className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                      <Play className="w-5 h-5" />
                      Start Simulation
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/agents">
                    <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
                      <Users className="w-5 h-5" />
                      Meet the Agents
                    </Button>
                  </Link>
                </>
              ) : (
                // Buttons for guest users
                <>
                  <Link to="/login">
                    <Button size="lg" className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <LogIn className="w-5 h-5" />
                      Get Started - Sign In
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6 border-2 hover:bg-blue-50">
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-20 bg-muted/30"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose SimWorld?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience cutting-edge AI technology designed to enhance your professional skills
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mx-auto mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Scenarios Section */}
      <motion.section 
        className="py-20"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available Scenarios
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from a variety of workplace simulations tailored to different skill levels
            </p>
          </motion.div>

          {loading ? (
            <motion.div 
              className="text-center py-16"
              variants={itemVariants}
            >
              <div className="inline-flex items-center gap-2 text-lg text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading scenarios...
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {scenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl">{scenario.name}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyVariant(scenario.difficulty)}`}>
                          {scenario.difficulty}
                        </span>
                      </div>
                      <CardDescription className="text-base leading-relaxed">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{scenario.duration} min</span>
                        </div>
                        <Link to={`/simulation?scenario=${scenario.id}`}>
                          <Button className="gap-2">
                            <Play className="w-4 h-4" />
                            Start
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="py-20 bg-muted/30"
        variants={itemVariants}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="text-center border-0 shadow-lg">
                    <CardContent className="pt-8 pb-8">
                      <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default HomePage;
