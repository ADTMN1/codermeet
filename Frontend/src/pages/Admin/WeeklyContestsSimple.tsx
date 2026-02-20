import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Plus,
  Calendar,
  Clock,
  Users,
  Trophy,
  Target,
  Zap,
  Star,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Timer,
  Filter,
  Search,
  MoreVertical,
  Crown,
  Gift,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { challengeService } from '../../services/challengeService';
import { useAdminToast } from '../../utils/adminToast';

interface WeeklyChallenge {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  tags: string[];
  requirements: string[];
  deliverables: string[];
  resources: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  currentParticipants: number;
  prizePool: number;
  winnerCount: number;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  isFeatured: boolean;
  participants: Array<{
    user: {
      _id: string;
      username: string;
      fullName: string;
      avatar?: string;
    };
    joinedAt: string;
  }>;
  submissions: Array<{
    user: {
      _id: string;
      username: string;
      fullName: string;
    };
    submittedAt: string;
    status: string;
    score: number;
  }>;
  winners: Array<{
    user: {
      _id: string;
      username: string;
      fullName: string;
    };
    rank: number;
    score: number;
    prizeAmount: number;
  }>;
  createdBy: {
    _id: string;
    username: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const WeeklyContestsSimple: React.FC = () => {
  const navigate = useNavigate();
  const adminToast = useAdminToast();
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallenge[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchWeeklyChallenges();
    fetchStats();
  }, [currentPage, searchTerm, filterStatus, filterCategory, filterDifficulty]);

  const fetchWeeklyChallenges = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;

      const response = await challengeService.getAllWeeklyChallenges(params);
      setWeeklyChallenges(response.weeklyChallenges || response.data || []);
      setPagination(response.pagination);
    } catch (error: any) {
      adminToast.error('load', 'weekly challenges', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await challengeService.getWeeklyChallengeStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching weekly challenge stats:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await challengeService.deleteWeeklyChallenge(id);
      adminToast.challengeDeleted();
      fetchWeeklyChallenges();
      fetchStats();
    } catch (error: any) {
      adminToast.error('delete', 'weekly challenge', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && weeklyChallenges.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Weekly Contests</h2>
          <p className="text-gray-400">Manage weekly coding competitions</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => navigate('/admin/weekly-challenges/create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Weekly Contest
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Contests</p>
                <p className="text-2xl font-bold text-white">{stats.overview?.totalChallenges || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Contests</p>
                <p className="text-2xl font-bold text-white">{stats.overview?.activeChallenges || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Participants</p>
                <p className="text-2xl font-bold text-white">{stats.overview?.totalParticipants || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{stats.overview?.totalSubmissions || 0}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search weekly contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Categories</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Full Stack">Full Stack</option>
            <option value="Mobile">Mobile</option>
            <option value="DevOps">DevOps</option>
            <option value="AI/ML">AI/ML</option>
            <option value="Security">Security</option>
            <option value="Database">Database</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </Card>

      {/* Weekly Challenges List */}
      <div className="space-y-4">
        {weeklyChallenges.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">No Weekly Contests Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterDifficulty !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Create your first weekly contest to get started'}
            </p>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => navigate('/admin/weekly-challenges/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Weekly Contest
            </Button>
          </Card>
        ) : (
          weeklyChallenges.map((challenge) => (
            <Card key={challenge._id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(challenge.status)}`}>
                      {challenge.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                    {challenge.isFeatured && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Star className="w-3 h-3 inline mr-1" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{challenge.description.substring(0, 200)}...</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Week {challenge.weekNumber}, {challenge.year}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {challenge.currentParticipants} participants
                    </div>
                    {challenge.prizePool > 0 && (
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        ${challenge.prizePool} prize pool
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/weekly-challenges/${challenge._id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/weekly-challenges/${challenge._id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(challenge._id, challenge.title)}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Progress indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                  <span className="text-gray-400">Submissions</span>
                  <span className="text-white font-medium">{challenge.submissions?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                  <span className="text-gray-400">Winners</span>
                  <span className="text-white font-medium">{challenge.winners?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white font-medium">{challenge.category}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          <span className="text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default WeeklyContestsSimple;
