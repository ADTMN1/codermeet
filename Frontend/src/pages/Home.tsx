import React from 'react';

import Hero from '../components/sections/Hero';

import Features from '../components/sections/Features';

import LeaderboardPreview from '../components/sections/LeaderboardPreview';

import Testimonials from '../components/sections/Testimonials';



const Home: React.FC = () => {

  return (

    <main className="pt-16">

      <Hero />

      <Features />

      <LeaderboardPreview />

      <Testimonials />

    </main>

  );

};



export default Home;

