import React from 'react';

const About: React.FC = () => {
  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            About CoderMeet
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Where developers connect, create, and innovate together. 
            Join a thriving community of coders, share your projects, learn from mentors, 
            compete in challenges, and turn your ideas into reality.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Mission</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
          </div>
          <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 rounded-xl p-8 max-w-4xl mx-auto">
            <p className="text-lg text-black-300 leading-relaxed">
              CoderMeet is a vibrant community platform designed to connect developers, 
              foster collaboration, and accelerate learning through mentorship and shared projects. 
              We believe in the power of community to transform coding skills into real-world impact.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Offer</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-blue-400 mb-3">Skill Development</h3>
              <p className="text-gray-300 text-sm">
                Daily coding challenges, weekly contests, and personalized learning paths
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Mentorship</h3>
              <p className="text-gray-300 text-sm">
                Connect with experienced developers for guidance and career growth
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Project Collaboration</h3>
              <p className="text-gray-300 text-sm">
                Find collaborators and contribute to exciting projects
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-3">Recognition</h3>
              <p className="text-gray-300 text-sm">
                Earn badges and climb leaderboards
              </p>
            </div>
          </div>
        </section>

        {/* Daily Cash Prizes Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Daily Cash Prizes</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
          </div>
          <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <p className="text-lg text-gray-200 text-center mb-8">
              Compete in daily coding challenges and win real cash prizes! Top 3 performers 
              receive mobile card rewards every single day.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 p-6 rounded-xl border border-yellow-400/30 text-center">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-xl font-bold text-yellow-300 mb-1">1st Place</div>
                <div className="text-lg text-yellow-200 font-bold">500 ETB</div>
                <div className="text-sm text-yellow-300">Mobile Card</div>
              </div>
              <div className="bg-gradient-to-br from-gray-600/20 to-slate-600/20 p-6 rounded-xl border border-gray-400/30 text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="text-xl font-bold text-gray-300 mb-1">2nd Place</div>
                <div className="text-lg text-gray-200 font-bold">300 ETB</div>
                <div className="text-sm text-gray-300">Mobile Card</div>
              </div>
              <div className="bg-gradient-to-br from-orange-700/20 to-amber-700/20 p-6 rounded-xl border border-orange-400/30 text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="text-xl font-bold text-orange-300 mb-1">3rd Place</div>
                <div className="text-lg text-orange-200 font-bold">200 ETB</div>
                <div className="text-sm text-orange-300">Mobile Card</div>
              </div>
            </div>
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 bg-yellow-500/20 border border-yellow-400/30 rounded-full px-6 py-3">
                <span className="text-2xl">🎁</span>
                <span className="text-yellow-300 font-semibold">
                  Every day is a chance to win real cash prizes!
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Challenge Competition Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Weekly Challenge Competition</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
          </div>
          <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <p className="text-lg text-gray-200 text-center mb-8">
              Join our weekly coding competitions and compete with developers worldwide! 
              Build amazing projects, showcase your skills, and win recognition.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 p-6 rounded-xl border border-yellow-400/30 text-center">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-xl font-bold text-yellow-300 mb-1">Gold Winner</div>
                <div className="text-lg text-yellow-200 font-bold">5,000 ETB</div>
                <div className="text-sm text-yellow-300">Top Project</div>
              </div>
              <div className="bg-gradient-to-br from-gray-600/20 to-slate-600/20 p-6 rounded-xl border border-gray-400/30 text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="text-xl font-bold text-gray-300 mb-1">Silver Winner</div>
                <div className="text-lg text-gray-200 font-bold">3,000 ETB</div>
                <div className="text-sm text-gray-300">2nd Place</div>
              </div>
              <div className="bg-gradient-to-br from-orange-700/20 to-amber-700/20 p-6 rounded-xl border border-orange-400/30 text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="text-xl font-bold text-orange-300 mb-1">Bronze Winner</div>
                <div className="text-lg text-orange-200 font-bold">1,500 ETB</div>
                <div className="text-sm text-orange-300">3rd Place</div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Idea Competition Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Business Idea Competition</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
          </div>
          <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <p className="text-lg text-gray-200 text-center mb-8">
              Submit your innovative business ideas and get connected with investors and collaborators! 
              Top winners receive funding, mentorship, and support to transform their ideas 
              into real companies solving world problems.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-6 rounded-xl border border-purple-400/30 text-center">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-xl font-bold text-purple-300 mb-1">Gold Winner</div>
                <div className="text-lg text-purple-200 font-bold">Investor Funding</div>
                <div className="text-sm text-purple-300">Full Investment Package</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-6 rounded-xl border border-blue-400/30 text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="text-xl font-bold text-blue-300 mb-1">Silver Winner</div>
                <div className="text-lg text-blue-200 font-bold">Mentorship Program</div>
                <div className="text-sm text-blue-300">Expert Guidance</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 p-6 rounded-xl border border-green-400/30 text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="text-xl font-bold text-green-300 mb-1">Bronze Winner</div>
                <div className="text-lg text-green-200 font-bold">Collaboration Network</div>
                <div className="text-sm text-green-300">Team Building Support</div>
              </div>
            </div>
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 bg-purple-500/20 border border-purple-400/30 rounded-full px-6 py-3">
               
                <span className="text-purple-300 font-semibold">
                  Transform your idea into a real-world solution!
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 rounded-xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Join Our Community</h2>
            <p className="text-lg text-gray-300 mb-8">
              Whether you're a beginner looking to learn the basics or an experienced developer 
              wanting to share your knowledge, CoderMeet has something for everyone. 
              Join thousands of developers who are already part of our growing community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold transition duration-200 transform hover:-translate-y-0.5 hover:scale-105 shadow-lg hover:shadow-blue-500/40">
                <a href="/signup">Get Started</a>
              </button>
             
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
