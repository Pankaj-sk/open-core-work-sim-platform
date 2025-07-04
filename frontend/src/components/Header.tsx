import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Play, Home, Settings, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/simulation', label: 'Simulation', icon: Play, public: false },
    { path: '/agents', label: 'Agents', icon: Users, public: false },
  ];

  const handleLogout = () => {
    logout();
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
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings size={16} />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
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
    </motion.header>
  );
};

export default Header;
