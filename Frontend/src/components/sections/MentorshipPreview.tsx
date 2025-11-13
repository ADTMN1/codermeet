import React from 'react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function MentorshipPreview() {
  return (
    <section className="max-w-6xl mx-auto py-20 text-center px-6">
      <h2 className="text-3xl font-bold mb-6 text-green-400">
        <div className="flex items-center justify-center gap-3">
          <FaChalkboardTeacher />
          Mentorship & Premium
        </div>
      </h2>
      <p className="text-gray-300 max-w-3xl mx-auto mb-6">
        Upgrade to Premium for 1-on-1 mentoring, exclusive sessions, and
        advanced topics with top developers who guide you every step of the way.
      </p>
      <Link
        to="/mentorship"
        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
      >
        Learn More
      </Link>
    </section>
  );
}
