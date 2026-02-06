import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCalendar, FaClock, FaArrowLeft } from 'react-icons/fa';

interface Mentor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  expertise: string[];
  rating: number;
  available: boolean;
}

const Mentorship: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Mock mentors data
  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'ExpertDev',
      username: '@expertdev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expertdev',
      expertise: ['JavaScript', 'React', 'Node.js'],
      rating: 4.8,
      available: true
    },
    {
      id: '2',
      name: 'ReactGuru',
      username: '@reactguru',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reactguru',
      expertise: ['React', 'TypeScript', 'Next.js'],
      rating: 4.9,
      available: true
    },
    {
      id: '3',
      name: 'NodeMaster',
      username: '@nodemaster',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nodemaster',
      expertise: ['Node.js', 'MongoDB', 'API Design'],
      rating: 4.7,
      available: false
    }
  ];

  const topics = [
    'JavaScript Debugging',
    'React Performance Optimization',
    'Node.js Best Practices',
    'API Design & Architecture',
    'Database Optimization',
    'Code Review & Best Practices',
    'Career Guidance',
    'Project Planning'
  ];

  const handleBookSession = async () => {
    if (!selectedMentor || !selectedTopic || !selectedDate || !selectedTime) {
      alert('Please fill all fields');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/mentorship/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: selectedTopic,
          mentorId: selectedMentor.id,
          preferredTime: `${selectedDate}T${selectedTime}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Session booked successfully!');
        navigate('/dashboard');
      } else {
        alert('Failed to book session: ' + data.message);
      }
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-800 transition"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-purple-400">Book a Mentorship Session</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mentors List */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Available Mentors</h2>
            <div className="space-y-4">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedMentor?.id === mentor.id
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  } ${!mentor.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => mentor.available && setSelectedMentor(mentor)}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{mentor.name}</h3>
                        <span className="text-gray-400 text-sm">{mentor.username}</span>
                        {!mentor.available && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Unavailable</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mentor.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-gray-400 text-sm">{mentor.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">Session Details</h2>
            
            {selectedMentor ? (
              <div className="space-y-6">
                {/* Selected Mentor */}
                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <img
                    src={selectedMentor.avatar}
                    alt={selectedMentor.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-white">{selectedMentor.name}</p>
                    <p className="text-gray-400 text-sm">{selectedMentor.username}</p>
                  </div>
                </div>

                {/* Topic Selection */}
                <div>
                  <label className="block text-gray-300 mb-2">Session Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-gray-300 mb-2">Time</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select a time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBookSession}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Book Session
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaUser className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Please select a mentor to continue</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentorship;
