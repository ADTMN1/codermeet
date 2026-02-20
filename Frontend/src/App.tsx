import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from './components/ui/toast';
import { ToastProvider } from './context/ToastContext';
import { useTheme } from './hooks/useTheme';
import { sessionManager } from './services/sessionManager';

import Navbar from './components/layout/Public/Navbar';
import Footer from './components/layout/Public/Footer';
import Home from './pages/Home';
import About from './pages/About';
import MentorshipPreview from './components/sections/MentorshipPreview';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import DashboardLayout from './components/layout/Private/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import WeeklyChallenge from './pages/Dashboard/WeeklyChallenge';
import Community from './pages/Dashboard/Community';
import Developers from './pages/Dashboard/Developers';
import Notifications from './pages/Dashboard/Notifications';
import Profile from './pages/profile/profile';
import Resources from './pages/Resources';
import DailyCoding from './pages/DailyCoding';
import BusinessIdeaCompetition from './pages/Dashboard/BusinessIdeaCompetition';
import MentorshipDashboard from './pages/MentorshipDashboard/MentorshipDashboard';
import Pricing from './pages/Pricing';
import PricingInfo from './pages/PricingInfo';
import PaymentSuccess from './pages/PaymentSuccess';
import Features from './components/sections/Features';
import ViewProjects from './pages/Projects/ViewProjects';
import AdminLayout from './components/layout/Admin/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DashboardOverview from './pages/Admin/DashboardOverview';
import UserManagement from './pages/Admin/UserManagement';
import ChallengesHub from './pages/Admin/ChallengesHub';
import SubmissionsSimple from './pages/Admin/SubmissionsSimple';
import SystemHealthSimple from './pages/Admin/SystemHealthSimple';
import AIDailyChallenges from './pages/Admin/AIDailyChallenges';
import WeeklyContestsSimple from './pages/Admin/WeeklyContestsSimple';
import CreateWeeklyContest from './pages/Admin/CreateWeeklyContest';
import AnalyticsSimple from './pages/Admin/AnalyticsSimple';
import AdminSettingsSimple from './pages/Admin/AdminSettingsSimple';
import BusinessIdeasManagement from './pages/Admin/BusinessIdeasManagement';
import ChallengeDetail from './pages/Admin/ChallengeDetail';
import SystemHealth from './pages/Admin/SystemHealth';
import Settings from './pages/Dashboard/Settings';
import Rewards from './pages/Dashboard/Rewards';
import Leaderboard from './pages/Dashboard/Leaderboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Apply theme globally on app load
  useTheme();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ToastProvider>
    </QueryClientProvider>
  );
}


function AppContent() {
  const location = useLocation();
  
  // Professional session and data cleanup
  useEffect(() => {
    // Perform comprehensive cleanup
    const cleanup = sessionManager.performCleanup();
    
    // Validate session state and log issues
    const validation = sessionManager.validateSessionState();
    if (!validation.isValid) {
      console.warn('Session validation issues:', validation.issues);
      // Clear invalid session data
      if (validation.issues.length > 0) {
        sessionManager.clearSessions();
        sessionManager.clearPendingUpgrade();
      }
    }

    // Log cleanup actions for debugging
    if (cleanup.sessionsCleared || cleanup.upgradeCleared) {
      console.log('Session cleanup completed:', cleanup);
    }
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen bg-black text-gray-300 font-serif">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <SignUp />
                <Footer />
              </>
            }
          />
          <Route
            path="/mentorship"
            element={
              <>
                <Navbar />
                <MentorshipPreview />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Navbar />
                <About />
                <Footer />
              </>
            }
          />

          {/* Features Page - Show platform capabilities */}
          <Route
            path="/features"
            element={
              <>
                <Navbar />
                <Features />
                <Footer />
              </>
            }
          />

          {/* Pricing Page - Public but shows user's current plan */}
          <Route
            path="/pricing"
            element={
              <>
                <Navbar />
                <Pricing />
                <Footer />
              </>
            }
          />

          {/* Pricing Info Page - New pricing information */}
          <Route
            path="/pricing-info"
            element={
              <>
                <Navbar />
                <PricingInfo />
                <Footer />
              </>
            }
          />

          {/* Payment Success Page - After payment */}
          <Route
            path="/payment-success"
            element={
              <>
                <Navbar />
                <PaymentSuccess />
                <Footer />
              </>
            }
          />

          {/* Dashboard Layout Routes - including profile */}
          <Route path="/*" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="weeklyChallenge/:id?" element={<WeeklyChallenge />} />
            <Route path="community" element={<Community />} />
            <Route path="developers" element={<Developers />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="resources" element={<Resources />} />
            <Route path="daily-challenge" element={<DailyCoding />} />
            <Route path="business-competition" element={<BusinessIdeaCompetition />} />
            <Route path="mentorship-dashboard" element={<MentorshipDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="projects" element={<ViewProjects />} />
            <Route path="settings" element={<Settings />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="leaderboard" element={<Leaderboard />} />

            {/* Optional: Redirect root to dashboard */}
            <Route path="" element={<Dashboard />} />
          </Route>

          {/* Admin Routes - Separate from user routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="challenges" element={<ChallengesHub />} />
            <Route path="challenges/:id" element={<ChallengeDetail />} />
            <Route path="submissions" element={<SubmissionsSimple />} />
            <Route path="system" element={<SystemHealth />} />
            <Route path="daily-challenges" element={<AIDailyChallenges />} />
            <Route path="weekly-challenges" element={<WeeklyContestsSimple />} />
            <Route path="weekly-challenges/create" element={<CreateWeeklyContest />} />
            <Route path="analytics" element={<AnalyticsSimple />} />
            <Route path="settings" element={<AdminSettingsSimple />} />
            <Route path="business-ideas" element={<BusinessIdeasManagement />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    );
}

export default App;
