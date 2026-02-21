import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Code,
  Calendar,
  Target,
  Award,
  FileText,
  Eye,
  Trash2,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import { challengeService, Challenge, ChallengeStats } from '../../services/challengeService';
import { toast } from 'sonner';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const ChallengesHub: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    challengeTitle?: string;
    challengeId?: string;
    isDeleting?: boolean;
  } | null>(null);

  // Calculate most used category
  const categoryCounts = challenges.reduce((acc, challenge) => {
    const category = challenge.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Debug: Log the category counts
  console.log('Category counts:', categoryCounts);
  console.log('Challenges:', challenges.map(c => ({ title: c.title, category: c.category })));

  const mostUsedCategory = Object.keys(categoryCounts).length > 0 
    ? (() => {
        const maxCount = Math.max(...Object.values(categoryCounts));
        const topCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] === maxCount);
        return topCategories.length > 1 ? `${topCategories[0]} (tie)` : topCategories[0];
      })()
    : 'N/A';

  useEffect(() => {
    fetchChallengesData();
    
    // Listen for refresh events
    const handleRefresh = () => {
      fetchChallengesData();
    };
    
    window.addEventListener('admin-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('admin-refresh', handleRefresh);
    };
  }, []);

  const fetchChallengesData = async () => {
    try {
      setLoading(true);
      const [challengesData, statsData] = await Promise.all([
        challengeService.getAllChallenges({ limit: 100 }),
        challengeService.getChallengeStats()
      ]);
      
      console.log('🔍 Raw challenges data from API:', challengesData);
      console.log('🔍 challengesData structure:', {
        hasData: !!challengesData?.data,
        hasChallenges: !!challengesData?.data?.challenges,
        challengesType: typeof challengesData?.data?.challenges,
        challengesLength: Array.isArray(challengesData?.data?.challenges) ? challengesData.data.challenges.length : 'N/A',
        directDataType: typeof challengesData?.data,
        directDataLength: Array.isArray(challengesData?.data) ? challengesData.data.length : 'N/A'
      });
      
      let challengesArray: Challenge[] = [];
      
      // Try different possible data structures based on the API response
      if (challengesData?.data?.challenges && Array.isArray(challengesData.data.challenges)) {
        challengesArray = challengesData.data.challenges;
      } else if (challengesData?.data && Array.isArray(challengesData.data)) {
        challengesArray = challengesData.data;
      } else {
        console.warn('⚠️ Unexpected challenges data structure:', challengesData);
        challengesArray = [];
      }
      
      console.log('🔍 Processed challenges array:', challengesArray);
      console.log('🔍 First challenge details:', challengesArray[0]);
      
      // Only update state if we have valid data
      if (Array.isArray(challengesArray)) {
        setChallenges(challengesArray);
      } else {
        console.error('❌ challengesArray is not an array:', challengesArray);
        setChallenges([]);
      }
      
      setChallengeStats(statsData || null);
      
      // Debug: Log the actual data being received
      console.log('🔍 Debug - Challenges data:', {
        challengesCount: challengesArray.length,
        totalGenerated: statsData?.totalGenerated || 0,
        overview: statsData?.overview,
        statsData
      });
    } catch (error: any) {
      console.error('Error fetching challenges data:', error);
      toast.error('Failed to load challenges data');
      setChallenges([]); // Set empty array on error to prevent undefined issues
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string, challengeTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      challengeTitle,
      challengeId,
      isDeleting: false
    });
  };

  const confirmDeleteChallenge = async () => {
    if (!deleteDialog?.challengeId) return;

    try {
      setDeleteDialog(prev => prev ? { ...prev, isDeleting: true } : null);
      await challengeService.deleteChallenge(deleteDialog.challengeId);
      setChallenges(challenges.filter(challenge => challenge._id !== deleteDialog.challengeId));
      toast.success('Challenge deleted successfully');
      fetchChallengesData(); // Refresh stats
      setDeleteDialog(null);
    } catch (error) {
      toast.error('Failed to delete challenge');
      setDeleteDialog(prev => prev ? { ...prev, isDeleting: false } : null);
    }
  };


  const filteredChallenges = challenges.filter(challenge =>
    // Filter by search term only (show all challenges regardless of status)
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Challenge Hub</h2>
          <p className="text-gray-400">Manage coding challenges and competitions</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin/daily-challenges')}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600/10 cursor-pointer"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Daily Challenges
          </Button>
          <Button
            onClick={() => navigate('/admin/weekly-challenges')}
            variant="outline"
            className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 cursor-pointer"
          >
            <Award className="w-4 h-4 mr-2" />
            Weekly Challenges
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {challengeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-600 to-green-800 border border-green-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Total Challenges</p>
                <p className="text-2xl font-bold text-white">{challengeStats?.totalGenerated || 0}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {challengeStats?.overview?.totalChallenges > 0 
                    ? Math.round((challengeStats?.overview?.completedChallenges / challengeStats?.overview?.totalChallenges) * 100) 
                    : 0}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-700 rounded-xl p-4"
          >
            
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Avg Generation Time</p>
                <p className="text-2xl font-bold text-white">2.3s</p>
              </div>
              <FileText className="w-8 h-8 text-purple-300" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-700">
            <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <BarChart3 className="w-8 h-8 text-orange-300" />
                  <p className="text-orange-200 text-sm font-medium">Most Used Category</p>
                  <p className="text-lg font-bold text-white">{mostUsedCategory}</p>
                </div>
                <Users className="w-8 h-8 text-orange-300" />
              </div>
            </Card>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search challenges by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge, index) => (
          <motion.div
            key={challenge._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{challenge.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{challenge.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {challenge.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {challenge.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {challenge.currentParticipants || 0} participants
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(challenge.startDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/challenges/${challenge._id}`)}
                className="border-blue-600 text-blue-400 hover:bg-blue-600/10 cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteChallenge(challenge._id, challenge.title)}
                className="border-red-600 text-red-400 hover:bg-red-600/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No Challenges Found</h3>
          <p className="text-gray-500">No challenges are available at the moment.</p>
        </div>
      )}


      {/* Professional Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Challenge Deletion</h3>
                <p className="text-sm text-gray-400">This action is permanent and cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">
                Are you sure you want to delete challenge <span className="font-semibold text-white">"{deleteDialog.challengeTitle}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove the challenge and all associated data including submissions, participants, and statistics.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteDialog(null)}
                disabled={deleteDialog.isDeleting}
                className="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChallenge}
                disabled={deleteDialog.isDeleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleteDialog.isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Challenge
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

export default ChallengesHub;
