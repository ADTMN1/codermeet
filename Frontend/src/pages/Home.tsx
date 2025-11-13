import React from 'react';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import Footer from '../components/layout/Footer';
import LeaderboardPreview from '../components/sections/LeaderboardPreview';
import WeeklyChallenge from '../components/sections/weeklyChallenge';
import Testimonials from '../components/sections/Testimonials';

const Home: React.FC = () => {
  return (
    <main>
      <Hero />
      <Features />
      <LeaderboardPreview />
      <WeeklyChallenge />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Home;
