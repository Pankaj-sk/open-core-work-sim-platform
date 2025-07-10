// 📄 PAGE: HomePage.tsx - Landing page for AI-powered career development platform
import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Award, LogIn, UserPlus, Brain, MessageSquare, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import DataManager from '../utils/dataManager';

const isSetupComplete = () => {
  return (
    DataManager.hasCompletedOnboarding() &&
    !!DataManager.getRoadmapData() &&
    !!DataManager.getUserProgress() &&
    localStorage.getItem('roadmapConfirmed') === 'true'
  );
};

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const setupComplete = isSetupComplete();

  const features = [
    {
      icon: Brain,
      title: "AI Coach & Personalized Roadmap",
      description: "Get a dedicated AI coach who creates your personalized learning path based on your role, goals, and current skills."
    },
    {
      icon: Target,
      title: "Focused Project Workspace",
      description: "Work on one carefully designed project at a time with AI team members who provide realistic collaboration experience."
    },
    {
      icon: MessageSquare,
      title: "Smart Conversation System",
      description: "Chat with AI personas who remember your interactions and provide dynamic workplace communication practice."
    },
    {
      icon: BarChart3,
      title: "AI Coach Debrief",
      description: "Receive comprehensive analysis of your work with specific feedback on strengths and areas for improvement."
    }
  ];

  const userTypes = [
    {
      title: "Junior Developers",
      description: "Practice communicating with senior team members and managers in a safe environment"
    },
    {
      title: "Career Changers", 
      description: "Learn workplace dynamics and communication patterns in your new field"
    },
    {
      title: "Remote Workers",
      description: "Improve virtual collaboration skills and build confidence in team interactions"
    },
    {
      title: "Anyone Growing Professionally",
      description: "Build communication, leadership, and collaboration skills that matter for career advancement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 px-6"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Personal AI Coach for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Professional Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              SimWorld helps you develop essential workplace skills through realistic AI-powered team collaboration. 
              Get personalized coaching, practice with AI personas, and receive detailed feedback on your professional growth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {isAuthenticated ? (
              setupComplete ? (
                <Link to="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-6">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/onboarding" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-6">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
              )
            ) : (
              <>
                <Link to="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-6">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 py-6">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How SimWorld Accelerates Your Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides a safe space to practice workplace skills and receive personalized coaching
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Journey Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Career Development Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start building the skills that matter for your professional growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Skill Assessment & AI Coach",
                description: "Tell us about your role, goals, and current skills. Meet your dedicated AI coach who creates your personalized roadmap."
              },
              {
                step: "2", 
                title: "Project Workspace & AI Team",
                description: "Work on a focused project with AI personas (Manager & Teammate) who provide realistic collaboration experience."
              },
              {
                step: "3",
                title: "AI Coach Debrief & Growth",
                description: "Receive comprehensive feedback on your performance with specific insights on strengths and areas to improve."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect For Every Stage of Your Career
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're starting out or looking to advance, SimWorld helps you build essential workplace skills
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {userTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-3 h-5 w-5 text-blue-600" />
                      {type.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Accelerate Your Professional Growth?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join SimWorld today and start building the workplace skills that will advance your career
            </p>
            {!isAuthenticated && (
              <Link to="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-8 py-6">
                <UserPlus className="mr-2 h-5 w-5" />
                Get Started Free
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
