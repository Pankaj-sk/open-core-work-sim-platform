import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Play, Home, Settings, LogIn, UserPlus, LogOut, User, Brain, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import DataManager from '../utils/dataManager';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: User, public: false },
    { path: '/project', label: 'Projects', icon: Play, public: false },
    { path: '/agents', label: 'Agents', icon: Users, public: false },
    { path: '/coach', label: 'AI Coach', icon: Brain, public: false },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleResetData = () => {
    console.log('🧹 Resetting all SimWorld data...');
    DataManager.resetAllData();
    setShowResetDialog(false);
    
    // Force reload to clear any cached state
    window.location.href = '/onboarding';
  };

  return (
    <motion.header 
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
          >
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              SimWorld
            </Link>
          </motion.div>
          
          <nav className="flex items-center space-x-2">
            {navItems.map((item) => {
              // Show public items always, protected items only when authenticated
              if (!item.public && !isAuthenticated) {
                return null;
              }
              
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {isAuthenticated ? (
              // Authenticated user menu
              <>
                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings size={16} />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/onboarding')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowResetDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>Reset All Data</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user?.full_name || user?.username}
                </div>
              </>
            ) : (
              // Guest user menu
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn size={16} />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="default" size="sm" className="gap-2">
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      
      {/* Reset Data Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reset All Data
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>This action will permanently delete:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Your onboarding profile and preferences</li>
                <li>All project progress and history</li>
                <li>AI coach conversation history</li>
                <li>Completed scenarios and feedback</li>
              </ul>
              <p className="font-medium text-destructive">
                This action cannot be undone. You'll need to complete onboarding again.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetData}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.header>
  );
};

export default Header;
