import React, { useState, useEffect } from 'react';

import { ChallengeHeader } from '../../components/challenge-header';
// import { ChallengeOverviewCard } from './components/challenge-overview-card';
import { RegistrationModal } from '../../components/registration-modal';
// import { UploadSection } from './components/upload-section';
// import { LiveStats } from './components/live-stats';
import { ScoringCriteria } from '../../components/scoring-criteria';
// import { WinnersSection } from './components/winners-section';
// import { AIMentor } from './components/ai-mentor';
import { DiscussionSection } from '../../components/discussion-section';
import { ChallengeOverviewCard } from '../../components/challenge-overview-card';
import { LiveStats } from '../../components/live-state';
import { TimelineTracker } from '../../components/timeline-tracker';
// import { ResourcesCard } from './components/resources-card';
// import { TimelineTracker } from './components/timeline-tracker';
import { Toaster } from '../../components/ui/sonner';
import { UploadSection } from '../../components/upload-section';
import { ResourcesCard } from '../../components/resources-card';
import { WinnersSection } from '../../components/winners-section';
import { useUser } from '../../context/UserContext';
import { authService } from '../../services/auth';

export default function WeeklyChallenge() {
  const { user } = useUser();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'solo' | 'team'>(
    'solo'
  );
  const [challenge, setChallenge] = useState<any>(null); // Add challenge state
  const [submission, setSubmission] = useState<any>(null); // Add submission state

  // Challenge deadline passed (set to false initially, true to show winners)
  const [challengeEnded, setChallengeEnded] = useState(false);

  // Check if user is registered for the current challenge
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user?._id || !challenge?._id) {
        console.warn('Missing user ID or challenge ID for registration check');
        return;
      }
      
      try {
        const token = authService.getToken();
        if (!token) {
          console.warn('No authentication token available');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/challenges/${challenge._id}/check-registration`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setIsRegistered(data.isRegistered);
        } else {
          console.error('Registration check failed:', data.message);
        }
      } catch (error) {
        console.error('❌ Registration check error:', error);
        // Don't set state on error to avoid UI flicker
      }
    };

    checkRegistration();
  }, [user?._id, challenge?._id]);

  // Fetch user's submission
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?._id || !challenge?._id) {
        console.warn('Missing user ID or challenge ID for submission fetch');
        return;
      }
      
      try {
        const token = authService.getToken();
        if (!token) {
          console.warn('No authentication token available for submission fetch');
          return;
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/challenges/${challenge._id}/my-submission`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            // No submission found - this is expected
            setSubmission(null);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSubmission(data.data);
        } else {
          console.error('Submission fetch failed:', data.message);
          setSubmission(null);
        }
      } catch (error) {
        console.error('❌ Submission fetch error:', error);
        setSubmission(null);
      }
    };

    fetchSubmission();
  }, [user?._id, challenge?._id]);

  const handleJoinClick = () => {
    setRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = (mode: 'solo' | 'team') => {
    setIsRegistered(true);
    setRegistrationMode(mode);
    setRegistrationModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Toaster />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        <ChallengeHeader 
          challengeTitle={challenge?.title || "Build a Real-Time Chat App"}
          challengeDifficulty={challenge?.difficulty || "Intermediate"}
          challengePoints={500}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ChallengeOverviewCard
              isRegistered={isRegistered}
              onJoinClick={handleJoinClick}
              onChallengeLoaded={setChallenge} // Set challenge when loaded
            />

            {isRegistered && (
              <UploadSection registrationMode={registrationMode} challengeId={challenge?._id} />
            )}

            <ScoringCriteria />

            {challengeEnded && <WinnersSection />}

            <DiscussionSection challengeId={challenge?._id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <LiveStats challengeId={challenge?._id} />
            {/* <AIMentor /> */}
            <ResourcesCard />
            <TimelineTracker isRegistered={isRegistered} challenge={challenge} submission={submission} />
          </div>
        </div>
      </div>

      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        onSuccess={handleRegistrationSuccess}
        challengeId={challenge?._id} // Pass the challenge ID
      />
    </div>
  );
}
