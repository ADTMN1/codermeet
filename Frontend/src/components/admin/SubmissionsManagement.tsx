import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { submissionService, Submission } from '../../services/submissionService';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Star, 
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';

interface SubmissionsManagementProps {
  challengeId?: string;
}

export function SubmissionsManagement({ challengeId }: SubmissionsManagementProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewForm, setReviewForm] = useState({
    status: 'pending' as 'accepted' | 'rejected',
    score: 0,
    feedback: ''
  });

  useEffect(() => {
    if (challengeId) {
      fetchSubmissions();
    } else {
      // If no challengeId provided, fetch all submissions across all challenges
      fetchAllSubmissions();
    }
  }, [challengeId]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, searchTerm]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const result = await submissionService.getChallengeSubmissions(challengeId || '', statusFilter !== 'all' ? statusFilter : undefined);
      setSubmissions(result.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true);
      const result = await submissionService.getAllSubmissions(statusFilter !== 'all' ? statusFilter : undefined);
      setSubmissions(result.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch all submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.userId.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.githubUrl.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      status: submission.status === 'pending' ? 'accepted' : submission.status as 'accepted' | 'rejected',
      score: submission.score || 0,
      feedback: submission.feedback || ''
    });
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission || !challengeId) return;

    try {
      const updatedSubmission = await submissionService.reviewSubmission(
        challengeId,
        selectedSubmission._id,
        reviewForm
      );

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub._id === selectedSubmission._id ? updatedSubmission : sub
      ));

      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Project Submissions</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-300 border-blue-500/30">
            {filteredSubmissions.length} Total
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-700/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search by name, username, or GitHub URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Status Filter</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchSubmissions}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700/50 p-8 text-center">
            <p className="text-slate-400">No submissions found</p>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission._id} className="bg-slate-900/50 border-slate-700/50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {submission.userId.fullName}
                      </h3>
                      <p className="text-sm text-slate-400">@{submission.userId.username}</p>
                      {(submission as any).challengeTitle && (
                        <p className="text-xs text-blue-400 mt-1">
                          Challenge: {(submission as any).challengeTitle}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(submission.status)}
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </div>
                    </Badge>
                    {submission.score && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <Star className="w-3 h-3 mr-1" />
                        {submission.score}/100
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {submission.githubUrl}
                      </a>
                    </div>

                    {submission.description && (
                      <p className="text-slate-300 text-sm">{submission.description}</p>
                    )}

                    {submission.feedback && (
                      <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-300">Feedback:</p>
                          <p className="text-sm text-slate-400">{submission.feedback}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => handleReview(submission)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submission.status === 'pending' ? 'Review' : 'Update Review'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">
                  {selectedSubmission.userId.fullName} (@{selectedSubmission.userId.username})
                </h4>
                <a
                  href={selectedSubmission.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  {selectedSubmission.githubUrl}
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Status</Label>
                  <select
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value as 'accepted' | 'rejected' }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Score (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={reviewForm.score}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Feedback</Label>
                <Textarea
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Provide feedback for the submission..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} className="bg-blue-600 hover:bg-blue-700">
                  Submit Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
