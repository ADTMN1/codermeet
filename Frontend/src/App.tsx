import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import MentorshipPreview from './components/sections/MentorshipPreview';
import Login from './pages/Login';
// import Discover from './pages/Discover';
// import Projects from './pages/Projects';
// import Community from './pages/Community';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-gray-300 font-mono">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* {/* <Route path="/discover" element={<Discover />} /> */}
          <Route path="/mentorship" element={<MentorshipPreview />} />
          {/* <Route path="/community" element={<Community />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
