import React from 'react';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';

const testimonials = [
  {
    name: '@Amanuel',
    role: 'Fullstack Developer',
    text: 'CoderMeet helped me connect with amazing developers and improved my coding skills tremendously. The weekly challenges are fun and motivating!',
  },
  {
    name: '@Marta',
    role: 'Frontend Developer',
    text: 'I love the community! The mentorship sessions really helped me understand complex concepts in React and TypeScript.',
  },
  {
    name: '@Selam',
    role: 'Backend Developer',
    text: 'The leaderboard keeps me motivated every week. Competing and collaborating with others has boosted my productivity.',
  },
];

export default function Testimonials() {
  return (
    <section className="relative max-w-6xl mx-auto py-24 px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 mb-16 animate-pulse">
        💬 Developer Testimonials
      </h2>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="flex-1 bg-black/80 backdrop-blur-md p-6 rounded-xl text-left text-green-300 font-mono hover:shadow-lg hover:shadow-purple-500/40 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 text-purple-400 mb-4">
              <FaQuoteLeft />
              <p className="italic">{testimonial.text}</p>
              <FaQuoteRight />
            </div>
            <p className="mt-4 text-blue-400 font-semibold">
              {testimonial.name}
            </p>
            <p className="text-gray-400 text-sm">{testimonial.role}</p>
          </div>
        ))}
      </div>

      {/* Neon accent line */}
      <div className="mt-12 h-1 w-32 mx-auto rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 animate-pulse"></div>
    </section>
  );
}
