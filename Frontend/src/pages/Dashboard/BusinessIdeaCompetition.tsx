import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';
import { FaLightbulb, FaArrowLeft, FaTrophy, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';

interface BusinessIdea {
  _id?: string;
  title: string;
  description: string;
  category: string;
  targetMarket: string;
  revenueModel: string;
  teamSize: string;
  currentStage: string;
  fundingNeeded: string;
  contactEmail: string;
  additionalInfo: string;
  submittedAt?: string;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
}

const BusinessIdeaCompetition: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIdeas, setSubmittedIdeas] = useState<BusinessIdea[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState<BusinessIdea>({
    title: '',
    description: '',
    category: '',
    targetMarket: '',
    revenueModel: '',
    teamSize: '',
    currentStage: '',
    fundingNeeded: '',
    contactEmail: user?.email || '',
    additionalInfo: ''
  });

  const categories = [
    'Technology/Software',
    'Healthcare',
    'Education',
    'Finance',
    'E-commerce',
    'Agriculture',
    'Renewable Energy',
    'Transportation',
    'Food & Beverage',
    'Real Estate',
    'Entertainment',
    'Other'
  ];

  const stages = [
    'Idea Stage',
    'Research & Development',
    'Prototype',
    'Beta Testing',
    'Early Revenue',
    'Growth Stage',
    'Established Business'
  ];

  const teamSizes = [
    'Just Me',
    '2-3 People',
    '4-5 People',
    '6-10 People',
    '11+ People'
  ];

  useEffect(() => {
    fetchUserIdeas();
  }, []);

  const fetchUserIdeas = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/business-ideas/user/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const ideas = await response.json();
        setSubmittedIdeas(ideas);
        if (ideas.length > 0) {
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['title', 'description', 'category', 'targetMarket', 'revenueModel', 'currentStage', 'fundingNeeded', 'contactEmail'];
    
    for (const field of required) {
      if (!formData[field as keyof BusinessIdea]) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }

    if (formData.description.length < 100) {
      toast.error('Description must be at least 100 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/business-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...formData,
          userId: user?._id,
          userName: user?.name || user?.username
        })
      });

      if (response.ok) {
        toast.success('Business idea submitted successfully!');
        await fetchUserIdeas();
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          targetMarket: '',
          revenueModel: '',
          teamSize: '',
          currentStage: '',
          fundingNeeded: '',
          contactEmail: user?.email || '',
          additionalInfo: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit idea');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast.error('Failed to submit idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Approved</span>;
      case 'under_review':
        return <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">Under Review</span>;
      case 'rejected':
        return <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Rejected</span>;
      default:
        return <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-purple-400 hover:text-purple-300 mb-4 transition"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <FaLightbulb className="text-orange-400 text-4xl mr-3" />
              <h1 className="text-4xl font-bold text-white">Business Idea Competition</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Submit your innovative startup idea and win amazing prizes!
            </p>
          </div>
        </div>

        {/* Competition Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <FaTrophy className="text-orange-400 text-3xl mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Grand Prize</h3>
              <p className="text-orange-400 font-bold">5,000 Birr</p>
              <p className="text-gray-400 text-sm">+ Mentorship</p>
            </div>
            <div className="text-center">
              <FaCalendarAlt className="text-blue-400 text-3xl mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Deadline</h3>
              <p className="text-blue-400 font-bold">Dec 15, 2025</p>
              <p className="text-gray-400 text-sm">11:59 PM</p>
            </div>
            <div className="text-center">
              <FaUsers className="text-green-400 text-3xl mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Open to</h3>
              <p className="text-green-400 font-bold">All Members</p>
              <p className="text-gray-400 text-sm">Basic & Premium</p>
            </div>
          </div>
        </div>

        {/* Submitted Ideas */}
        {submittedIdeas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Submitted Ideas</h2>
            <div className="space-y-4">
              {submittedIdeas.map((idea) => (
                <div key={idea._id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                    {getStatusBadge(idea.status)}
                  </div>
                  <p className="text-gray-400 mb-3 line-clamp-2">{idea.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">
                      {idea.category}
                    </span>
                    <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded">
                      {idea.currentStage}
                    </span>
                    <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded">
                      Funding: {idea.fundingNeeded}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Submitted: {idea.submittedAt ? new Date(idea.submittedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
            {submittedIdeas.length < 3 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Submit Another Idea
              </button>
            )}
          </div>
        )}

        {/* Submission Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Submit Your Business Idea</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Idea Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    placeholder="e.g., AI-Powered Learning Platform"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Target Market */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Market *
                  </label>
                  <input
                    type="text"
                    name="targetMarket"
                    value={formData.targetMarket}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    placeholder="e.g., University students, Small businesses"
                    required
                  />
                </div>

                {/* Revenue Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Revenue Model *
                  </label>
                  <input
                    type="text"
                    name="revenueModel"
                    value={formData.revenueModel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    placeholder="e.g., Subscription, Freemium, Advertising"
                    required
                  />
                </div>

                {/* Current Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Stage *
                  </label>
                  <select
                    name="currentStage"
                    value={formData.currentStage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    required
                  >
                    <option value="">Select current stage</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Size
                  </label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                  >
                    <option value="">Select team size</option>
                    {teamSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                {/* Funding Needed */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Funding Needed *
                  </label>
                  <input
                    type="text"
                    name="fundingNeeded"
                    value={formData.fundingNeeded}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    placeholder="e.g., 50,000 Birr, No funding needed"
                    required
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Detailed Description * (minimum 100 characters)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition resize-none"
                  placeholder="Describe your business idea in detail. What problem does it solve? How does it work? What makes it unique?"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">
                  {formData.description.length}/100 characters minimum
                </p>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 transition resize-none"
                  placeholder="Any additional information about your business idea, team, or implementation plans..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="mr-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg font-semibold transition disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessIdeaCompetition;
