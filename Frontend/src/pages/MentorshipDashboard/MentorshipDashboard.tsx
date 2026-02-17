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

interface SessionRecording {
  _id: string;
  title: string;
  description: string;
  mentor: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  mentee: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  recordingUrl: string;
  scheduledTime: string;
  duration: number;
  sessionType: string;
  rating?: {
    menteeRating?: number;
    menteeFeedback?: string;
    mentorRating?: number;
    mentorFeedback?: string;
  };
  createdAt: string;
  updatedAt: string;
  attendees: number;
  thumbnailUrl: string;
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
  const [sessionRecordings, setSessionRecordings] = useState<SessionRecording[]>([]);
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
      setAvailableMentors([]);
      setSessionRecordings([]);
      
      const [upcomingRes, sessionsRes, mentorsRes, recordingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/mentorship/upcoming`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching upcoming session:', err);
          return { data: { success: false, data: null } };
        }),
        axios.get(`${API_BASE_URL}/mentorship/sessions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching user sessions:', err);
          return { data: { success: false, data: { sessions: [] } } };
        }),
        axios.get(`${API_BASE_URL}/mentorship/mentors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching available mentors:', err);
          return { data: { success: false, data: { mentors: [] } } };
        }),
        axios.get(`${API_BASE_URL}/mentorship/recordings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Error fetching session recordings:', err);
          return { data: { success: false, data: { recordings: [] } } };
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
      
      if (mentorsRes.data.success) {
        const mentorsData = mentorsRes.data.data;
        if (mentorsData && mentorsData.mentors && Array.isArray(mentorsData.mentors)) {
          setAvailableMentors(mentorsData.mentors);
        } else if (Array.isArray(mentorsData)) {
          setAvailableMentors(mentorsData);
        } else {
          setAvailableMentors([]);
        }
      } else {
        // Set fallback mentors for demo
        setAvailableMentors(mockMentors);
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

      if (recordingsRes.data.success) {
        const recordingsData = recordingsRes.data.data;
        if (recordingsData && recordingsData.recordings && Array.isArray(recordingsData.recordings)) {
          setSessionRecordings(recordingsData.recordings);
        } else {
          setSessionRecordings([]);
        }
      } else {
        // Set empty recordings array if API fails
        setSessionRecordings([]);
      }
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
      // Set fallback data
      setUserSessions([]);
      setAvailableMentors([]);
      setSessionRecordings([]);
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

  const handleWatchRecording = (recordingUrl: string, title: string) => {
    if (recordingUrl && recordingUrl !== '#') {
      window.open(recordingUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } else {
      alert(`Recording for "${title}" is not available yet. Please check back later.`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="relative bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
             
              <div className="flex items-center gap-3">
               
                <div>
                  <h1 className="text-xl font-bold text-white">
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


       {/* Tab Navigation */}
            <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview', icon: FaChartBar },
              { id: 'discover', label: 'Discover Mentors', icon: FaSearch },
              { id: 'records', label: 'Records', icon: FaVideo }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeView === tab.id
                          ? 'border-purple-400 text-purple-400 bg-gray-700/50'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
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
                <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <FaVideo className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Session Records</h2>
                  <p className="text-orange-300">Watch past mentorship sessions</p>
                </div>
              </div>

              {sessionRecordings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessionRecordings.map((recording) => (
                    <div key={recording._id} className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-orange-500/30 overflow-hidden group">
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
                        <h3 className="font-bold text-white text-base mb-2">{recording.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <img
                            src={recording.mentor.avatar || recording.thumbnailUrl}
                            alt={recording.mentor.name}
                            className="w-8 h-8 rounded-full border-2 border-orange-500/50"
                          />
                          <div>
                            <p className="text-white font-medium text-sm">{recording.mentor.name}</p>
                            <p className="text-gray-400 text-xs">@{recording.mentor.username}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <FaUsers className="text-orange-400" />
                            <span>{recording.attendees} attended</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClock className="text-orange-400" />
                            <span>{formatTimeAgo(recording.updatedAt)}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleWatchRecording(recording.recordingUrl, recording.title)}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 text-sm"
                        >
                          Watch Recording
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaVideo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Session Records</h3>
                  <p className="text-gray-500 text-sm">
                    You don't have any recorded mentorship sessions yet. Complete a session to see its recording here.
                  </p>
                  <button 
                    onClick={() => setActiveView('discover')}
                    className="mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                  >
                    Find Mentors
                  </button>
                </div>
              )}
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
                {availableMentors.length > 0 ? (
                  availableMentors.slice(0, 3).map((mentor, index) => (
                    <div key={mentor._id} className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-purple-500/30 overflow-hidden group">
                      <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600 relative">
                        <div className="absolute inset-0 bg-black/30"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FaVideo className="w-12 h-12 text-white/50" />
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-bold text-white text-base mb-2">{mentor.expertise?.[0] || 'Programming Session'}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <img
                            src={mentor.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.user.username}`}
                            alt={mentor.user.name}
                            className="w-8 h-8 rounded-full border-2 border-purple-500/50"
                          />
                          <div>
                            <p className="text-white font-medium text-sm">{mentor.user.name}</p>
                            <p className="text-gray-400 text-xs">@{mentor.user.username}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <FaCalendar className="text-purple-400" />
                            <span>Available Now</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClock className="text-purple-400" />
                            <span>60 min</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleJoinSession(mentor.expertise?.[0] || 'Session', mentor.user.name)}
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 text-sm"
                        >
                          Join Session
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <FaVideo className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Available Sessions</h3>
                    <p className="text-gray-500">Check back later for available mentorship sessions</p>
                  </div>
                )}

                {/* Guest Profile Container */}
                {availableMentors.length > 0 && (
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
                          src={availableMentors[0].user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${availableMentors[0].user.username}`}
                          alt={availableMentors[0].user.name}
                          className="w-20 h-20 rounded-full border-4 border-purple-500/50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-semibold text-lg">{availableMentors[0].user.name}</p>
                            <p className="text-gray-400 text-sm">@{availableMentors[0].user.username}</p>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-3">
                            {availableMentors[0].bio || 'Experienced mentor passionate about helping developers grow their skills and advance their careers.'}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm">
                              {availableMentors[0].user.email}
                            </span>
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
                            {availableMentors[0].expertise.map((skill, index) => (
                              <li key={index}>• {skill}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <FaTrophy className="text-orange-400" />
                            Experience
                          </h4>
                          <ul className="space-y-1 text-sm text-gray-300">
                            <li>• {availableMentors[0].experience.years} years of experience</li>
                            <li>• {availableMentors[0].experience.level} level</li>
                            {availableMentors[0].experience.company && (
                              <li>• Works at {availableMentors[0].experience.company}</li>
                            )}
                            <li>• {availableMentors[0].experience.position}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
