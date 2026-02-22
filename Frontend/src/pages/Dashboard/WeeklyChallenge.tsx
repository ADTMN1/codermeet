import React, { useState, useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';



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

  const navigate = useNavigate();

  const { id } = useParams(); // Get challenge ID from URL params

  const [isRegistered, setIsRegistered] = useState(false);

  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  const [registrationMode, setRegistrationMode] = useState<'solo' | 'team'>(

    'solo'

  );

  const [challenge, setChallenge] = useState<any>(null); // Add challenge state

  const [submission, setSubmission] = useState<any>(null); // Add submission state



  // Challenge deadline passed (set to false initially, true to show winners)

  const [challengeEnded, setChallengeEnded] = useState(false);



  // Prevent auto-scroll to discussion section on page load
  useEffect(() => {
    // Clear any hash that might cause scroll
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Ensure we start at the top of page
    window.scrollTo(0, 0);
    
    // Prevent any programmatic scrolling for first 3 seconds
    const originalScrollTo = window.scrollTo;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    
    window.scrollTo = () => {
      console.log('Prevented programmatic scroll');
    };
    
    Element.prototype.scrollIntoView = () => {
      console.log('Prevented scrollIntoView');
    };
    
    // Restore after 3 seconds
    setTimeout(() => {
      window.scrollTo = originalScrollTo;
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }, 3000);
  }, []);

  // Check if user is registered for current challenge

  useEffect(() => {

    if (!user?._id || !challenge?._id) {

      return;

    }

    

    // Check if user is in participants list

    const isUserRegistered = challenge.participants?.some(

      (participant: any) => participant.user?._id === user._id || participant.user === user._id

    );

    setIsRegistered(isUserRegistered);

  }, [user?._id, challenge?._id, challenge?.participants]);



  // Fetch user's submission

  useEffect(() => {

    if (!user?._id || !challenge?._id) {

      return;

    }

    

    // Check if user has submitted in the challenge submissions

    const userSubmission = challenge.submissions?.find(

      (submission: any) => submission.user?._id === user._id || submission.user === user._id

    );

    setSubmission(userSubmission || null);

  }, [user?._id, challenge?._id, challenge?.submissions]);



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

              challengeId={id} // Pass URL parameter or undefined to fetch first active

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

