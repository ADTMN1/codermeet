import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaUser,
  FaMapMarkerAlt,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaUserPlus,
  FaUserMinus,
  FaBriefcase,
  FaGraduationCap,
  FaCode,
  FaFilter,
  FaTimes,
  FaStar,
  FaProjectDiagram,
  FaHandshake,
  FaComments,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import { toast } from 'sonner';

interface Developer {
  _id: string;
  fullName: string;
  username: string;
  bio: string;
  skills: string[];
  location: string;
  availability: string;
  experience: string;
  hourlyRate?: number;
  isMentor: boolean;
  status: string;
  connectionsCount: number;
  projectsCount: number;
  avatar?: string;
  github?: string;
  linkedin?: string;
  email?: string;
  connections?: string[];
}

interface Filters {
  search: string;
  skills: string[];
  location: string;
  availability: string;
  experience: string;
  minRate: string;
  maxRate: string;
  isMentor: boolean;
  status: string;
}

const Developers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    skills: [],
    location: '',
    availability: '',
    experience: '',
    minRate: '',
    maxRate: '',
    isMentor: false,
    status: ''
  });
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [messagePopup, setMessagePopup] = useState<{ developer: Developer; isOpen: boolean }>({
    developer: {} as Developer,
    isOpen: false
  });
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDevelopers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching developers:', error);
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  };

  // Professional toast helper functions
  const showSuccessToast = (message: string) => {
    toast.success(
      <div className="flex items-center gap-3">
        <FaCheckCircle className="w-5 h-5 text-green-400" />
        <div>
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>,
      {
        duration: 4000,
        style: {
          background: 'linear-gradient(to right, #10b981, #059669)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
        }
      }
    );
  };

  const showErrorToast = (message: string) => {
    toast.error(
      <div className="flex items-center gap-3">
        <FaExclamationTriangle className="w-5 h-5 text-red-400" />
        <div>
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>,
      {
        duration: 4000,
        style: {
          background: 'linear-gradient(to right, #dc2626, #b91c1c)',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
        }
      }
    );
  };

  const showInfoToast = (message: string) => {
    toast.info(
      <div className="flex items-center gap-3">
        <FaInfoCircle className="w-5 h-5 text-blue-400" />
        <div>
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>,
      {
        duration: 4000,
        style: {
          background: 'linear-gradient(to right, #0891b2, #0e7490)',
          border: '1px solid #0891b2',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(8, 145, 178, 0.15)',
        }
      }
    );
  };

  const handleConnect = async (developerId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setConnecting(developerId);
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/connect/${developerId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the developers list to reflect the connection
        setDevelopers(prev => prev.map(dev => {
          if (dev._id === developerId) {
            const isConnected = response.data.data.isConnected;
            return {
              ...dev,
              connections: isConnected 
                ? [...(dev.connections || []), user._id || ''].filter(Boolean)
                : (dev.connections || []).filter(id => id !== user._id),
              connectionsCount: isConnected 
                ? dev.connectionsCount + 1 
                : dev.connectionsCount - 1
            };
          }
          return dev;
        }));
        
        showSuccessToast(
          response.data.data.isConnected 
            ? `Connected with ${response.data.data.fullName || 'developer'} successfully!`
            : `Disconnected from ${response.data.data.fullName || 'developer'}`
        );
      }
    } catch (error) {
      console.error('Error connecting to developer:', error);
      showErrorToast('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const handleMessage = (developer: Developer) => {
    setMessagePopup({ developer, isOpen: true });
    setMessageText('');
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user) return;

    try {
      setSendingMessage(true);
      
      // Send message to backend API
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/message/${messagePopup.developer._id}`,
        {
          message: messageText.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      // Send message and show success toast
      showSuccessToast(`Message sent to ${messagePopup.developer.fullName} successfully!`);
      setMessagePopup({ developer: {} as Developer, isOpen: false });
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      skills: [],
      location: '',
      availability: '',
      experience: '',
      minRate: '',
      maxRate: '',
      isMentor: false,
      status: ''
    });
  };

  const filteredAndSortedDevelopers = developers
    .filter(developer => {
      // Search filter
      if (filters.search && !developer.fullName.toLowerCase().includes(filters.search.toLowerCase()) &&
          !developer.username.toLowerCase().includes(filters.search.toLowerCase()) &&
          !developer.bio.toLowerCase().includes(filters.search.toLowerCase()) &&
          !developer.skills.some(skill => skill.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }

      // Skills filter
      if (filters.skills.length > 0 && !filters.skills.some(skill => developer.skills.includes(skill))) {
        return false;
      }

      // Location filter
      if (filters.location && !developer.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Availability filter
      if (filters.availability && developer.availability !== filters.availability) {
        return false;
      }

      // Experience filter
      if (filters.experience && developer.experience !== filters.experience) {
        return false;
      }

      // Rate filter
      if (filters.minRate && (!developer.hourlyRate || developer.hourlyRate < parseInt(filters.minRate))) {
        return false;
      }
      if (filters.maxRate && (!developer.hourlyRate || developer.hourlyRate > parseInt(filters.maxRate))) {
        return false;
      }

      // Mentor filter
      if (filters.isMentor && !developer.isMentor) {
        return false;
      }

      // Status filter
      if (filters.status && developer.status !== filters.status) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'skills':
          return b.skills.length - a.skills.length;
        case 'projects':
          return b.projectsCount - a.projectsCount;
        case 'connections':
          return b.connectionsCount - a.connectionsCount;
        case 'recent':
        default:
          return 0; // Keep original order (most recent first)
      }
    });

  const allSkills = [...new Set(developers.flatMap(dev => dev.skills))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading developers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white mb-2">Find Developers</h1>
          <p className="text-gray-400">Connect with talented developers in our community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search developers by name, username, skills, or bio..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <FaFilter />
              Filters
              {Object.values(filters).some(v => v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)) && (
                <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1">
                  {Object.values(filters).filter(v => v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)).length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.slice(0, 8).map(skill => (
                      <button
                        key={skill}
                        onClick={() => {
                          if (filters.skills.includes(skill)) {
                            updateFilter('skills', filters.skills.filter(s => s !== skill));
                          } else {
                            updateFilter('skills', [...filters.skills, skill]);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-sm transition ${
                          filters.skills.includes(skill)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => updateFilter('availability', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience</label>
                  <select
                    value={filters.experience}
                    onChange={(e) => updateFilter('experience', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Hourly Rate ($)</label>
                  <input
                    type="number"
                    placeholder="Min rate"
                    value={filters.minRate}
                    onChange={(e) => updateFilter('minRate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Hourly Rate ($)</label>
                  <input
                    type="number"
                    placeholder="Max rate"
                    value={filters.maxRate}
                    onChange={(e) => updateFilter('maxRate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isMentor}
                      onChange={(e) => updateFilter('isMentor', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Mentors only</span>
                  </label>
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition flex items-center gap-2"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="skills">Skills Count</option>
              <option value="projects">Projects Count</option>
              <option value="connections">Connections Count</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {developers.length} developers
          </p>
        </div>

        {/* Developers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDevelopers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaUser className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No developers found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredAndSortedDevelopers.map((developer) => {
              const isConnected = developer.connections?.includes(user?._id || '');
              
              return (
                <div key={developer._id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 p-6 border-b border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {developer.avatar ? (
                            <img
                              src={developer.avatar}
                              alt={developer.fullName}
                              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">
                                {developer.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
                            developer.status === 'online' ? 'bg-green-500' :
                            developer.status === 'away' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{developer.fullName}</h3>
                          <p className="text-purple-300">@{developer.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              developer.availability === 'available' ? 'bg-green-500/20 text-green-300' :
                              developer.availability === 'busy' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {developer.availability}
                            </span>
                            {developer.isMentor && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                Mentor
                              </span>
                            )}
                            {!developer.isMentor && (
                              <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                                Developer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Bio */}
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm leading-relaxed" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.5rem' // Ensures consistent height
                      }}>
                        {developer.bio || 'No bio available'}
                      </p>
                      {developer.bio && developer.bio.length > 100 && (
                        <p className="text-gray-400 text-xs mt-1">...</p>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        {developer.location || 'Remote'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FaBriefcase className="w-4 h-4" />
                        {developer.experience || 'Experience not specified'}
                      </div>
                      {developer.hourlyRate && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-green-400 font-semibold">
                            ${developer.hourlyRate}/hour
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaProjectDiagram className="w-4 h-4" />
                          {developer.projectsCount || 0} projects
                        </span>
                        <span className="flex items-center gap-1">
                          <FaHandshake className="w-4 h-4" />
                          {developer.connectionsCount || 0} connections
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {(developer.skills || []).slice(0, 4).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg whitespace-nowrap"
                          >
                            {skill}
                          </span>
                        ))}
                        {(developer.skills || []).length > 4 && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-lg whitespace-nowrap">
                            +{(developer.skills || []).length - 4}
                          </span>
                        )}
                        {(!developer.skills || developer.skills.length === 0) && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-lg">
                            No skills listed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-end">
                      <button
                        onClick={() => handleConnect(developer._id)}
                        disabled={connecting === developer._id}
                        className={`w-24 px-4 py-2 rounded-lg transition font-medium text-sm flex items-center justify-center ${
                          isConnected
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        } ${connecting === developer._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {connecting === developer._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-1">...</span>
                          </>
                        ) : isConnected ? (
                          <>
                            <FaUserMinus />
                            <span className="ml-1">✓</span>
                          </>
                        ) : (
                          <>
                            <FaUserPlus />
                            <span className="ml-1">+</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleMessage(developer)}
                        className="w-10 h-10 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center"
                      >
                        <FaComments />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Popup Modal */}
      {messagePopup.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {messagePopup.developer.avatar ? (
                  <img
                    src={messagePopup.developer.avatar}
                    alt={messagePopup.developer.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {messagePopup.developer.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold">{messagePopup.developer.fullName}</h3>
                  <p className="text-gray-400 text-sm">@{messagePopup.developer.username}</p>
                </div>
              </div>
              <button
                onClick={() => setMessagePopup({ developer: {} as Developer, isOpen: false })}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Message Input */}
            <div className="mb-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setMessagePopup({ developer: {} as Developer, isOpen: false })}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || sendingMessage}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Developers;
