import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  RefreshCw, 
  CalendarDays,
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Clock,
  Target,
  Zap,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Timer,
  Star,
  Trophy,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useDailyChallengeStats, useDailyChallenges } from '../../hooks/useChallenges';

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
    first: { amount: number; type: string; currency: string };
    second: { amount: number; type: string; currency: string };
    third: { amount: number; type: string; currency: string };
  };
  scoringCriteria?: {
    speed: { weight: number; description: string };
    efficiency: { weight: number; description: string };
    correctness: { weight: number; description: string };
  };
}

interface GenerationOptions {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: number;
  maxPoints: number;
  topic?: string;
}

interface GenerationStats {
  totalGenerated: number;
  successRate: number;
  avgGenerationTime: number;
  mostUsedCategory: string;
  mostUsedDifficulty: string;
}

const AIDailyChallenges: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [generatedChallenge, setGeneratedChallenge] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; challenge: DailyChallenge | null }>({
    open: false,
    challenge: null
  });
  const [bulkPreferences, setBulkPreferences] = useState({
    difficulties: ['Easy', 'Medium', 'Hard'],
    categories: ['Algorithms', 'Data Structures', 'Strings', 'Arrays', 'Trees', 'Dynamic Programming', 'Graphs', 'Recursion'],
    timeLimit: 30,
    maxPoints: 100,
    skipReserved: true,
    notifyOnSkip: true,
    startDate: new Date().toISOString().split('T')[0],
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    targetDate: '', // Specific date for manual selection
    previewDifficulty: 'Medium',
    challengesPerMonth: 20,
    preferredDays: ['Monday', 'Wednesday', 'Friday'],
    excludeWeekends: true,
    monthlyThemes: {
      0: 'Algorithms & Data Structures', // January
      1: 'String Manipulation & Arrays', // February
      2: 'Trees & Graphs', // March
      3: 'Dynamic Programming', // April
      4: 'Recursion & Backtracking', // May
      5: 'Sorting & Searching', // June
      6: 'Mathematical Algorithms', // July
      7: 'System Design', // August
      8: 'Database Problems', // September
      9: 'Web Development', // October
      10: 'Machine Learning', // November
      11: 'Advanced Topics' // December
    }
  });
  const [monthlySchedule, setMonthlySchedule] = useState<any>(null);
  const [previewChallenge, setPreviewChallenge] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    difficulty: 'Medium',
    category: 'Algorithms',
    timeLimit: 30,
    maxPoints: 100
  });

  const categories = [
    'Algorithms', 'Data Structures', 'Strings', 'Arrays', 'Trees', 
    'Dynamic Programming', 'Graphs', 'Recursion', 'Sorting', 'Searching'
  ];

  const { data: stats, isLoading: statsLoading, error: statsError } = useDailyChallengeStats();
  const { data: challengesData, isLoading: challengesLoading, error: challengesError } = useDailyChallenges({ limit: 100 });
  
  const challenges = challengesData?.challenges || [];
  
  // Remove manual loading state - React Query handles it
  // const isLoading = statsLoading || challengesLoading;
  
  // Error handling
  useEffect(() => {
    if (statsError) {
      toast.error('Failed to load daily challenge statistics');
      console.error('Stats error:', statsError);
    }
    if (challengesError) {
      toast.error('Failed to load daily challenges');
      console.error('Challenges error:', challengesError);
    }
  }, [statsError, challengesError]);

  const fetchAvailableDates = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/available-dates?daysAhead=30`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableDates(data.data.availableDates);
          // Auto-select the first available date
          const firstAvailable = data.data.availableDates.find((d: any) => d.isAvailable);
          if (firstAvailable) {
            setSelectedDate(firstAvailable.dateStr);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      toast.error('Failed to fetch available dates');
    }
  };

  const fetchMonthlySchedule = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const monthYear = `${bulkPreferences.selectedYear}-${String(bulkPreferences.selectedMonth + 1).padStart(2, '0')}`;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/monthly-schedule?monthYear=${monthYear}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlySchedule(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching monthly schedule:', error);
      toast.error('Failed to fetch monthly schedule');
    }
  };

  const generatePreviewChallenge = async () => {
    setPreviewLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            difficulty: bulkPreferences.previewDifficulty,
            category: bulkPreferences.monthlyThemes[bulkPreferences.selectedMonth],
            timeLimit: bulkPreferences.timeLimit,
            maxPoints: bulkPreferences.maxPoints,
            topic: `${bulkPreferences.monthlyThemes[bulkPreferences.selectedMonth]} - ${bulkPreferences.previewDifficulty} Challenge`
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        setPreviewChallenge(data.data);
        toast.success('Preview generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const bulkRegisterChallenges = async () => {
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/bulk-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            startDate: bulkPreferences.startDate,
            preferences: bulkPreferences
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        
        // Show notifications
        if (data.data.notifications) {
          data.data.notifications.forEach((notification: any) => {
            if (notification.type === 'success') {
              toast.success(notification.message);
            } else if (notification.type === 'warning') {
              toast.warning(notification.message);
            } else if (notification.type === 'alert') {
              toast.error(notification.message);
            }
          });
        }
        
        // React Query will automatically refetch
        setShowBulkModal(false);
      } else {
        toast.error(data.message || 'Failed to bulk register challenges');
      }
    } catch (error) {
      console.error('Error bulk registering challenges:', error);
      toast.error('Failed to bulk register challenges');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
    fetchMonthlySchedule();
  }, []);

  const generateChallenge = async (saveImmediately = false) => {
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Debug - Token exists:', !!token);
      console.log('🔑 Debug - Token length:', token?.length || 0);
      console.log('🔑 Debug - Token preview:', token?.substring(0, 20) + '...');
      
      const endpoint = saveImmediately ? '/api/admin/challenges/generate-and-create' : '/api/admin/challenges/generate';
      console.log('🎯 Debug - Endpoint:', endpoint);
      console.log('🎯 Debug - Save immediately:', saveImmediately);
      console.log('🎯 Debug - Generation options:', generationOptions);
      console.log('🎯 Debug - Selected date:', selectedDate);
      
      const requestBody = {
        ...generationOptions,
        ...(saveImmediately && selectedDate && { scheduleFor: selectedDate })
      };
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('📊 Debug - Response status:', response.status);
      console.log('📊 Debug - Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        console.log('❌ Debug - 401 Unauthorized');
        toast.error('Authentication required. Please log in as an admin.');
        return;
      }
      
      if (response.status === 403) {
        console.log('❌ Debug - 403 Forbidden');
        toast.error('Admin access required. You do not have permission to generate challenges.');
        return;
      }

      const data = await response.json();
      console.log('📝 Debug - Response data:', data);
      
      if (data.success) {
        console.log('✅ Debug - Success!');
        setGeneratedChallenge(data.data);
        
        // Show success toast with the message from backend
        toast.success(data.message || (saveImmediately ? 'Challenge created successfully!' : 'Challenge generated successfully!'));
        
        if (saveImmediately) {
          setShowGenerateModal(false);
        }
      } else {
        console.log('❌ Debug - API Error:', data.message);
        toast.error(data.message || 'Failed to generate challenge');
      }
    } catch (error) {
      console.error('🚨 Debug - Fetch Error:', error);
      console.error('🚨 Debug - Error stack:', (error as Error).stack);
      toast.error('Failed to connect to AI service');
    } finally {
      setGenerating(false);
    }
  };

  const generateWeekly = async () => {
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/generate-weekly`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            startDate: new Date(),
            difficulties: ['Easy', 'Medium', 'Hard']
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Weekly challenges generated successfully!');
        setShowBulkModal(false);
      } else {
        toast.error(data.message || 'Failed to generate weekly challenges');
      }
    } catch (error) {
      console.error('Error generating weekly challenges:', error);
      toast.error('Failed to generate weekly challenges');
    } finally {
      setGenerating(false);
    }
  };

  const generateTopicChallenge = async () => {
    if (!generationOptions.topic) {
      toast.error('Please enter a topic for the challenge');
      return;
    }
    
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin/challenges/generate-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            topic: generationOptions.topic,
            difficulty: generationOptions.difficulty,
            category: generationOptions.category,
            timeLimit: generationOptions.timeLimit,
            maxPoints: generationOptions.maxPoints
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        toast.success('Topic-based challenge generated successfully!');
        setGeneratedChallenge(data.data);
      } else {
        toast.error(data.message || 'Failed to generate topic challenge');
      }
    } catch (error) {
      console.error('Error generating topic challenge:', error);
      toast.error('Failed to generate topic challenge');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (challenge: DailyChallenge) => {
    setDeleteModal({ open: true, challenge });
  };

  const confirmDelete = async () => {
    if (!deleteModal.challenge) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/daily-challenge/${deleteModal.challenge._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.ok) {
        toast.success('Challenge deleted successfully!');
        setDeleteModal({ open: false, challenge: null });
        // React Query will automatically refetch the challenges
      } else {
        toast.error('Failed to delete challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, challenge: null });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Daily Challenges
          </h2>
          <p className="text-gray-400">Generate unlimited challenges with AI</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Quick Generate
          </Button>
          <Button
            onClick={() => setShowBulkModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Bulk Generate
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">AI Generated Challenges</p>
                <p className="text-2xl font-bold text-white">{stats?.totalGenerated || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-300" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-600 to-green-800 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.successRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-300" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Avg Time</p>
                <p className="text-2xl font-bold text-white">{stats.avgGenerationTime || 0}s</p>
              </div>
              <Timer className="w-8 h-8 text-blue-300" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-600 to-orange-800 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Top Category</p>
                <p className="text-lg font-bold text-white">{stats.mostUsedCategory || 'N/A'}</p>
              </div>
              <Star className="w-8 h-8 text-orange-300" />
            </div>
          </div>
        </div>
      )}

      {/* Challenges List */}
      {(statsLoading || challengesLoading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-400">Loading challenges...</span>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No AI Challenges Yet</h3>
          <p className="text-gray-500 mb-4">Start generating unlimited challenges with AI!</p>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your First AI Challenge
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(challenges) && challenges.map((challenge) => (
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
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      AI Generated
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
                    onClick={() => setSelectedChallenge(challenge)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(challenge)}
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
      )}

      {/* Quick Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Generate AI Challenge
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={generationOptions.difficulty}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={generationOptions.category}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={generationOptions.timeLimit}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                    min="5"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Points</label>
                  <input
                    type="number"
                    value={generationOptions.maxPoints}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                    min="10"
                    max="200"
                  />
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Date</label>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {availableDates.slice(0, 21).map((dateInfo, index) => (
                    <button
                      key={index}
                      onClick={() => dateInfo.isAvailable && setSelectedDate(dateInfo.dateStr)}
                      disabled={!dateInfo.isAvailable}
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        dateInfo.isAvailable
                          ? selectedDate === dateInfo.dateStr
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-purple-500 cursor-pointer'
                          : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="font-medium">{dateInfo.day}</div>
                      <div className="text-xs">{dateInfo.dayName}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-800 border border-gray-700 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-900 border border-gray-800 rounded opacity-50"></div>
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-600 border border-purple-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                </div>
                {selectedDate && (
                  <div className="mt-2 text-sm text-purple-400">
                    Selected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Topic (Optional)</label>
                <input
                  type="text"
                  value={generationOptions.topic || ''}
                  onChange={(e) => setGenerationOptions(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Binary Search Trees, Dynamic Programming"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {generatedChallenge && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Generated Challenge Preview</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Title:</span> <span className="text-white">{generatedChallenge.title}</span></p>
                    <p><span className="text-gray-400">Description:</span> <span className="text-white">{generatedChallenge.description?.substring(0, 200)}...</span></p>
                    <p><span className="text-gray-400">Test Cases:</span> <span className="text-white">{generatedChallenge.testCases?.length || 0}</span></p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => generateChallenge(false)}
                  disabled={generating}
                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {generating ? 'Generating...' : 'Preview'}
                </Button>
                <Button
                  onClick={() => generateChallenge(true)}
                  disabled={generating}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {generating ? 'Generating & Saving...' : 'Generate & Save'}
                </Button>
                <Button
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Bulk Registration Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              Advanced Bulk Registration
            </h3>
            
            {/* Monthly Schedule Overview */}
            {monthlySchedule && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">
                  {new Date(bulkPreferences.selectedYear, bulkPreferences.selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Schedule
                </h4>
                <div className="grid grid-cols-7 gap-1 text-xs mb-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-gray-400 font-medium p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthlySchedule.calendarDays.map((day: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-2 text-center rounded border ${
                        day.isReserved 
                          ? 'bg-red-900/30 border-red-500/50' 
                          : 'bg-green-900/30 border-green-500/50'
                      }`}
                    >
                      <div className="text-xs font-medium">{day.day}</div>
                      {day.isReserved && (
                        <div className="text-xs text-red-400 truncate" title={day.challenge?.title}>
                          {day.challenge?.difficulty?.[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm mt-4">
                  <span className="text-green-400">Available: {monthlySchedule.availableCount}</span>
                  <span className="text-red-400">Reserved: {monthlySchedule.reservedCount}</span>
                  <span className="text-purple-400">Theme: {bulkPreferences.monthlyThemes[bulkPreferences.selectedMonth as keyof typeof bulkPreferences.monthlyThemes]}</span>
                </div>
              </div>
            )}

            {/* Preferences */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Month</label>
                  <select
                    value={bulkPreferences.selectedMonth}
                    onChange={(e) => {
                      setBulkPreferences(prev => ({ ...prev, selectedMonth: parseInt(e.target.value) }));
                      fetchMonthlySchedule();
                    }}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(bulkPreferences.monthlyThemes).map(([monthIndex, theme]) => (
                      <option key={monthIndex} value={monthIndex}>
                        {new Date(0, parseInt(monthIndex)).toLocaleDateString('en-US', { month: 'long' })} - {theme}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Year</label>
                  <input
                    type="number"
                    value={bulkPreferences.selectedYear}
                    onChange={(e) => {
                      setBulkPreferences(prev => ({ ...prev, selectedYear: parseInt(e.target.value) }));
                      fetchMonthlySchedule();
                    }}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    min="2024"
                    max="2030"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={bulkPreferences.targetDate}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preview Difficulty</label>
                  <select
                    value={bulkPreferences.previewDifficulty}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, previewDifficulty: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
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
                    value={bulkPreferences.timeLimit}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    min="5"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Points</label>
                  <input
                    type="number"
                    value={bulkPreferences.maxPoints}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                    min="10"
                    max="200"
                  />
                </div>
              </div>

              {/* Challenge Preview */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-white">Challenge Preview</h4>
                  <Button
                    onClick={generatePreviewChallenge}
                    disabled={previewLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1"
                  >
                    {previewLoading ? 'Generating...' : 'Generate Preview'}
                  </Button>
                </div>
                
                {previewChallenge ? (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-white mb-2">{previewChallenge.title}</h5>
                    <p className="text-xs text-gray-400 mb-2">{previewChallenge.description?.substring(0, 150)}...</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getDifficultyColor(previewChallenge.difficulty)}`}>
                        {previewChallenge.difficulty}
                      </span>
                      <span className="text-gray-400">{previewChallenge.timeLimit} min</span>
                      <span className="text-gray-400">{previewChallenge.maxPoints} pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm">Click "Generate Preview" to see a sample challenge</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Rotation</label>
                <div className="space-y-2">
                  {['Easy', 'Medium', 'Hard'].map(difficulty => (
                    <label key={difficulty} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bulkPreferences.difficulties.includes(difficulty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkPreferences(prev => ({ ...prev, difficulties: [...prev.difficulties, difficulty] }));
                          } else {
                            setBulkPreferences(prev => ({ ...prev, difficulties: prev.difficulties.filter(d => d !== difficulty) }));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-300">{difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={bulkPreferences.preferredDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkPreferences(prev => ({ ...prev, preferredDays: [...prev.preferredDays, day] }));
                          } else {
                            setBulkPreferences(prev => ({ ...prev, preferredDays: prev.preferredDays.filter(d => d !== day) }));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-xs text-gray-300">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkPreferences.skipReserved}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, skipReserved: e.target.checked }))}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Skip reserved dates</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkPreferences.excludeWeekends}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, excludeWeekends: e.target.checked }))}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Exclude weekends</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkPreferences.notifyOnSkip}
                    onChange={(e) => setBulkPreferences(prev => ({ ...prev, notifyOnSkip: e.target.checked }))}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Notify on skip</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={bulkRegisterChallenges}
                disabled={generating || bulkPreferences.difficulties.length === 0 || bulkPreferences.categories.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {generating ? 'Registering...' : 'Register Challenges'}
              </Button>
              <Button
                onClick={() => setShowBulkModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge View Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Challenge Details
              </h3>
              <Button
                onClick={() => setSelectedChallenge(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2"
                size="sm"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-2xl font-bold text-white">{selectedChallenge.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                      {selectedChallenge.difficulty}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedChallenge.isActive 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {selectedChallenge.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      AI Generated
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-lg mb-4">{selectedChallenge.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedChallenge.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{selectedChallenge.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>{selectedChallenge.maxPoints} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{selectedChallenge.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hint */}
              {selectedChallenge.hint && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Hint
                  </h5>
                  <p className="text-yellow-200">{selectedChallenge.hint}</p>
                </div>
              )}

              {/* Examples */}
              {selectedChallenge.examples && selectedChallenge.examples.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-blue-300 mb-3">Examples</h5>
                  <div className="space-y-3">
                    {selectedChallenge.examples.map((example, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-blue-400 text-sm font-medium">Input:</span>
                            <pre className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">{example.input}</pre>
                          </div>
                          <div>
                            <span className="text-green-400 text-sm font-medium">Output:</span>
                            <pre className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">{example.output}</pre>
                          </div>
                        </div>
                        {example.explanation && (
                          <div className="mt-2">
                            <span className="text-yellow-400 text-sm font-medium">Explanation:</span>
                            <p className="text-gray-300 text-sm mt-1">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {selectedChallenge.constraints && selectedChallenge.constraints.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-orange-300 mb-3">Constraints</h5>
                  <ul className="space-y-2">
                    {selectedChallenge.constraints.map((constraint, index) => (
                      <li key={index} className="text-orange-200 flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Test Cases */}
              {selectedChallenge.testCases && selectedChallenge.testCases.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-green-300 mb-3">Test Cases ({selectedChallenge.testCases.length})</h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedChallenge.testCases.map((testCase, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-400 text-sm font-medium">Test Case {index + 1}</span>
                          <span className="text-gray-400 text-xs">Weight: {testCase.weight}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-blue-400 text-xs font-medium">Input:</span>
                            <pre className="text-gray-300 text-xs mt-1 whitespace-pre-wrap">{testCase.input}</pre>
                          </div>
                          <div>
                            <span className="text-green-400 text-xs font-medium">Expected Output:</span>
                            <pre className="text-gray-300 text-xs mt-1 whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution */}
              {selectedChallenge.solution && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-purple-300 mb-3">Solution</h5>
                  <pre className="text-purple-200 text-sm whitespace-pre-wrap bg-gray-800 rounded-lg p-3 overflow-x-auto">
                    {selectedChallenge.solution}
                  </pre>
                </div>
              )}

              {/* Prizes */}
              {selectedChallenge.prizes && selectedChallenge.prizes.first && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-yellow-300 mb-3">Prizes</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold text-lg">🥇 First Place</div>
                      <div className="text-yellow-200">{selectedChallenge.prizes.first?.amount || 0} {selectedChallenge.prizes.first?.currency || 'USD'}</div>
                    </div>
                    {selectedChallenge.prizes.second && (
                      <div className="text-center">
                        <div className="text-gray-300 font-bold text-lg">🥈 Second Place</div>
                        <div className="text-gray-200">{selectedChallenge.prizes.second.amount} {selectedChallenge.prizes.second.currency}</div>
                      </div>
                    )}
                    {selectedChallenge.prizes.third && (
                      <div className="text-center">
                        <div className="text-orange-400 font-bold text-lg">🥉 Third Place</div>
                        <div className="text-orange-200">{selectedChallenge.prizes.third.amount} {selectedChallenge.prizes.third.currency}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scoring Criteria */}
              {selectedChallenge.scoringCriteria && selectedChallenge.scoringCriteria.speed && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-indigo-300 mb-3">Scoring Criteria</h5>
                  <div className="space-y-3">
                    {selectedChallenge.scoringCriteria.speed && (
                      <div>
                        <span className="text-indigo-400 font-medium">Speed ({selectedChallenge.scoringCriteria.speed.weight || 0}%):</span>
                        <p className="text-indigo-200 text-sm mt-1">{selectedChallenge.scoringCriteria.speed.description || 'N/A'}</p>
                      </div>
                    )}
                    {selectedChallenge.scoringCriteria.efficiency && (
                      <div>
                        <span className="text-indigo-400 font-medium">Efficiency ({selectedChallenge.scoringCriteria.efficiency.weight || 0}%):</span>
                        <p className="text-indigo-200 text-sm mt-1">{selectedChallenge.scoringCriteria.efficiency.description || 'N/A'}</p>
                      </div>
                    )}
                    {selectedChallenge.scoringCriteria.correctness && (
                      <div>
                        <span className="text-indigo-400 font-medium">Correctness ({selectedChallenge.scoringCriteria.correctness.weight || 0}%):</span>
                        <p className="text-indigo-200 text-sm mt-1">{selectedChallenge.scoringCriteria.correctness.description || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Winners */}
              {selectedChallenge.winners && selectedChallenge.winners.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Winners ({selectedChallenge.winners.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedChallenge.winners.map((winner, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-green-400 font-bold">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{winner.userId?.username || winner.userId?.name}</div>
                            <div className="text-gray-400 text-sm">Score: {winner.score}</div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {new Date(winner.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submissions Count */}
              {selectedChallenge.submissions && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total Submissions:</span>
                    <span className="text-white font-bold">{selectedChallenge.submissions}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.challenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Challenge</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-white font-semibold mb-2">{deleteModal.challenge.title}</h4>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(deleteModal.challenge.difficulty)}`}>
                    {deleteModal.challenge.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(deleteModal.challenge.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {deleteModal.challenge.maxPoints} pts
                  </span>
                </div>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-300 text-sm">
                  <strong>Warning:</strong> This will permanently delete the challenge and all associated submissions, winners, and data.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Challenge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDailyChallenges;
