import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/Public/Navbar';
import Home from './pages/Home';
import MentorshipPreview from './components/sections/MentorshipPreview';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './components/layout/Private/Dashboard';
// import Projects from './pages/Projects';
// import Community from './pages/Community';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-gray-300 font-mono">
        {/* PUBLIC NAVBAR ONLY ON PUBLIC PAGES */}
        <Routes>
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

          {/* DASHBOARD - PRIVATE ROUTES */}
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
