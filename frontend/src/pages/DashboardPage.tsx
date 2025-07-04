import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Plus, Users, Calendar, TrendingUp, Briefcase, Settings, Filter, SortAsc } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

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
    
    if (!createForm.name || createForm.name.trim().length < 3) {
      alert('Project name must be at least 3 characters long');
      return;
    }
    
    if (!createForm.userRole) {
      alert('Please select your role');
      return;
    }

    if (createForm.teamSize < 2 || createForm.teamSize > 20) {
      alert('Team size must be between 2 and 20');
      return;
    }

    try {
      setCreating(true);
      const response = await apiService.createProject(
        createForm.name.trim(),
        createForm.description.trim(),
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

  const getPhaseVariant = (phase: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants = {
      planning: 'outline' as const,
      development: 'default' as const,
      testing: 'secondary' as const,
      deployment: 'default' as const,
      maintenance: 'secondary' as const,
      completed: 'default' as const
    };
    return variants[phase as keyof typeof variants] || 'outline';
  };

  const statsData = [
    {
      title: 'Active Projects',
      value: projects.filter(p => p.is_active).length,
      icon: Briefcase,
      color: 'blue'
    },
    {
      title: 'Team Members',
      value: projects.reduce((sum, p) => sum + p.team_size, 0),
      icon: Users,
      color: 'green'
    },
    {
      title: 'This Month',
      value: projects.filter(p => {
        const created = new Date(p.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      color: 'purple'
    },
    {
      title: 'Completed',
      value: projects.filter(p => p.current_phase === 'completed').length,
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage your workplace simulation projects and track your progress
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new workplace simulation project to practice your skills.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  required
                  minLength={3}
                  maxLength={200}
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Describe your project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Role</label>
                <select
                  required
                  value={createForm.userRole}
                  onChange={(e) => setCreateForm({...createForm, userRole: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select your role</option>
                  {PROJECT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {createForm.userRole && (
                  <p className="text-xs text-muted-foreground">
                    {PROJECT_ROLES.find(r => r.value === createForm.userRole)?.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Size</label>
                  <select
                    value={createForm.teamSize}
                    onChange={(e) => setCreateForm({...createForm, teamSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={3}>3 members</option>
                    <option value={5}>5 members</option>
                    <option value={7}>7 members</option>
                    <option value={10}>10 members</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Type</label>
                  <select
                    value={createForm.projectType}
                    onChange={(e) => setCreateForm({...createForm, projectType: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="web_development">Web Development</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="data_science">Data Science</option>
                    <option value="design_project">Design Project</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${
                    stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    stat.color === 'green' ? 'from-green-500 to-green-600' :
                    stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    'from-orange-500 to-orange-600'
                  }`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Your Projects</CardTitle>
                <CardDescription>Manage and track your workplace simulations</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <SortAsc className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
                />
                <p className="text-muted-foreground mt-4">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first project to start practicing workplace scenarios and building your professional skills.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 group border-0 bg-gradient-to-br from-white to-gray-50">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          <Badge variant={getPhaseVariant(project.current_phase)}>
                            {project.current_phase}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {project.team_size} members
                          </span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="flex-1"
                          >
                            <Button className="w-full" size="sm">
                              Open Project
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardPage; 
