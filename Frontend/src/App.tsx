import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/Public/Navbar';
import Home from './pages/Home';
import MentorshipPreview from './components/sections/MentorshipPreview';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import DashboardLayout from './components/layout/Private/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import WeeklyChallenge from './pages/Dashboard/WeeklyChallenge';
import Community from './pages/Dashboard/Community';
import Profile from './pages/profile/profile';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
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
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <SignUp />
              </>
            }
          />
          <Route
            path="/mentorship"
            element={
              <>
                <Navbar />
                <MentorshipPreview />
              </>
            }
          />

          {/* Pricing Page - Public but shows user's current plan */}
          <Route
            path="/pricing"
            element={<Pricing />}
          />

          {/* Payment Success Page - After payment */}
          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />

          {/* Dashboard Layout Routes - including profile */}
          <Route path="/*" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="weeklyChallenge" element={<WeeklyChallenge />} />
            <Route path="community" element={<Community />} />
            <Route path="profile" element={<Profile />} />

            {/* Optional: Redirect root to dashboard */}
            <Route path="" element={<Dashboard />} />
          </Route>

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
