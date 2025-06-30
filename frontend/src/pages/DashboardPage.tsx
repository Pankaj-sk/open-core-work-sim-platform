import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Plus, Users, Calendar, TrendingUp, Briefcase, Settings } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  current_phase: string;
  team_size: number;
  is_active: boolean;
}

interface ProjectRole {
  value: string;
  label: string;
  description: string;
}

const PROJECT_ROLES: ProjectRole[] = [
  {
    value: 'junior_developer',
    label: 'Junior Developer',
    description: 'Entry-level development role with mentorship opportunities'
  },
  {
    value: 'senior_developer',
    label: 'Senior Developer',
    description: 'Experienced developer with technical leadership responsibilities'
  },
  {
    value: 'tech_lead',
    label: 'Tech Lead',
    description: 'Technical leadership role with architecture and mentoring focus'
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Project coordination and team management role'
  },
  {
    value: 'product_manager',
    label: 'Product Manager',
    description: 'Product strategy and stakeholder management role'
  },
  {
    value: 'qa_engineer',
    label: 'QA Engineer',
    description: 'Quality assurance and testing specialist role'
  },
  {
    value: 'designer',
    label: 'Designer',
    description: 'UI/UX design and user experience role'
  },
  {
    value: 'business_analyst',
    label: 'Business Analyst',
    description: 'Requirements analysis and process improvement role'
  }
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    userRole: '',
    teamSize: 5,
    projectType: 'web_development'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProjects();
      if (response.success) {
        setProjects(response.data?.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.name || !createForm.userRole) {
      return;
    }

    try {
      setCreating(true);
      const response = await apiService.createProject(
        createForm.name,
        createForm.description,
        createForm.userRole,
        createForm.teamSize,
        createForm.projectType
      );

      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          description: '',
          userRole: '',
          teamSize: 5,
          projectType: 'web_development'
        });
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      development: 'bg-green-100 text-green-800',
      testing: 'bg-yellow-100 text-yellow-800',
      deployment: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your workplace simulation projects and track your progress
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.reduce((sum, p) => sum + p.team_size, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter(p => {
                  const created = new Date(p.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && 
                         created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.filter(p => p.current_phase === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">Filter</button>
            <button className="btn-secondary text-sm">Sort</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first project to start practicing workplace scenarios
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPhaseColor(project.current_phase)}`}>
                    {project.current_phase}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{project.team_size} team members</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="btn-primary text-sm flex-1 text-center"
                  >
                    Open Project
                  </Link>
                  <button className="btn-secondary text-sm">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Project
            </h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Describe your project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role
                </label>
                <select
                  required
                  value={createForm.userRole}
                  onChange={(e) => setCreateForm({...createForm, userRole: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select your role</option>
                  {PROJECT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {createForm.userRole && (
                  <p className="text-xs text-gray-600 mt-1">
                    {PROJECT_ROLES.find(r => r.value === createForm.userRole)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Size
                </label>
                <select
                  value={createForm.teamSize}
                  onChange={(e) => setCreateForm({...createForm, teamSize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={3}>3 members</option>
                  <option value={5}>5 members</option>
                  <option value={7}>7 members</option>
                  <option value={10}>10 members</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  value={createForm.projectType}
                  onChange={(e) => setCreateForm({...createForm, projectType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="web_development">Web Development</option>
                  <option value="mobile_app">Mobile App</option>
                  <option value="data_science">Data Science</option>
                  <option value="design_project">Design Project</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 