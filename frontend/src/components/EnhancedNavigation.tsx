// Enhanced Navigation Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Brain, 
  Briefcase, 
  Users, 
  MessageSquare, 
  BarChart3,
  Settings,
  User,
  Bell,
  Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import DataManager from '../utils/dataManager';

const EnhancedNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = DataManager.getUserSkillData();
  const userProgress = DataManager.getUserProgress();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="w-4 h-4" />,
      description: 'Overview and quick actions'
    },
    {
      label: 'AI Coach',
      path: '/coach',
      icon: <Brain className="w-4 h-4" />,
      description: 'Personal mentor and guidance',
      badge: 'AI'
    },
    {
      label: 'Projects',
      path: '/project',
      icon: <Briefcase className="w-4 h-4" />,
      description: 'Practice scenarios and challenges'
    },
    {
      label: 'AI Agents',
      path: '/agents',
      icon: <Users className="w-4 h-4" />,
      description: 'Team members and personas'
    },
    {
      label: 'Conversations',
      path: '/conversation',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Chat history and analysis'
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Progress tracking and insights'
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SimWorld</h1>
                <p className="text-xs text-gray-500">AI Career Development</p>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={isActivePath(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActivePath(item.path) 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={item.description}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs bg-purple-100 text-purple-700"
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActivePath(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-300 rounded-full"></div>
                )}
              </Button>
            ))}
          </div>

          {/* User Profile and Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Ask AI coach..."
                  className="pl-10 pr-4 py-2 w-64 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      navigate('/coach');
                    }
                  }}
                />
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {(userProgress?.completedProjects || 0) > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userData?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {userData?.currentRole || 'Professional'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto space-x-1 py-2">
            {navigationItems.slice(0, 4).map((item) => (
              <Button
                key={item.path}
                variant={isActivePath(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg ${
                  isActivePath(item.path) 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600'
                }`}
                size="sm"
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        {userProgress && (
          <div className="hidden lg:block border-t border-gray-100 py-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Progress: {userProgress.completedProjects || 0} projects completed</span>
                <span>Skills: {userProgress.skillsImproved?.length || 0} developed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-1 bg-green-500 rounded-full transition-all" 
                    style={{ width: `${Math.min(((userProgress.completedProjects || 0) / 5) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-green-600 font-medium">
                  {Math.min(((userProgress.completedProjects || 0) / 5) * 100, 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedNavigation;
