import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCode,
  FaExternalLinkAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaEye,
  FaTrophy,
  FaSpinner,
  FaArrowLeft,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaGithub,
  FaFolderOpen,
  FaRocket
} from 'react-icons/fa';

interface Project {
  _id: string;
  title: string;
  description: string;
  githubUrl: string;
  liveUrl?: string;
  technologies: string[];
  status: 'completed' | 'in-progress' | 'planned';
  submittedAt: string;
  updatedAt: string;
  challengeSource: 'weekly' | 'daily' | 'business-competition' | 'personal' | 'mentorship';
  challenge?: {
    _id: string;
    title: string;
    category: string;
    difficulty: string;
    type: 'weekly' | 'daily' | 'business-competition';
  };
  score?: number;
  feedback?: string;
  featured?: boolean;
}

const ViewProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUserProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, statusFilter, sourceFilter, searchTerm]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Fetch actual user projects from backend
      const response = await fetch(`${API_BASE_URL}/users/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(project => project.challengeSource === sourceFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'planned': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="w-4 h-4" />;
      case 'in-progress': return <FaSpinner className="w-4 h-4" />;
      case 'planned': return <FaClock className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'planned': return 'Planned';
      default: return status;
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const completedCount = projects.filter(p => p.status === 'completed').length;
  const inProgressCount = projects.filter(p => p.status === 'in-progress').length;
  const plannedCount = projects.filter(p => p.status === 'planned').length;
  const weeklyCount = projects.filter(p => p.challengeSource === 'weekly').length;
  const dailyCount = projects.filter(p => p.challengeSource === 'daily').length;
  const businessCount = projects.filter(p => p.challengeSource === 'business-competition').length;
  const averageScore = projects
    .filter(p => p.score !== undefined)
    .reduce((acc, p) => acc + (p.score || 0), 0) / 
    projects.filter(p => p.score !== undefined).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <FaSpinner className="animate-spin text-purple-400 w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <FaFolderOpen className="text-purple-400 w-6 h-6" />
                <h1 className="text-xl font-bold text-white">My Projects</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{projects.length}</p>
                <p className="text-sm text-gray-400">Total Projects</p>
              </div>
              <FaFolderOpen className="text-purple-400 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-400">{completedCount}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
              <FaCheckCircle className="text-green-400 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
              <FaSpinner className="text-blue-400 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {averageScore > 0 ? Math.round(averageScore) : '-'}
                </p>
                <p className="text-sm text-gray-400">Avg Score</p>
              </div>
              <FaTrophy className="text-purple-400 w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Challenge Source Stats */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Projects by Challenge Source</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{weeklyCount}</p>
              <p className="text-sm text-gray-400">Weekly Challenges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{dailyCount}</p>
              <p className="text-sm text-gray-400">Daily Challenges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{businessCount}</p>
              <p className="text-sm text-gray-400">Business Competition</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">
                {projects.filter(p => p.challengeSource === 'personal').length}
              </p>
              <p className="text-sm text-gray-400">Personal Projects</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="planned">Planned</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Sources</option>
                <option value="weekly">Weekly Challenges</option>
                <option value="daily">Daily Challenges</option>
                <option value="business-competition">Business Competition</option>
                <option value="personal">Personal Projects</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-gray-800 p-12 rounded-xl border border-gray-700 text-center">
            <FaFolderOpen className="text-gray-500 w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">
              {projects.length === 0 
                ? "You haven't created any projects yet." 
                : "No projects match your current filters."
              }
            </p>
            {projects.length === 0 && (
              <button
                onClick={() => navigate('/weeklyChallenge')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                Start Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500/50 transition overflow-hidden group"
              >
                {/* Project Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {getStatusText(project.status)}
                        </span>
                        {project.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            <FaStar className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        {project.score && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <FaTrophy className="w-3 h-3" />
                            {project.score}/100
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition">
                        {project.title}
                      </h3>
                      {project.challenge && (
                        <div className="mb-2">
                          <p className="text-sm text-blue-400 mb-1">
                            Challenge: {project.challenge.title}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            project.challengeSource === 'weekly' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            project.challengeSource === 'daily' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            project.challengeSource === 'business-competition' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {project.challengeSource === 'weekly' ? 'Weekly Challenge' :
                             project.challengeSource === 'daily' ? 'Daily Challenge' :
                             project.challengeSource === 'business-competition' ? 'Business Competition' :
                             'Personal Project'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  {/* Links */}
                  <div className="flex items-center gap-3 mb-4">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition text-sm"
                    >
                      <FaGithub className="w-4 h-4" />
                      Code
                    </a>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition text-sm"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      <FaCalendarAlt className="inline w-3 h-3 mr-1" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleViewDetails(project)}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                    >
                      <FaEye className="w-3 h-3" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProject.status)}`}>
                      {getStatusIcon(selectedProject.status)}
                      {getStatusText(selectedProject.status)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                    <p className="text-white">{selectedProject.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedProject.challenge && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Challenge</h3>
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-white font-medium">{selectedProject.challenge.title}</p>
                        <p className="text-gray-400 text-sm">
                          {selectedProject.challenge.category} • {selectedProject.challenge.difficulty}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Links</h3>
                    <div className="space-y-2">
                      <a
                        href={selectedProject.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline"
                      >
                        <FaGithub className="w-4 h-4" />
                        {selectedProject.githubUrl}
                      </a>
                      {selectedProject.liveUrl && (
                        <a
                          href={selectedProject.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-400 hover:text-green-300 underline"
                        >
                          <FaExternalLinkAlt className="w-4 h-4" />
                          {selectedProject.liveUrl}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white ml-2">
                          {new Date(selectedProject.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-white ml-2">
                          {new Date(selectedProject.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedProject.score && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Score</h3>
                      <div className="flex items-center gap-2">
                        <FaTrophy className="text-purple-400 w-5 h-5" />
                        <span className="text-2xl font-bold text-white">{selectedProject.score}/100</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedProject.feedback && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Feedback</h3>
                      <div className="p-4 bg-gray-700/50 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-300">{selectedProject.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProjects;
