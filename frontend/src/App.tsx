// @ts-nocheck
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPageNew';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ConversationPage from './pages/ConversationPage';
import CoachPage from './pages/CoachPage';
import DebriefPage from './pages/DebriefPage';
import AgentsPage from './pages/AgentsPage';
import AICoachChat from './components/AICoachChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/toast-provider';
import DataManager from './utils/dataManager';

// Protected Route Component that also checks for onboarding completion
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only check onboarding if user is authenticated and not on onboarding page
    if (isAuthenticated && !loading && location.pathname !== '/onboarding') {
      const hasCompleted = DataManager.hasCompletedOnboarding();
      if (!hasCompleted) {
        console.log('🚪 User not onboarded, redirecting to onboarding...');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/project" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
          <Route path="/project/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
          <Route path="/project/conversations/:conversationId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
          <Route path="/debrief" element={<ProtectedRoute><DebriefPage /></ProtectedRoute>} />
        </Routes>
      </main>
      
      {/* AI Coach Chat - appears on all pages when authenticated */}
      {isAuthenticated && <AICoachChat />}
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
        <ToastProvider />
      </AuthProvider>
    </Router>
  );
}

export default App; 
