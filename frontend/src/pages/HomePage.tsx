import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, FileText, TrendingUp } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Play,
      title: 'AI-Powered Simulations',
      description: 'Practice real workplace scenarios with intelligent AI agents that respond naturally to your actions.',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Dynamic Role Playing',
      description: 'Choose from various professional roles and interact with different personality types.',
      color: 'text-green-600'
    },
    {
      icon: FileText,
      title: 'Automated Artifacts',
      description: 'Generate meeting minutes, reports, and action items automatically from your simulations.',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress and receive detailed feedback on your communication and leadership skills.',
      color: 'text-orange-600'
    }
  ];

  const scenarios = [
    {
      id: 'team_meeting',
      name: 'Team Meeting',
      description: 'Lead a team meeting with various personalities',
      difficulty: 'Easy',
      duration: '30 min'
    },
    {
      id: 'client_presentation',
      name: 'Client Presentation',
      description: 'Present a proposal to a challenging client',
      difficulty: 'Medium',
      duration: '45 min'
    },
    {
      id: 'crisis_management',
      name: 'Crisis Management',
      description: 'Handle a workplace crisis with multiple stakeholders',
      difficulty: 'Hard',
      duration: '60 min'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Master Workplace
          <span className="text-primary-600"> Skills</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Practice real workplace scenarios with AI-powered simulations. 
          Develop your communication, leadership, and problem-solving skills in a safe, interactive environment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/simulation"
            className="btn-primary text-lg px-8 py-3"
          >
            Start Simulation
          </Link>
          <Link
            to="/agents"
            className="btn-secondary text-lg px-8 py-3"
          >
            Meet the Agents
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="card text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4 ${feature.color}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* Scenarios Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  scenario.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  scenario.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {scenario.difficulty}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{scenario.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Duration: {scenario.duration}</span>
                <Link
                  to={`/simulation?scenario=${scenario.id}`}
                  className="btn-primary text-sm"
                >
                  Start
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
          <div className="text-gray-600">Simulations Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
          <div className="text-gray-600">AI Agents Available</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
          <div className="text-gray-600">User Satisfaction</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 