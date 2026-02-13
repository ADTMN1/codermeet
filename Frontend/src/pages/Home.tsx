import React from 'react';

import Hero from '../components/sections/Hero';

import HomeFeatures from '../components/sections/HomeFeatures';

import LeaderboardPreview from '../components/sections/LeaderboardPreview';

import Testimonials from '../components/sections/Testimonials';



const Home: React.FC = () => {

  return (

    <main className="pt-16">

      <Hero />

      <HomeFeatures />

      <LeaderboardPreview />

      <Testimonials />

    </main>

  );

};



export default Home;

