import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Filter,
  Search,
  Eye,
  Star,
  Trophy,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { challengeService, Challenge } from '../../services/challengeService';
import { submissionService } from '../../services/submissionService';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const SubmissionsSimple: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<any[]>([]);
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState<string | null>(null);
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0
  });
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rankingForm, setRankingForm] = useState({
    status: 'accepted' as 'accepted' | 'rejected',
    score: 0,
    rank: '',
    rankingCriteria: {
      codeQuality: 0,
      functionality: 0,
      creativity: 0,
      documentation: 0
    },
    feedback: ''
  });

  // Auto-calculate score based on ranking criteria
  const calculateScore = (criteria: typeof rankingForm.rankingCriteria) => {
    const getValue = (value: number | string) => {
      if (typeof value === 'string') return 0;
      return value;
    };
    return getValue(criteria.codeQuality) + getValue(criteria.functionality) + getValue(criteria.creativity) + getValue(criteria.documentation);
  };

  // Auto-calculate rank based on score (simplified - will be overridden by relative ranking)
  const calculateRank = (score: number) => {
    if (score >= 95) return '1st';
    if (score >= 85) return '2nd';
    if (score >= 75) return '3rd';
    if (score >= 65) return '4th';
    if (score >= 55) return '5th';
    if (score >= 45) return '6th';
    if (score >= 35) return '7th';
    if (score >= 25) return '8th';
    if (score >= 15) return '9th';
    if (score >= 5) return '10th';
    return 'Honorable Mention';
  };

  // Calculate relative ranking for all submissions of the same challenge
  const calculateRelativeRanks = (allSubmissions: any[], currentSubmissionId: string) => {
    // Get all submissions for the same challenge with scores
    const scoredSubmissions = allSubmissions.filter(sub => 
      sub.challengeId === selectedSubmission?.challengeId && 
      (sub.score > 0 || sub._id === currentSubmissionId)
    );

    // Sort by score (descending)
    const sortedSubmissions = [...scoredSubmissions].sort((a, b) => b.score - a.score);

    // Assign ranks
    const rankedSubmissions = sortedSubmissions.map((sub, index) => {
      let rank;
      if (index === 0) rank = '1st';
      else if (index === 1) rank = '2nd';
      else if (index === 2) rank = '3rd';
      else if (index === 3) rank = '4th';
      else if (index === 4) rank = '5th';
      else if (index === 5) rank = '6th';
      else if (index === 6) rank = '7th';
      else if (index === 7) rank = '8th';
      else if (index === 8) rank = '9th';
      else if (index === 9) rank = '10th';
      else rank = 'Honorable Mention';

      return { ...sub, rank };
    });

    return rankedSubmissions;
  };

  // Update all submission ranks in the UI after scoring
  const updateAllSubmissionRanks = async (updatedSubmission: any) => {
    try {
      console.log('Updating ranks for submission:', updatedSubmission);
      
      // Get all submissions for the same challenge
      const challengeSubmissions = submissions.filter(sub => 
        sub.challengeId === selectedSubmission?.challengeId
      );

      console.log('Challenge submissions before update:', challengeSubmissions);

      // Calculate new relative ranks
      const rankedSubmissions = calculateRelativeRanks(challengeSubmissions, updatedSubmission._id);

      console.log('Ranked submissions after calculation:', rankedSubmissions);

      // Update the submissions state with new ranks, preserving all other data
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => {
          const rankedSub = rankedSubmissions.find(r => r._id === sub._id);
          if (rankedSub) {
            // Preserve all existing data, only update rank
            return { 
              ...sub, 
              rank: rankedSub.rank,
              // Ensure user data is preserved
              userId: sub.userId,
              user: sub.user,
              challenge: sub.challenge
            };
          }
          return sub;
        })
      );

      console.log('Updated ranks for challenge submissions:', rankedSubmissions);
    } catch (error) {
      console.error('Error updating ranks:', error);
    }
  };

  // Refresh submissions data to fix user information
  const refreshSubmissionsData = async () => {
    try {
      console.log('Refreshing submissions data...');
      await fetchSubmissions(selectedChallengeForSubmissions || undefined, selectedChallengeType);
      console.log('Submissions data refreshed');
    } catch (error) {
      console.error('Error refreshing submissions:', error);
    }
  };

  // Add refresh button to the stats section
  const addRefreshButton = () => {
    return (
      <Button
        onClick={refreshSubmissionsData}
        variant="outline"
        className="border-gray-600 text-gray-300 hover:bg-gray-800"
        title="Refresh submissions data"
      >
        <Clock className="w-4 h-4 mr-2" />
        Refresh Data
      </Button>
    );
  };
  useEffect(() => {
    const newScore = calculateScore(rankingForm.rankingCriteria);
    const newRank = calculateRank(newScore);
    setRankingForm(prev => ({ 
      ...prev, 
      score: newScore,
      rank: newRank
    }));
  }, [rankingForm.rankingCriteria]);

  useEffect(() => {
    fetchAllChallenges();
  }, []);

  const handleSubmitRanking = async () => {
    if (!selectedSubmission) return;
    
    try {
      console.log('=== DEBUGGING SUBMISSION RANKING ===');
      console.log('1. Original rankingForm state:', JSON.stringify(rankingForm, null, 2));
      console.log('2. Selected submission:', JSON.stringify(selectedSubmission, null, 2));
      
      // Validate ranking criteria before sending
      if (!rankingForm.rankingCriteria || 
          typeof rankingForm.rankingCriteria !== 'object' ||
          Object.keys(rankingForm.rankingCriteria).length === 0) {
        console.error('Invalid ranking criteria:', rankingForm.rankingCriteria);
        return;
      }
      
      // Create a clean copy of ranking criteria to avoid any corruption
      const cleanRankingCriteria = {
        codeQuality: Number(rankingForm.rankingCriteria.codeQuality) || 0,
        functionality: Number(rankingForm.rankingCriteria.functionality) || 0,
        creativity: Number(rankingForm.rankingCriteria.creativity) || 0,
        documentation: Number(rankingForm.rankingCriteria.documentation) || 0
      };
      
      console.log('3. Clean ranking criteria:', JSON.stringify(cleanRankingCriteria, null, 2));
      
      // Prepare the review data
      const reviewData = {
        status: rankingForm.status,
        score: rankingForm.score,
        feedback: rankingForm.feedback,
        rankingCriteria: cleanRankingCriteria,
        rank: rankingForm.rank,
        content: selectedSubmission.content || {
          description: '',
          githubUrl: '',
          files: []
        }
      };

      console.log('4. Final review data to send:', JSON.stringify(reviewData, null, 2));
      console.log('5. Review data types:', {
        status: typeof reviewData.status,
        score: typeof reviewData.score,
        feedback: typeof reviewData.feedback,
        rankingCriteria: typeof reviewData.rankingCriteria,
        rank: typeof reviewData.rank,
        content: typeof reviewData.content
      });
      console.log('=== END DEBUGGING ===');

      // Submit the ranking to the backend
      const updatedSubmission = await submissionService.reviewSubmission(
        selectedSubmission._id,
        {
          status: rankingForm.status,
          score: rankingForm.score,
          feedback: rankingForm.feedback,
          rankingCriteria: cleanRankingCriteria,
          rank: rankingForm.rank,
          content: selectedSubmission.content || {
            description: '',
            githubUrl: '',
            files: []
          }
        }
      );

      console.log('Ranking submitted successfully:', updatedSubmission);

      // Update relative rankings for all submissions of this challenge
      await updateAllSubmissionRanks(updatedSubmission);

      // Show success message
      const message = rankingForm.status === 'accepted' 
        ? `Submission approved with score ${rankingForm.score}/100. The user will be notified.`
        : `Submission rejected with feedback. The user will be notified.`;
      
      // Create a professional notification instead of alert
      const notification = document.createElement('div');
      const isSuccess = rankingForm.status === 'accepted';
      notification.className = `fixed top-4 right-4 ${isSuccess ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transform transition-all duration-300 translate-x-full`;
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          ${isSuccess 
            ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 7.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L9 11.586l3.293 3.293a1 1 0 001.414 1.414l-2-2z" clip-rule="evenodd"></path>'
            : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293a1 1 0 00-1.414-1.414L10 8.586 7.707 7.293a1 1 0 00-1.414 0z" clip-rule="evenodd"></path>'
          }
        </svg>
        <span class="font-medium">${message}</span>
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
      }, 100);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 4000);
      
      // Close the dialog
      setViewDialogOpen(false);
      
      // Refresh the submissions list
      if (selectedChallengeForSubmissions) {
        await fetchSubmissions(selectedChallengeForSubmissions);
      } else {
        await fetchSubmissions();
      }
      
    } catch (error: any) {
      console.error('Failed to submit ranking:', error);
      
      // Create professional error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transform transition-all duration-300 translate-x-full';
      errorNotification.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293a1 1 0 00-1.414-1.414L10 8.586 7.707 7.293a1 1 0 00-1.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Failed to submit ranking: ${error.message}</span>
      `;
      
      document.body.appendChild(errorNotification);
      
      // Animate in
      setTimeout(() => {
        errorNotification.classList.remove('translate-x-full');
        errorNotification.classList.add('translate-x-0');
      }, 100);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        errorNotification.classList.add('translate-x-full');
        setTimeout(() => {
          if (errorNotification.parentNode) {
            errorNotification.parentNode.removeChild(errorNotification);
          }
        }, 300);
      }, 5000);
    }
  };

  const handleViewSubmission = (submission: any) => {
    console.log('Opening submission with data:', submission);
    console.log('All submission keys:', Object.keys(submission));
    console.log('Submission structure:', JSON.stringify(submission, null, 2));
    
    setSelectedSubmission(submission);
    
    // Safely extract ranking criteria with fallbacks
    const getRankingCriteria = () => {
      if (submission.rankingCriteria && typeof submission.rankingCriteria === 'object') {
        return {
          codeQuality: Number(submission.rankingCriteria.codeQuality) || 0,
          functionality: Number(submission.rankingCriteria.functionality) || 0,
          creativity: Number(submission.rankingCriteria.creativity) || 0,
          documentation: Number(submission.rankingCriteria.documentation) || 0
        };
      }
      return { codeQuality: 0, functionality: 0, creativity: 0, documentation: 0 };
    };
    
    const rankingCriteria = getRankingCriteria();
    const calculatedScore = rankingCriteria.codeQuality + rankingCriteria.functionality + rankingCriteria.creativity + rankingCriteria.documentation;
    
    setRankingForm({
      status: submission.status === 'pending' ? 'accepted' : (submission.status === 'approved' ? 'accepted' : submission.status) as 'accepted' | 'rejected',
      score: submission.score || calculatedScore,
      rank: submission.rank || '',
      rankingCriteria,
      feedback: submission.feedback || submission.reviewComments || ''
    });
    setViewDialogOpen(true);
  };

  const fetchAllChallenges = async () => {
    try {
      setLoading(true);
      
      // Fetch regular challenges
      const challengesData = await challengeService.getAllChallenges({ limit: 100 });
      const regularChallenges = challengesData?.data?.challenges || [];
      
      // Fetch weekly challenges
      const weeklyData = await challengeService.getAllWeeklyChallenges({ limit: 100 });
      const weeklyChallengesList = weeklyData?.weeklyChallenges || [];
      
      setChallenges(regularChallenges);
      setWeeklyChallenges(weeklyChallengesList);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (challengeId?: string, challengeType?: string) => {
    try {
      let allSubmissions: any[] = [];
      
      if (challengeId) {
        // Fetch submissions for a specific challenge
        const submissionsData = await submissionService.getChallengeSubmissions(challengeId);
        const challengeDetails = [...challenges, ...weeklyChallenges].find(c => c._id === challengeId);
        
        console.log('Raw submissions data:', submissionsData);
        
        // Merge challenge details into submissions
        allSubmissions = (submissionsData?.data || []).map(submission => ({
          ...submission,
          challenge: challengeDetails
        }));
      } else if (challengeType && challengeType !== 'all') {
        // Fetch submissions by challenge type
        const allSubmissionsData = await submissionService.getAllSubmissions({ challengeType });
        allSubmissions = allSubmissionsData?.data || [];
        
        console.log('Raw submissions data by type:', allSubmissionsData);
        
        // Merge challenge details
        allSubmissions = allSubmissions.map(submission => {
          const challengeDetails = [...challenges, ...weeklyChallenges].find(c => c._id === submission.challengeId);
          return {
            ...submission,
            challenge: challengeDetails
          };
        });
      } else {
        // Fetch all submissions across all challenges
        const allSubmissionsData = await submissionService.getAllSubmissions();
        allSubmissions = allSubmissionsData?.data || [];
        
        console.log('All raw submissions data:', allSubmissionsData);
        
        // Merge challenge details
        allSubmissions = allSubmissions.map(submission => {
          const challengeDetails = [...challenges, ...weeklyChallenges].find(c => c._id === submission.challengeId);
          return {
            ...submission,
            challenge: challengeDetails
          };
        });
      }
      
      console.log('Final processed submissions:', allSubmissions);
      setSubmissions(allSubmissions);
      
      // Update stats
      const newStats = {
        totalSubmissions: allSubmissions.length,
        pendingSubmissions: allSubmissions.filter(s => s.status === 'pending').length,
        acceptedSubmissions: allSubmissions.filter(s => s.status === 'accepted').length,
        rejectedSubmissions: allSubmissions.filter(s => s.status === 'rejected').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  useEffect(() => {
    fetchSubmissions(selectedChallengeForSubmissions || undefined, selectedChallengeType);
  }, [selectedChallengeForSubmissions, selectedChallengeType, challenges, weeklyChallenges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Remove duplicate stats calculation since we now use the stats state

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'reviewed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending':
      case 'under_review':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'reviewed': return <Star className="w-4 h-4" />;
      case 'pending':
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Code Review</h2>
          <p className="text-gray-400">Review and manage challenge submissions</p>
        </div>
        <Button
          onClick={refreshSubmissionsData}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
          title="Refresh submissions data to fix user information"
        >
          <Clock className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Submissions</p>
              <p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-green-800 border border-green-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pendingSubmissions}</p>
            </div>
            <Clock className="w-8 h-8 text-green-300" />
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
              <p className="text-purple-200 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-white">{stats.acceptedSubmissions}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-600 to-red-800 border border-red-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-white">{stats.rejectedSubmissions}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-300" />
          </div>
        </motion.div>
      </div>

      {/* Challenge Selector */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2 block">Challenge Type</Label>
            <select
              value={selectedChallengeType}
              onChange={(e) => {
                setSelectedChallengeType(e.target.value);
                setSelectedChallengeForSubmissions(null); // Reset specific challenge when type changes
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Challenge Types</option>
              <option value="regular">Regular Challenges</option>
              <option value="weekly">Weekly Challenges</option>
              <option value="daily">Daily Challenges</option>
              <option value="business">Business Ideas</option>
              <option value="mentorship">Mentorship</option>
              <option value="hackathon">Hackathon</option>
              <option value="competition">Competition</option>
            </select>
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2 block">Specific Challenge</Label>
            <select
              value={selectedChallengeForSubmissions || ''}
              onChange={(e) => setSelectedChallengeForSubmissions(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              disabled={selectedChallengeType !== 'all' && selectedChallengeType !== 'regular' && selectedChallengeType !== 'weekly'}
            >
              <option value="">All Challenges</option>
              {selectedChallengeType === 'all' || selectedChallengeType === 'regular' ? (
                <>
                  <optgroup label="Regular Challenges">
                    {challenges.map((challenge) => (
                      <option key={challenge._id} value={challenge._id}>
                        {challenge.title} ({challenge.status})
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : null}
              {selectedChallengeType === 'all' || selectedChallengeType === 'weekly' ? (
                <>
                  <optgroup label="Weekly Challenges">
                    {weeklyChallenges.map((challenge) => (
                      <option key={challenge._id} value={challenge._id}>
                        Week {challenge.weekNumber} - {challenge.title} ({challenge.category})
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : null}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSelectedChallengeForSubmissions(null);
                setSelectedChallengeType('all');
              }}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing: <span className="text-white font-medium">
              {selectedChallengeType === 'all' ? 'All Challenge Types' : 
               selectedChallengeType === 'regular' ? 'Regular Challenges' :
               selectedChallengeType === 'weekly' ? 'Weekly Challenges' :
               selectedChallengeType.charAt(0).toUpperCase() + selectedChallengeType.slice(1) + ' Challenges'}
            </span>
            {selectedChallengeForSubmissions && (
              <span className="ml-2">
                → <span className="text-white font-medium">
                  {[...challenges, ...weeklyChallenges].find(c => c._id === selectedChallengeForSubmissions)?.title || 'Selected Challenge'}
                </span>
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Total: <span className="text-white font-medium">{stats.totalSubmissions} submissions</span>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">All Submissions</h3>
        {submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission._id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                    {(() => {
                      const avatar = submission.userId?.avatar || 
                                   submission.user?.avatar ||
                                   // Extract from challenge participants for weekly challenges
                                   (submission.challenge?.participants?.find((p: any) => 
                                     p.user && (
                                       submission.challenge?.submissions?.find((s: any) => 
                                         s._id === submission._id && s.user === p.user._id
                                       )
                                     )
                                   )?.user?.avatar) ||
                                   // Fallback to first participant
                                   submission.challenge?.participants?.[0]?.user?.avatar;
                      return avatar ? (
                        <img 
                          src={avatar} 
                          alt={(() => {
                            const userName = submission.userId?.fullName || 
                                           submission.user?.fullName || 
                                           submission.challenge?.participants?.[0]?.user?.fullName ||
                                           'User';
                            return userName;
                          })()} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {(() => {
                        // Try multiple possible user data locations
                        const userName = submission.userId?.fullName || 
                                       submission.user?.fullName || 
                                       submission.participant?.fullName ||
                                       submission.submittedBy?.fullName ||
                                       // Extract from challenge participants for weekly challenges
                                       (submission.challenge?.participants?.find((p: any) => 
                                         p.user && (
                                           submission.challenge?.submissions?.find((s: any) => 
                                             s._id === submission._id && s.user === p.user._id
                                           )
                                         )
                                       )?.user?.fullName) ||
                                       // Fallback to first participant if submission user match not found
                                       submission.challenge?.participants?.[0]?.user?.fullName ||
                                       'Unknown User';
                        console.log('User name options:', {
                          'userId.fullName': submission.userId?.fullName,
                          'user.fullName': submission.user?.fullName,
                          'participant.fullName': submission.participant?.fullName,
                          'submittedBy.fullName': submission.submittedBy?.fullName,
                          'challenge.participants[0].user.fullName': submission.challenge?.participants?.[0]?.user?.fullName,
                          'final': userName
                        });
                        return userName;
                      })()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {submission.challenge?.title || 
                       `${submission.challengeType?.charAt(0).toUpperCase() + submission.challengeType?.slice(1) || 'Unknown'} Challenge` ||
                       `Challenge ID: ${submission.challengeId || 'Unknown'}`
                      }
                    </p>
                    <p className="text-gray-500 text-xs">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Rank Badge */}
                  {submission.rank && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Trophy className="w-3 h-3 mr-1" />
                      {submission.rank}
                    </Badge>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    submission.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    submission.status === 'pending' || submission.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {submission.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubmission(submission)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No submissions found</p>
          </div>
        )}
      </Card>

      {/* View Submission Detail Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Submission Details
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="text-white font-medium">{selectedSubmission.userId?.fullName || selectedSubmission.user?.fullName || 'Unknown User'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Username</p>
                    <p className="text-white font-medium">@{selectedSubmission.userId?.username || selectedSubmission.user?.username || 'unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">{selectedSubmission.userId?.email || selectedSubmission.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Submission Date</p>
                    <p className="text-white font-medium">
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Information */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Submission Information</h3>
                <div className="space-y-3">
                  {/* GitHub URL */}
                  <div>
                    <p className="text-sm text-gray-400">GitHub Repository</p>
                    {selectedSubmission?.githubUrl ? (
                      <a
                        href={selectedSubmission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedSubmission.githubUrl}
                      </a>
                    ) : (
                      <p className="text-gray-500">No GitHub URL provided</p>
                    )}
                  </div>

                  {/* Live URL - show if it exists */}
                  <div>
                    <p className="text-sm text-gray-400">Live Demo</p>
                    {selectedSubmission?.liveUrl ? (
                      <a
                        href={selectedSubmission.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedSubmission.liveUrl}
                      </a>
                    ) : selectedSubmission?.githubUrl ? (
                      <a
                        href={selectedSubmission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedSubmission.githubUrl}
                      </a>
                    ) : (
                      <p className="text-gray-500">No live demo URL provided</p>
                    )}
                    {selectedSubmission?.liveUrl && selectedSubmission.liveUrl === selectedSubmission.githubUrl && (
                      <p className="text-xs text-gray-500 mt-1 italic">Note: Live demo URL is same as GitHub repository</p>
                    )}
                  </div>

                  {/* Description */}
                  {selectedSubmission?.description && selectedSubmission.description.trim() !== '' ? (
                    <div>
                      <p className="text-sm text-gray-400">Description</p>
                      <p className="text-white">{selectedSubmission.description}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-400">Description</p>
                      <p className="text-gray-500 italic">No description provided</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <Badge className={getStatusColor(selectedSubmission.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedSubmission.status)}
                          {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                        </div>
                      </Badge>
                    </div>
                    
                    {selectedSubmission.score && (
                      <div>
                        <p className="text-sm text-gray-400">Score</p>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Star className="w-3 h-3 mr-1" />
                          {selectedSubmission.score}/100
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ranking Section */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Ranking & Evaluation
                </h3>
                <div className="space-y-4">
                  {/* Status and Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-400">Status</Label>
                      <select
                        value={rankingForm.status}
                        onChange={(e) => setRankingForm(prev => ({ ...prev, status: e.target.value as 'accepted' | 'rejected' }))}
                        className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Score (Auto-calculated)</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rankingForm.score}
                        readOnly
                        className="w-full mt-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Automatically calculated from evaluation criteria</p>
                    </div>
                  </div>

                  {/* Rank */}
                  <div>
                    <Label className="text-sm text-gray-400">Rank Position (Auto-calculated)</Label>
                    <input
                      type="text"
                      value={rankingForm.rank}
                      readOnly
                      className="w-full mt-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Automatically calculated based on total score</p>
                  </div>

                  {/* Ranking Criteria */}
                  <div>
                    <Label className="text-sm text-gray-400 mb-3 block">Evaluation Criteria (0-25 each)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center justify-between">
                          <span>Code Quality</span>
                          <span className="text-blue-400">{rankingForm.rankingCriteria.codeQuality || 0}/25</span>
                        </Label>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={rankingForm.rankingCriteria.codeQuality === 0 ? '' : rankingForm.rankingCriteria.codeQuality}
                          onFocus={() => {
                            if (rankingForm.rankingCriteria.codeQuality === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, codeQuality: 0 }
                              }));
                            }
                          }}
                          onClick={() => {
                            if (rankingForm.rankingCriteria.codeQuality === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, codeQuality: 0 }
                              }));
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, codeQuality: 0 }
                              }));
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
                                setRankingForm(prev => ({
                                  ...prev,
                                  rankingCriteria: { ...prev.rankingCriteria, codeQuality: numValue }
                                }));
                              }
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter score (0-25)"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center justify-between">
                          <span>Functionality</span>
                          <span className="text-green-400">{rankingForm.rankingCriteria.functionality || 0}/25</span>
                        </Label>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={rankingForm.rankingCriteria.functionality === 0 ? '' : rankingForm.rankingCriteria.functionality}
                          onFocus={() => {
                            if (rankingForm.rankingCriteria.functionality === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, functionality: 0 }
                              }));
                            }
                          }}
                          onClick={() => {
                            if (rankingForm.rankingCriteria.functionality === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, functionality: 0 }
                              }));
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, functionality: 0 }
                              }));
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
                                setRankingForm(prev => ({
                                  ...prev,
                                  rankingCriteria: { ...prev.rankingCriteria, functionality: numValue }
                                }));
                              }
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter score (0-25)"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center justify-between">
                          <span>Creativity</span>
                          <span className="text-purple-400">{rankingForm.rankingCriteria.creativity || 0}/25</span>
                        </Label>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={rankingForm.rankingCriteria.creativity === 0 ? '' : rankingForm.rankingCriteria.creativity}
                          onFocus={() => {
                            if (rankingForm.rankingCriteria.creativity === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, creativity: 0 }
                              }));
                            }
                          }}
                          onClick={() => {
                            if (rankingForm.rankingCriteria.creativity === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, creativity: 0 }
                              }));
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, creativity: 0 }
                              }));
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
                                setRankingForm(prev => ({
                                  ...prev,
                                  rankingCriteria: { ...prev.rankingCriteria, creativity: numValue }
                                }));
                              }
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter score (0-25)"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 flex items-center justify-between">
                          <span>Documentation</span>
                          <span className="text-yellow-400">{rankingForm.rankingCriteria.documentation || 0}/25</span>
                        </Label>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={rankingForm.rankingCriteria.documentation === 0 ? '' : rankingForm.rankingCriteria.documentation}
                          onFocus={() => {
                            if (rankingForm.rankingCriteria.documentation === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, documentation: 0 }
                              }));
                            }
                          }}
                          onClick={() => {
                            if (rankingForm.rankingCriteria.documentation === 0) {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, documentation: 0 }
                              }));
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, documentation: 0 }
                              }));
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
                                setRankingForm(prev => ({
                                  ...prev,
                                  rankingCriteria: { ...prev.rankingCriteria, documentation: numValue }
                                }));
                              }
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter score (0-25)"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                        />
                      </div>
                    </div>
                    
                    {/* Score Summary */}
                    <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Total Score:</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${
                            rankingForm.score >= 80 ? 'text-green-400' :
                            rankingForm.score >= 60 ? 'text-yellow-400' :
                            rankingForm.score >= 40 ? 'text-orange-400' :
                            'text-red-400'
                          }`}>
                            {rankingForm.score}
                          </span>
                          <span className="text-gray-400">/100</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              rankingForm.score >= 80 ? 'bg-green-500' :
                              rankingForm.score >= 60 ? 'bg-yellow-500' :
                              rankingForm.score >= 40 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${rankingForm.score}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Score Grade */}
                      <div className="mt-2 text-xs text-gray-400">
                        Grade: {
                          rankingForm.score >= 90 ? 'Excellent (A+)' :
                          rankingForm.score >= 80 ? 'Good (A)' :
                          rankingForm.score >= 70 ? 'Above Average (B+)' :
                          rankingForm.score >= 60 ? 'Average (B)' :
                          rankingForm.score >= 50 ? 'Below Average (C)' :
                          rankingForm.score >= 40 ? 'Poor (D)' :
                          'Very Poor (F)'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <Label className="text-sm text-gray-400">Feedback</Label>
                    <textarea
                      value={rankingForm.feedback}
                      onChange={(e) => setRankingForm(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Provide detailed feedback for the submission..."
                      rows={4}
                      className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              {selectedSubmission.feedback && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Previous Feedback
                  </h3>
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-white">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}

              {/* Challenge Information */}
              {selectedSubmission.challenge && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Challenge Information</h3>
                  <div>
                    <p className="text-sm text-gray-400">Challenge</p>
                    <p className="text-white font-medium">{selectedSubmission.challenge.title}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Close
                </Button>
                <Button 
                  onClick={handleSubmitRanking}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {selectedSubmission.score > 0 || selectedSubmission.status === 'approved' || selectedSubmission.status === 'accepted' ? 'Update Ranking' : 'Save Ranking'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionsSimple;
