import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Eye, Clock, Trophy, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface DailyChallenge {
  _id: string;
  date: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: number;
  maxPoints: number;
  isActive: boolean;
  submissions?: number;
  winners?: any[];
  createdAt: string;
  hint?: string;
  solution?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints?: string[];
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    weight: number;
  }>;
  prizes?: {
    first: {
      amount: number;
      type: string;
      currency: string;
    };
    second: {
      amount: number;
      type: string;
      currency: string;
    };
    third: {
      amount: number;
      type: string;
      currency: string;
    };
  };
  scoringCriteria?: {
    speed: {
      weight: number;
      description: string;
    };
    efficiency: {
      weight: number;
      description: string;
    };
    correctness: {
      weight: number;
      description: string;
    };
  };
}

interface FormData {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: number;
  maxPoints: number;
  isActive: boolean;
  hint: string;
  solution: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    weight: number;
  }>;
  prizes: {
    first: {
      amount: number;
      type: string;
      currency: string;
    };
    second: {
      amount: number;
      type: string;
      currency: string;
    };
    third: {
      amount: number;
      type: string;
      currency: string;
    };
  };
  scoringCriteria: {
    speed: {
      weight: number;
      description: string;
    };
    efficiency: {
      weight: number;
      description: string;
    };
    correctness: {
      weight: number;
      description: string;
    };
  };
  date: string;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const DailyChallengesSimple: React.FC = () => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL/daily-challenge/all?page=${pagination.current}&limit=10&status=${statusFilter}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      if (response.status === 401) {
        setError('Authentication required. Please log in as an admin.');
        return;
      }
      
      if (response.status === 403) {
        setError('Admin access required. You do not have permission to manage daily challenges.');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setChallenges(data.data.challenges);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch challenges');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [pagination.current, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This will also delete all submissions.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL/daily-challenge/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.status === 401) {
        setError('Authentication required. Please log in as an admin.');
        return;
      }
      
      if (response.status === 403) {
        setError('Admin access required. You do not have permission to delete challenges.');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        fetchChallenges();
      } else {
        setError(data.message || 'Failed to delete challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      setError('Failed to delete challenge');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {viewMode === 'create' ? 'Create Daily Challenge' : 'Edit Daily Challenge'}
            </h2>
            <p className="text-gray-400">
              {viewMode === 'create' ? 'Create a new daily coding challenge' : 'Update challenge details'}
            </p>
          </div>
          <Button 
            onClick={() => setViewMode('list')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Back to List
          </Button>
        </div>
        
        <ChallengeForm 
          challenge={selectedChallenge}
          onSubmit={() => {
            setViewMode('list');
            fetchChallenges();
          }}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Daily Challenges</h2>
          <p className="text-gray-400">Manage daily coding challenges</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedChallenge(null);
            setViewMode('create');
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Daily Challenge
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-400">Loading challenges...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No Challenges Found</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all' ? 'No daily challenges have been created yet' : `No ${statusFilter} challenges found`}
          </p>
          <Button 
            onClick={() => {
              setSelectedChallenge(null);
              setViewMode('create');
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Challenge
          </Button>
        </div>
      ) : (
        <>
          {/* Challenges List */}
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div key={challenge._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        challenge.isActive 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {challenge.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-3 line-clamp-2">{challenge.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(challenge.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {challenge.timeLimit} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {challenge.maxPoints} pts
                      </div>
                      {challenge.winners && challenge.winners.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {challenge.winners.length} winners
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setViewMode('edit');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(challenge._id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-gray-400">
                Page {pagination.current} of {pagination.pages}
              </span>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Challenge Form Component
const ChallengeForm: React.FC<{
  challenge?: DailyChallenge | null;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({ challenge, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    title: challenge?.title || '',
    description: challenge?.description || '',
    difficulty: challenge?.difficulty || 'Medium',
    category: challenge?.category || 'Algorithms',
    timeLimit: challenge?.timeLimit || 30,
    maxPoints: challenge?.maxPoints || 100,
    isActive: challenge?.isActive ?? true,
    hint: challenge?.hint || '',
    solution: challenge?.solution || '',
    examples: challenge?.examples || [{ input: '', output: '', explanation: '' }],
    constraints: challenge?.constraints || [''],
    testCases: challenge?.testCases || [{ input: '', expectedOutput: '', weight: 1 }],
    prizes: challenge?.prizes || {
      first: { amount: 100, type: 'mobile_card', currency: 'ETB' },
      second: { amount: 50, type: 'mobile_card', currency: 'ETB' },
      third: { amount: 25, type: 'mobile_card', currency: 'ETB' }
    },
    scoringCriteria: challenge?.scoringCriteria || {
      speed: { weight: 0.2, description: 'Faster execution time' },
      efficiency: { weight: 0.2, description: 'Lower memory usage' },
      correctness: { weight: 0.6, description: 'Correct test results' }
    },
    date: challenge?.date || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })()
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const url = challenge 
        ? `${import.meta.env.VITE_API_URL/daily-challenge/${challenge._id}`
        : `${import.meta.env.VITE_API_URL/daily-challenge/create`;
      
      const method = challenge ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        setError('Authentication required. Please log in as an admin.');
        return;
      }
      
      if (response.status === 403) {
        setError('Admin access required. You do not have permission to manage challenges.');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        onSubmit();
      } else {
        if (data.message && data.message.includes('already exists for this date')) {
          setError('A challenge already exists for this date. Please choose a different date.');
        } else {
          setError(data.message || 'Failed to save challenge');
        }
      }
    } catch (error) {
      console.error('Error saving challenge:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (minutes)</label>
          <input
            type="number"
            value={formData.timeLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Points</label>
          <input
            type="number"
            value={formData.maxPoints}
            onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 h-32 resize-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Hint</label>
        <textarea
          value={formData.hint}
          onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 h-24 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Solution</label>
        <textarea
          value={formData.solution}
          onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 h-32 resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : (challenge ? 'Update Challenge' : 'Create Challenge')}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default DailyChallengesSimple;
