import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useTheme } from './hooks/useTheme';

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
import AnalyticsSimple from './pages/Admin/AnalyticsSimple';
import AdminSettingsSimple from './pages/Admin/AdminSettingsSimple';
import BusinessIdeasManagement from './pages/Admin/BusinessIdeasManagement';
import ChallengeDetail from './pages/Admin/ChallengeDetail';
import SystemHealth from './pages/Admin/SystemHealth';
import Settings from './pages/Dashboard/Settings';
import Rewards from './pages/Dashboard/Rewards';
import Leaderboard from './pages/Dashboard/Leaderboard';

function App() {
  // Apply theme globally on app load
  useTheme();
  
  return (
    <BrowserRouter>
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
            <Route path="weeklyChallenge" element={<WeeklyChallenge />} />
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
            <Route path="analytics" element={<AnalyticsSimple />} />
            <Route path="settings" element={<AdminSettingsSimple />} />
            <Route path="business-ideas" element={<BusinessIdeasManagement />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
