import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaCalendar, 
  FaClock, 
  FaArrowLeft, 
  FaCode, 
  FaStar, 
  FaCheckCircle, 
  FaTimes, 
  FaVideo, 
  FaComment, 
  FaChartLine, 
  FaFilter, 
  FaSearch,
  FaTrophy,
  FaFire,
  FaRocket,
  FaLightbulb,
  FaAward,
  FaMedal,
  FaGem,
  FaCrown,
  FaShieldAlt,
  FaUsers,
  FaBook,
  FaGraduationCap,
  FaCertificate,
  FaHandshake,
  FaComments,
  FaChartBar,
  FaBell,
  FaCog,
  FaHeart,
  FaThumbsUp,
  FaEye,
  FaClock as FaTime,
  FaMapMarkerAlt,
  FaLanguage,
  FaBriefcase,
  FaUniversity,
  FaGithub,
  FaLinkedin,
  FaTwitter
} from 'react-icons/fa';
import axios from 'axios';

interface Mentor {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  bio: string;
  expertise: string[];
  experience: {
    years: number;
    level: string;
    company?: string;
    position: string;
  };
  pricing: {
    hourlyRate: number;
    currency: string;
    sessionTypes: Array<{
      type: string;
      duration: number;
      price: number;
    }>;
  };
  stats: {
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
    totalRatings: number;
  };
  verification: {
    isVerified: boolean;
  };
  availability: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    availableDays: string[];
  };
}

interface MentorshipSession {
  _id: string;
  mentee: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  mentor: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  topic: string;
  description: string;
  scheduledTime: string;
  duration: number;
  status: string;
  sessionType: string;
  meetingLink?: string;
  payment: {
    status: string;
    amount: number;
  };
  rating?: {
    menteeRating?: number;
    menteeFeedback?: string;
    mentorRating?: number;
    mentorFeedback?: string;
  };
}

interface MentorshipStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  upcomingSessions: number;
  isMentor: boolean;
  mentorProfile?: {
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
    totalRatings: number;
  };
}

const MentorshipDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [upcomingSession, setUpcomingSession] = useState<MentorshipSession | null>(null);
  const [userSessions, setUserSessions] = useState<MentorshipSession[]>([]);
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'discover' | 'records'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Advanced animation states
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [animatedStats, setAnimatedStats] = useState(false);

  // Mock mentors data (for demo purposes, will be replaced with API data)
  const mockMentors: Mentor[] = [
    {
      _id: '1',
      user: {
        _id: '1',
        name: 'ExpertDev',
        username: '@expertdev',
        email: 'expert@codermeet.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expertdev'
      },
      bio: 'Experienced full-stack developer with 10+ years in JavaScript and React',
      expertise: ['JavaScript', 'React', 'Node.js'],
      experience: {
        years: 10,
        level: 'senior',
        company: 'Tech Corp',
        position: 'Senior Full Stack Developer'
      },
      pricing: {
        hourlyRate: 50,
        currency: 'USD',
        sessionTypes: [
          { type: 'video_call', duration: 60, price: 50 },
          { type: 'code_review', duration: 45, price: 40 }
        ]
      },
      stats: {
        totalSessions: 150,
        completedSessions: 145,
        averageRating: 4.8,
        totalRatings: 120
      },
      verification: {
        isVerified: true
      },
      availability: {
        timezone: 'UTC',
        workingHours: { start: '09:00', end: '17:00' },
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    },
    {
      _id: '2',
      user: {
        _id: '2',
        name: 'ReactGuru',
        username: '@reactguru',
        email: 'react@codermeet.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reactguru'
      },
      bio: 'React specialist focused on performance optimization and best practices',
      expertise: ['React', 'TypeScript', 'Next.js'],
      experience: {
        years: 8,
        level: 'senior',
        company: 'Startup Inc',
        position: 'React Lead Developer'
      },
      pricing: {
        hourlyRate: 60,
        currency: 'USD',
        sessionTypes: [
          { type: 'video_call', duration: 60, price: 60 },
          { type: 'career_guidance', duration: 30, price: 30 }
        ]
      },
      stats: {
        totalSessions: 200,
        completedSessions: 195,
        averageRating: 4.9,
        totalRatings: 180
      },
      verification: {
        isVerified: true
      },
      availability: {
        timezone: 'UTC',
        workingHours: { start: '10:00', end: '18:00' },
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    },
    {
      _id: '3',
      user: {
        _id: '3',
        name: 'NodeMaster',
        username: '@nodemaster',
        email: 'node@codermeet.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nodemaster'
      },
      bio: 'Backend architect specializing in Node.js and microservices',
      expertise: ['Node.js', 'MongoDB', 'API Design'],
      experience: {
        years: 12,
        level: 'principal',
        company: 'Enterprise Tech',
        position: 'Principal Backend Engineer'
      },
      pricing: {
        hourlyRate: 70,
        currency: 'USD',
        sessionTypes: [
          { type: 'video_call', duration: 60, price: 70 },
          { type: 'code_review', duration: 60, price: 70 }
        ]
      },
      stats: {
        totalSessions: 100,
        completedSessions: 98,
        averageRating: 4.7,
        totalRatings: 85
      },
      verification: {
        isVerified: true
      },
      availability: {
        timezone: 'UTC',
        workingHours: { start: '09:00', end: '17:00' },
        availableDays: ['monday', 'wednesday', 'friday']
      }
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

  React.useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      // Initialize with empty arrays to prevent filter errors
      setUserSessions([]);
      setAvailableMentors(mockMentors);
      
      const [upcomingRes, sessionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/mentorship/upcoming`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching upcoming session:', err);
          return { data: { success: false, data: null } };
        }),
        axios.get(`${API_BASE_URL}/api/mentorship/sessions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching user sessions:', err);
          return { data: { success: false, data: { sessions: [] } } };
        })
      ]);

      if (upcomingRes.data.success) {
        setUpcomingSession(upcomingRes.data.data);
      } else {
        // Set mock upcoming session for demo
        setUpcomingSession({
          _id: 'demo-1',
          mentee: {
            _id: 'user-1',
            name: 'Demo User',
            username: '@demo',
            email: 'demo@example.com'
          },
          mentor: {
            _id: 'mentor-1',
            name: 'ExpertDev',
            username: '@expertdev',
            email: 'expert@example.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expertdev'
          },
          topic: 'JavaScript Debugging',
          description: 'Learn advanced debugging techniques',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          status: 'scheduled',
          sessionType: 'video_call',
          payment: {
            status: 'pending',
            amount: 50
          }
        });
      }
      
      if (sessionsRes.data.success) {
        // Handle both direct array and nested data structure
        const sessionsData = sessionsRes.data.data;
        if (Array.isArray(sessionsData)) {
          setUserSessions(sessionsData);
        } else if (sessionsData && sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
          setUserSessions(sessionsData.sessions);
        } else {
          setUserSessions([]);
        }
      } else {
        // Set mock sessions for demo
        setUserSessions([
          {
            _id: 'demo-1',
            mentee: {
              _id: 'user-1',
              name: 'Demo User',
              username: '@demo',
              email: 'demo@example.com'
            },
            mentor: {
              _id: 'mentor-1',
              name: 'ExpertDev',
              username: '@expertdev',
              email: 'expert@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=expertdev'
            },
            topic: 'JavaScript Debugging',
            description: 'Learn advanced debugging techniques',
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            status: 'scheduled',
            sessionType: 'video_call',
            payment: {
              status: 'pending',
              amount: 50
            }
          },
          {
            _id: 'demo-2',
            mentee: {
              _id: 'user-1',
              name: 'Demo User',
              username: '@demo',
              email: 'demo@example.com'
            },
            mentor: {
              _id: 'mentor-2',
              name: 'ReactGuru',
              username: '@reactguru',
              email: 'react@example.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reactguru'
            },
            topic: 'React Performance',
            description: 'Optimize React applications',
            scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            status: 'completed',
            sessionType: 'video_call',
            payment: {
              status: 'paid',
              amount: 60
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
      // Set fallback data
      setUserSessions([]);
      setAvailableMentors(mockMentors);
      setUpcomingSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedMentor || !selectedTopic || !selectedDate || !selectedTime) {
      alert('Please fill all fields');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.post(`${API_BASE_URL}/api/mentorship/book`, {
        mentorId: selectedMentor.user._id,
        topic: selectedTopic,
        description: `Session on ${selectedTopic}`,
        scheduledTime: `${selectedDate}T${selectedTime}`,
        duration: 60,
        sessionType: 'video_call'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert('Session booked successfully!');
        // Reset form
        setSelectedMentor(null);
        setSelectedTopic('');
        setSelectedDate('');
        setSelectedTime('');
        // Refresh data
        fetchMentorshipData();
      } else {
        alert('Failed to book session: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please try again.');
    }
  };

  const handleJoinSession = (sessionTitle: string, mentorName: string) => {
    // Generate professional room name
    const roomName = `codermeet-${mentorName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Create Jitsi Meet URL with professional settings
    const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=true`;
    
    // Open in new window with professional settings
    const meetingWindow = window.open(
      jitsiUrl,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    // Focus on the new window
    if (meetingWindow) {
      meetingWindow.focus();
    }
    
    // Show success message
    alert(`Joining "${sessionTitle}" session with ${mentorName}\n\nMeeting room: ${roomName}\n\nThe meeting will open in a new window.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-purple-500/20 transition-all duration-300 group"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <FaGraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Mentorship
                  </h1>
                  <p className="text-xs text-gray-400">Professional Learning Platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Header content can go here if needed */}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartBar },
              { id: 'discover', label: 'Discover Mentors', icon: FaSearch },
              { id: 'records', label: 'Records', icon: FaVideo }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeView === tab.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FaCalendar,
                  label: 'Total Sessions',
                  value: userSessions.length.toString(),
                  color: 'from-blue-500 to-cyan-500',
                  bgColor: 'bg-blue-500/10',
                  borderColor: 'border-blue-500/30'
                },
                {
                  icon: FaCheckCircle,
                  label: 'Completed',
                  value: userSessions.filter(s => s.status === 'completed').length.toString(),
                  color: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-500/10',
                  borderColor: 'border-green-500/30'
                },
                {
                  icon: FaClock,
                  label: 'Upcoming',
                  value: userSessions.filter(s => s.status === 'scheduled').length.toString(),
                  color: 'from-purple-500 to-pink-500',
                  bgColor: 'bg-purple-500/10',
                  borderColor: 'border-purple-500/30'
                },
                {
                  icon: FaStar,
                  label: 'Avg Rating',
                  value: '4.8',
                  color: 'from-yellow-500 to-orange-500',
                  bgColor: 'bg-yellow-500/10',
                  borderColor: 'border-yellow-500/30'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    <div className={`relative bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border ${stat.borderColor} hover:border-purple-500/50 transition-all duration-300`}>
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: FaSearch,
                  title: 'Find Mentors',
                  description: 'Discover expert mentors in your field',
                  color: 'from-purple-500 to-blue-500',
                  action: () => setActiveView('discover')
                },
                {
                  icon: FaCalendar,
                  title: 'Schedule Session',
                  description: 'Book your next mentorship session',
                  color: 'from-green-500 to-emerald-500',
                  action: () => setActiveView('discover')
                },
                {
                  icon: FaChartBar,
                  title: 'View Records',
                  description: 'Track your learning journey',
                  color: 'from-orange-500 to-red-500',
                  action: () => setActiveView('sessions')
                }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="group relative overflow-hidden bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 text-left hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-white mb-2">{action.title}</h4>
                      <p className="text-gray-400 text-sm">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Records View */}
        {activeView === 'records' && (
          <div className="space-y-8">
            {/* Records Section */}
            <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <FaVideo className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Session Records</h2>
                  <p className="text-orange-300">Watch past mentorship sessions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Record Card 1 */}
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-orange-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      RECORDED
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">Advanced React Patterns</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=reactmaster"
                        alt="React Master"
                        className="w-8 h-8 rounded-full border-2 border-orange-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">React Master</p>
                        <p className="text-gray-400 text-xs">@reactmaster</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-orange-400" />
                        <span>524 attended</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-orange-400" />
                        <span>2 hours ago</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 text-sm">
                      Watch Recording
                    </button>
                  </div>
                </div>

                {/* Record Card 2 */}
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-orange-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-green-600 to-teal-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      RECORDED
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">Node.js Best Practices</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=nodeguru"
                        alt="Node Guru"
                        className="w-8 h-8 rounded-full border-2 border-orange-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">Node Guru</p>
                        <p className="text-gray-400 text-xs">@nodeguru</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-orange-400" />
                        <span>342 attended</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-orange-400" />
                        <span>1 day ago</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 text-sm">
                      Watch Recording
                    </button>
                  </div>
                </div>

                {/* Record Card 3 */}
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-orange-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-orange-600 to-red-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      RECORDED
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">TypeScript Advanced Tips</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=tsexpert"
                        alt="TS Expert"
                        className="w-8 h-8 rounded-full border-2 border-orange-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">TS Expert</p>
                        <p className="text-gray-400 text-xs">@tsexpert</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-orange-400" />
                        <span>892 attended</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-orange-400" />
                        <span>3 days ago</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 text-sm">
                      Watch Recording
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discover Mentors View */}
        {activeView === 'discover' && (
          <div className="space-y-8">
            {/* Available Sessions Section */}
            <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FaVideo className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Available Sessions</h2>
                  <p className="text-purple-300">Join video sessions with expert developers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Available Session Card 1 */}
                <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">Advanced React Patterns</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=reactmaster"
                        alt="React Master"
                        className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">React Master</p>
                        <p className="text-gray-400 text-xs">@reactmaster</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaCalendar className="text-purple-400" />
                        <span>24 feb 2026</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-purple-400" />
                        <span>45 min</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoinSession("Advanced React Patterns", "React Master")}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 text-sm"
                    >
                      Join Session
                    </button>
                  </div>
                </div>

                {/* Guest Profile Container */}
                <div className="md:col-span-2 lg:col-span-2 bg-gray-800/80 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Guest Profile</h2>
                      <p className="text-purple-300">Learn more about your mentor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=reactmaster"
                        alt="React Master"
                        className="w-20 h-20 rounded-full border-4 border-purple-500/50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-white font-semibold text-lg">React Master</p>
                          <p className="text-gray-400 text-sm">@reactmaster</p>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">
                          Senior React developer with 10+ years experience. Passionate about teaching modern React patterns and performance optimization. Love helping developers level up their skills.
                        </p>
                        <div className="flex items-center gap-3">
                          <a href="https://github.com/reactmaster" className="text-gray-400 hover:text-white transition-colors">
                            <FaGithub className="w-5 h-5" />
                          </a>
                          <a href="https://linkedin.com/in/reactmaster" className="text-gray-400 hover:text-white transition-colors">
                            <FaLinkedin className="w-5 h-5" />
                          </a>
                          <a href="https://twitter.com/reactmaster" className="text-gray-400 hover:text-white transition-colors">
                            <FaTwitter className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <FaStar className="text-yellow-400" />
                          Expertise
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• React.js & Next.js</li>
                          <li>• Performance Optimization</li>
                          <li>• Component Architecture</li>
                          <li>• Modern Hooks & Patterns</li>
                        </ul>
                      </div>

                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <FaTrophy className="text-orange-400" />
                          Achievements
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          <li>• 500+ Sessions Completed</li>
                          <li>• 4.9/5 Average Rating</li>
                          <li>• React Contributor</li>
                          <li>• Tech Speaker</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Session Card 2 */}
                {/* <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-green-600 to-teal-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">Node.js Performance Tips</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=nodeguru"
                        alt="Node Guru"
                        className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">Node Guru</p>
                        <p className="text-gray-400 text-xs">@nodeguru</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-purple-400" />
                        <span>89 participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-purple-400" />
                        <span>60 min</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoinSession("Node.js Performance Tips", "Node Guru")}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 text-sm"
                    >
                      Join Session
                    </button>
                  </div>
                </div> */}

                {/* Available Session Card 3 */}
                {/* <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden group">
                  <div className="h-32 bg-gradient-to-r from-orange-600 to-red-600 relative">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="w-12 h-12 text-white/50" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base mb-2">TypeScript Mastery</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=tsexpert"
                        alt="TS Expert"
                        className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">TS Expert</p>
                        <p className="text-gray-400 text-xs">@tsexpert</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-purple-400" />
                        <span>156 participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="text-purple-400" />
                        <span>30 min</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoinSession("TypeScript Mastery", "TS Expert")}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 text-sm"
                    >
                      Join Session
                    </button>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MentorshipDashboard;
