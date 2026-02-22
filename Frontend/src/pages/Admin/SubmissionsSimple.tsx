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
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
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

  // Update score whenever ranking criteria changes
  useEffect(() => {
    const newScore = calculateScore(rankingForm.rankingCriteria);
    setRankingForm(prev => ({ ...prev, score: newScore }));
  }, [rankingForm.rankingCriteria]);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSubmitRanking = async () => {
    if (!selectedSubmission) return;
    
    try {
      // Prepare the review data
      const reviewData = {
        status: rankingForm.status,
        score: rankingForm.score,
        feedback: rankingForm.feedback,
        rankingCriteria: rankingForm.rankingCriteria,
        rank: rankingForm.rank
      };

      console.log('Submitting ranking:', reviewData);

      // Get challenge ID from submission
      const challengeId = selectedSubmission.challengeId || selectedSubmission.challenge?._id;
      
      if (!challengeId) {
        throw new Error('Challenge ID not found');
      }

      // Submit the ranking to the backend
      const updatedSubmission = await submissionService.reviewSubmission(
        challengeId,
        selectedSubmission._id,
        {
          status: rankingForm.status,
          score: rankingForm.score,
          feedback: rankingForm.feedback,
          rankingCriteria: rankingForm.rankingCriteria,
          rank: rankingForm.rank
        }
      );

      console.log('Ranking submitted successfully:', updatedSubmission);

      // Show success message
      alert(`Submission ${rankingForm.status === 'accepted' ? 'accepted' : 'rejected'} with score ${rankingForm.score}/100. The user will be notified.`);
      
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
      alert(`Failed to submit ranking: ${error.message}`);
    }
  };

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setRankingForm({
      status: submission.status === 'pending' ? 'accepted' : submission.status as 'accepted' | 'rejected',
      score: submission.score || 0,
      rank: submission.rank || '',
      rankingCriteria: {
        codeQuality: submission.rankingCriteria?.codeQuality || 0,
        functionality: submission.rankingCriteria?.functionality || 0,
        creativity: submission.rankingCriteria?.creativity || 0,
        documentation: submission.rankingCriteria?.documentation || 0
      },
      feedback: submission.feedback || ''
    });
    setViewDialogOpen(true);
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const challengesData = await challengeService.getAllChallenges({ limit: 100 });
      setChallenges(challengesData?.data?.challenges || []);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (challengeId?: string) => {
    try {
      if (challengeId) {
        const submissionsData = await challengeService.getChallengeSubmissions(challengeId);
        const challengeDetails = await challengeService.getChallengeById(challengeId);
        
        // Merge challenge details into submissions
        const submissionsWithChallenge = (submissionsData?.data || []).map(submission => ({
          ...submission,
          challenge: challengeDetails
        }));
        
        setSubmissions(submissionsWithChallenge);
      } else {
        // Fetch all submissions across all challenges
        const allSubmissions: any[] = [];
        for (const challenge of challenges) {
          const submissionsData = await challengeService.getChallengeSubmissions(challenge._id);
          const submissionsWithChallenge = (submissionsData?.data || []).map(submission => ({
            ...submission,
            challenge: challenge
          }));
          allSubmissions.push(...submissionsWithChallenge);
        }
        setSubmissions(allSubmissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  useEffect(() => {
    fetchSubmissions(selectedChallengeForSubmissions || undefined);
  }, [selectedChallengeForSubmissions, challenges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const totalSubmissions = challenges.reduce((sum, c) => sum + (c.submissions?.length || 0), 0);
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'reviewed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'reviewed': return <Star className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Code Review</h2>
        <p className="text-gray-400">Review and manage challenge submissions</p>
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
              <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
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
              <p className="text-2xl font-bold text-white">{pendingSubmissions}</p>
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
              <p className="text-2xl font-bold text-white">{approvedSubmissions}</p>
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
              <p className="text-2xl font-bold text-white">{rejectedSubmissions}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-300" />
          </div>
        </motion.div>
      </div>

      {/* Challenge Selector */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
             <select
              value={selectedChallengeForSubmissions || ''}
              onChange={(e) => setSelectedChallengeForSubmissions(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Challenges</option>
              {challenges.map((challenge) => (
                <option key={challenge._id} value={challenge._id}>
                  {challenge.title} ({challenge.status})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setSelectedChallengeForSubmissions(null)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Submissions</h3>
        {submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.slice(0, 10).map((submission) => (
              <div key={submission._id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{submission.userId?.fullName || submission.user?.fullName || 'Unknown User'}</p>
                    <p className="text-gray-400 text-sm">
                      {submission.challenge?.title || `Challenge ID: ${submission.challengeId || 'Unknown'}`}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    submission.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
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
                  <div>
                    <p className="text-sm text-gray-400">GitHub Repository</p>
                    <a
                      href={selectedSubmission.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {selectedSubmission.githubUrl}
                    </a>
                  </div>

                  {/* Live URL for weekly challenges */}
                  {selectedSubmission.liveUrl && (
                    <div>
                      <p className="text-sm text-gray-400">Live Demo URL</p>
                      <a
                        href={selectedSubmission.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedSubmission.liveUrl}
                      </a>
                    </div>
                  )}

                  {/* File Upload Information */}
                  {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400">Uploaded Files</p>
                      <div className="space-y-2">
                        {selectedSubmission.files.map((file: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-white text-sm">{file.filename}</span>
                            {file.size && (
                              <span className="text-gray-500 text-xs ml-auto">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSubmission.description && (
                    <div>
                      <p className="text-sm text-gray-400">Description</p>
                      <p className="text-white">{selectedSubmission.description}</p>
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
                    <Label className="text-sm text-gray-400">Rank Position</Label>
                    <input
                      type="text"
                      value={rankingForm.rank}
                      onChange={(e) => setRankingForm(prev => ({ ...prev, rank: e.target.value }))}
                      placeholder="e.g., 1st, 2nd, 3rd, Honorable Mention"
                      className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
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
                          value={rankingForm.rankingCriteria.codeQuality}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, codeQuality: '' }
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
                          value={rankingForm.rankingCriteria.functionality}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, functionality: '' }
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
                          value={rankingForm.rankingCriteria.creativity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, creativity: '' }
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
                          value={rankingForm.rankingCriteria.documentation}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setRankingForm(prev => ({
                                ...prev,
                                rankingCriteria: { ...prev.rankingCriteria, documentation: '' }
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
                  Save Ranking
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
