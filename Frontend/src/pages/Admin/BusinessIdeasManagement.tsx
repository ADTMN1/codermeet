import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FaLightbulb, FaEye, FaCheck, FaTimes, FaFilter, FaSearch, FaDownload, FaChartBar } from 'react-icons/fa';

interface BusinessIdea {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  userName: string;
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
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

interface IdeaStats {
  totalIdeas: number;
  statusStats: Array<{ _id: string; count: number }>;
  categoryStats: Array<{ _id: string; count: number }>;
}

const BusinessIdeasManagement: React.FC = () => {
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [stats, setStats] = useState<IdeaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
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

  useEffect(() => {
    fetchIdeas();
    fetchStats();
  }, [filter, pagination.page]);

  const fetchIdeas = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10'
      });

      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await fetch(`${API_BASE_URL}/api/business-ideas?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(data.ideas || []);
        setPagination({
          page: data.currentPage,
          totalPages: data.totalPages,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast.error('Failed to fetch business ideas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/business-ideas/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateIdeaStatus = async (ideaId: string, status: string, adminNotes?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/business-ideas/${ideaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status, adminNotes })
      });

      if (response.ok) {
        toast.success(`Idea ${status} successfully`);
        fetchIdeas();
        fetchStats();
        setShowModal(false);
        setSelectedIdea(null);
      } else {
        toast.error('Failed to update idea status');
      }
    } catch (error) {
      console.error('Error updating idea:', error);
      toast.error('Failed to update idea status');
    }
  };

  const getStatusBadge = (status: string) => {
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

  const exportData = () => {
    const csvContent = [
      ['Title', 'Category', 'Status', 'Submitted By', 'Date', 'Contact Email'].join(','),
      ...ideas.map(idea => [
        `"${idea.title}"`,
        `"${idea.category}"`,
        idea.status,
        `"${idea.userName}"`,
        new Date(idea.createdAt).toLocaleDateString(),
        `"${idea.contactEmail}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-ideas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredIdeas = ideas.filter(idea => {
    if (filter.search && !idea.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !idea.userName.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-gray-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaLightbulb className="text-orange-400 text-3xl mr-3" />
              <h1 className="text-3xl font-bold text-white">Business Ideas Management</h1>
            </div>
            <button
              onClick={exportData}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FaDownload className="mr-2" />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Total Ideas</h3>
                <p className="text-3xl font-bold text-orange-400">{stats.totalIdeas}</p>
              </div>
              {stats.statusStats.map(stat => (
                <div key={stat._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-2 capitalize">
                    {stat._id.replace('_', ' ')}
                  </h3>
                  <p className="text-3xl font-bold text-purple-400">{stat.count}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ideas..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => setFilter({ status: '', category: '', search: '' })}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Ideas Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredIdeas.map((idea) => (
                  <tr key={idea._id} className="hover:bg-gray-700 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{idea.title}</div>
                      <div className="text-sm text-gray-400 truncate max-w-xs">{idea.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">{idea.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{idea.userName}</div>
                      <div className="text-xs text-gray-500">{idea.contactEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(idea.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedIdea(idea);
                            setShowModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {idea.status !== 'approved' && (
                          <button
                            onClick={() => updateIdeaStatus(idea._id, 'approved')}
                            className="text-green-400 hover:text-green-300 transition"
                            title="Approve"
                          >
                            <FaCheck />
                          </button>
                        )}
                        {idea.status !== 'rejected' && (
                          <button
                            onClick={() => updateIdeaStatus(idea._id, 'rejected')}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Reject"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedIdea.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Submitted By</h3>
                  <p className="text-white">{selectedIdea.userName}</p>
                  <p className="text-gray-400 text-sm">{selectedIdea.contactEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Category</h3>
                  <p className="text-white">{selectedIdea.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Target Market</h3>
                  <p className="text-white">{selectedIdea.targetMarket}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Revenue Model</h3>
                  <p className="text-white">{selectedIdea.revenueModel}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Current Stage</h3>
                  <p className="text-white">{selectedIdea.currentStage}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Team Size</h3>
                  <p className="text-white">{selectedIdea.teamSize || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Funding Needed</h3>
                  <p className="text-white">{selectedIdea.fundingNeeded}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
                  {getStatusBadge(selectedIdea.status)}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                <p className="text-white leading-relaxed">{selectedIdea.description}</p>
              </div>

              {selectedIdea.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Additional Information</h3>
                  <p className="text-white leading-relaxed">{selectedIdea.additionalInfo}</p>
                </div>
              )}

              {selectedIdea.adminNotes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Admin Notes</h3>
                  <p className="text-white leading-relaxed">{selectedIdea.adminNotes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const notes = prompt('Add admin notes (optional):');
                      updateIdeaStatus(selectedIdea._id, e.target.value, notes || undefined);
                      e.target.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  defaultValue=""
                >
                  <option value="">Change Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessIdeasManagement;
