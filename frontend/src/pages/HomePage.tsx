import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Users, FileText, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

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

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/simulations/scenarios`);
      if (response.ok) {
        const data = await response.json();
        const scenariosData = data.scenarios || {};
        
        // Transform the scenarios object into an array
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
        // Fallback to static scenarios if API fails
        setScenarios([
          {
            id: 'team_meeting',
            name: 'Team Meeting',
            description: 'Lead a team meeting with various personalities',
            difficulty: 'Easy',
            duration: 30
          },
          {
            id: 'client_presentation',
            name: 'Client Presentation',
            description: 'Present a proposal to a challenging client',
            difficulty: 'Medium',
            duration: 45
          },
          {
            id: 'crisis_management',
            name: 'Crisis Management',
            description: 'Handle a workplace crisis with multiple stakeholders',
            difficulty: 'Hard',
            duration: 60
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      // Use fallback data on error
      setScenarios([
        {
          id: 'team_meeting',
          name: 'Team Meeting',
          description: 'Lead a team meeting with various personalities',
          difficulty: 'Easy',
          duration: 30
        },
        {
          id: 'client_presentation',
          name: 'Client Presentation', 
          description: 'Present a proposal to a challenging client',
          difficulty: 'Medium',
          duration: 45
        },
        {
          id: 'crisis_management',
          name: 'Crisis Management',
          description: 'Handle a workplace crisis with multiple stakeholders',
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
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg text-gray-600">Loading scenarios...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    scenario.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                    scenario.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{scenario.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Duration: {scenario.duration} min</span>
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
        )}
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
