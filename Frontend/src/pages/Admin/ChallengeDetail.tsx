import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Code,
  Calendar,
  Target,
  Award,
  FileText,
  Users,
  Activity,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { challengeService, Challenge } from '../../services/challengeService';
import { toast } from 'sonner';
import CreateChallengeForm from '../../components/admin/CreateChallengeForm';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);

  // Check if this is a weekly challenge based on route
  const isWeeklyChallenge = location.pathname.includes('/weekly-challenges/');

  useEffect(() => {
    if (id) {
      fetchChallengeDetails(id);
    }
  }, [id]);

  const fetchChallengeDetails = async (challengeId: string) => {
    try {
      setLoading(true);
      const [challengeData, submissionsData] = await Promise.all([
        isWeeklyChallenge 
          ? challengeService.getWeeklyChallengeById(challengeId)
          : challengeService.getChallengeById(challengeId),
        isWeeklyChallenge
          ? challengeService.getWeeklyChallengeSubmissions(challengeId)
          : challengeService.getChallengeSubmissions(challengeId)
      ]);
      
      setChallenge(challengeData);
      setSubmissions(submissionsData?.data || []);
    } catch (error: any) {
      toast.error('Failed to load challenge details');
      navigate(isWeeklyChallenge ? '/admin/weekly-challenges' : '/admin/challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!challenge || !confirm(`Are you sure you want to delete "${challenge.title}"?`)) {
      return;
    }

    try {
      await challengeService.deleteChallenge(challenge._id);
      toast.success('Challenge deleted successfully');
      navigate(isWeeklyChallenge ? '/admin/weekly-challenges' : '/admin/challenges');
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-400 mb-2">Challenge Not Found</h3>
        <Button onClick={() => navigate('/admin/challenges')} className="bg-red-600 hover:bg-red-700">
          Back to Challenges
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/challenges')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{challenge.title}</h1>
            <p className="text-gray-400">Challenge Details and Management</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
            className="border-green-600 text-green-400 hover:bg-green-600/10"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Challenge
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteChallenge}
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Challenge Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Challenge Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                <p className="text-gray-300">{challenge.description}</p>
              </div>
              
              {challenge.requirements && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Requirements</h3>
                  <p className="text-gray-300">{challenge.requirements}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {challenge.category}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {challenge.currentParticipants || 0} participants
                </span>
              </div>
            </div>
          </Card>

          {/* Submissions */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Submissions</h2>
            {submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {submission.user?.fullName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{submission.user?.fullName || 'Unknown User'}</p>
                        <p className="text-gray-400 text-sm">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : submission.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className="text-sm text-gray-300">{submission.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No submissions yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Start Date</p>
                  <p className="text-white font-medium">
                    {new Date(challenge.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">End Date</p>
                  <p className="text-white font-medium">
                    {new Date(challenge.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Submissions</span>
                <span className="text-white font-medium">{submissions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Success Rate</span>
                <span className="text-white font-medium">
                  {submissions.length > 0 
                    ? Math.round((submissions.filter(s => s.status === 'approved').length / submissions.length) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prize Pool</span>
                <span className="text-white font-medium">
                  {challenge.prizes?.reduce((total, prize) => total + prize.value, 0) || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Challenge Modal */}
      {showEditForm && challenge && (
        <CreateChallengeForm
          challenge={challenge}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            fetchChallengeDetails(challenge._id);
          }}
        />
      )}
    </div>
  );
};

export default ChallengeDetail;
