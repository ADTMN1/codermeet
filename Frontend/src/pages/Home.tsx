import React from 'react';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import Footer from '../components/layout/Public/Footer';
import LeaderboardPreview from '../components/sections/LeaderboardPreview';
import WeeklyChallengePreview from '../components/sections/WeeklyChallengePreview';
import Testimonials from '../components/sections/Testimonials';

const Home: React.FC = () => {
  return (
    <main>
      <Hero />
      <Features />
      <LeaderboardPreview />
      <WeeklyChallengePreview />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Home;
