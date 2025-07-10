import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPageNew';
import DashboardPage from './pages/DashboardPage';
import CoachPage from './pages/CoachPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EnhancedProjectPage from './pages/EnhancedProjectPage';
import ConversationPage from './pages/ConversationPage';
import RoadmapGenerationPage from './pages/RoadmapGenerationPage';
import RoadmapPage from './pages/RoadmapPage';
import RoadmapDetailsPage from './pages/RoadmapDetailsPage';
import DebriefPage from './pages/DebriefPage';
import CoachIntroPage from './pages/CoachIntroPage';
import UserProfilePage from './pages/UserProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/toast-provider';
import DataManager from './utils/dataManager';
import ErrorBoundary from './components/ErrorBoundary';

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

// Utility to check if setup is fully complete
const isSetupComplete = () => {
  return (
    DataManager.hasCompletedOnboarding() &&
    !!DataManager.getRoadmapData() &&
    !!DataManager.getUserProgress() &&
    localStorage.getItem('roadmapConfirmed') === 'true'
  );
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Prevent access to onboarding or roadmap generation after setup
  if (
    isAuthenticated &&
    isSetupComplete() &&
    (location.pathname === '/onboarding' || location.pathname === '/roadmap-generation')
  ) {
    return <Navigate to="/dashboard" replace />;
  }

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
          <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
          <Route path="/project" element={<ProtectedRoute><EnhancedProjectPage /></ProtectedRoute>} />
          <Route path="/project/:projectId" element={<ProtectedRoute><EnhancedProjectPage /></ProtectedRoute>} />
          <Route path="/project/conversations/:conversationId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
          <Route path="/roadmap-generation" element={<ProtectedRoute><RoadmapGenerationPage /></ProtectedRoute>} />
          <Route path="/roadmap-details" element={<ProtectedRoute><RoadmapDetailsPage /></ProtectedRoute>} />
          <Route path="/debrief" element={<ProtectedRoute><DebriefPage /></ProtectedRoute>} />
          <Route path="/coach-intro" element={<ProtectedRoute><CoachIntroPage /></ProtectedRoute>} />
          <Route path="/user-profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          {/* Redirect legacy routes to new structure */}
          <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />
          <Route path="/coach-chat" element={<Navigate to="/coach" replace />} />
          <Route path="/agents" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
          <ToastProvider />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
