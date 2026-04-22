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



import { ChallengeLeaderboard } from '../../components/weekly-challenge/ChallengeLeaderboard';



// import { ResourcesCard } from './components/resources-card';



// import { TimelineTracker } from './components/timeline-tracker';



import { Toaster } from '../../components/ui/sonner';

import { toast } from 'sonner';



import { UploadSection } from '../../components/upload-section';



import { ResourcesCard } from '../../components/resources-card';



import { WinnersSection } from '../../components/winners-section';



import { useUser } from '../../context/UserContext';



import { authService } from '../../services/auth';



import { Trophy } from 'lucide-react';



import { Button } from '../../components/ui/button';



import { Select } from '../../components/ui/select';



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



  const [showLeaderboard, setShowLeaderboard] = useState(false);



  const [showPreviousRankings, setShowPreviousRankings] = useState(false);



  const [previousChallengeId, setPreviousChallengeId] = useState<string | null>(null);



  const [allCompletedChallenges, setAllCompletedChallenges] = useState<any[]>([]);



  const [allChallengesForDropdown, setAllChallengesForDropdown] = useState<any[]>([]);







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



  // Fetch all completed weekly challenges for dropdown

  useEffect(() => {

    const fetchCompletedChallenges = async () => {

      try {

        console.log('🔍 Fetching all completed challenges...');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        const response = await fetch(`${API_URL}/weekly-challenges?status=completed&sort=weekNumber:desc`, {

          headers: {

            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`

          }

        });



        if (response.ok) {

          const data = await response.json();

          console.log('🔍 Completed challenges response:', data);

          

          if (data.success && data.data.weeklyChallenges && data.data.weeklyChallenges.length > 0) {

            const completed = data.data.weeklyChallenges;

            console.log('🔍 Setting completed challenges:', completed.length);

            setAllCompletedChallenges(completed);

            

            // Create dropdown options - only add current challenge if it exists
            let dropdownOptions: any[] = [];

            if (challenge) {
              dropdownOptions.push({
                _id: 'current',
                weekNumber: challenge?.weekNumber || 'Current',
                title: challenge?.title || 'Current Challenge',
                isCurrent: true,
                deadlinePassed: challengeEnded
              });
            }

            dropdownOptions = [
              ...dropdownOptions,
              ...completed.map((c: any) => ({
                ...c,
                isCurrent: false,
                deadlinePassed: true
              }))
            ];

            

            setAllChallengesForDropdown(dropdownOptions);

            

            // Make challenges available to Select component via window context

            (window as any).allCompletedChallenges = dropdownOptions;

            

            // Don't auto-select any challenge - let user choose

            console.log('🔍 No auto-selection - user must choose challenge');

            setPreviousChallengeId(null);

          } else {

            console.log('🔍 No completed challenges found');

            setAllCompletedChallenges([]);

            

            // Only add current challenge if it exists
            let dropdownOptions: any[] = [];

            if (challenge) {
              dropdownOptions = [{
                _id: 'current',
                weekNumber: challenge?.weekNumber || 'Current',
                title: challenge?.title || 'Current Challenge',
                isCurrent: true,
                deadlinePassed: challengeEnded
              }];
            }

            setAllChallengesForDropdown(dropdownOptions);

            (window as any).allCompletedChallenges = dropdownOptions;

          }

        } else {

          console.error('🔍 Failed to fetch completed challenges:', response.status);

        }

      } catch (error) {

        console.error('🔍 Error fetching completed challenges:', error);

      }

    };



    // Always fetch completed challenges for dropdown (even when no active challenge)
    fetchCompletedChallenges();

  }, [challenge, challengeEnded]); // Run when challenge and deadline status are available







  const handleJoinClick = () => {



    setRegistrationModalOpen(true);



  };







  const handleRegistrationSuccess = (mode: 'solo' | 'team') => {



    setIsRegistered(true);



    setRegistrationMode(mode);



    setRegistrationModalOpen(false);



  };







  const handleViewRankings = () => {

    if (!previousChallengeId) {

      toast.error('Please select a challenge to view rankings');

      return;

    }



    const selectedChallenge = allChallengesForDropdown.find(c => c._id === previousChallengeId);

    

    if (!selectedChallenge) {

      toast.error('Invalid challenge selection');

      return;

    }



    // Check if it's current challenge and deadline hasn't passed

    if (selectedChallenge.isCurrent && !selectedChallenge.deadlinePassed) {

      toast.error('Rankings Not Available Yet', {

        description: 'Rankings will be available after the submission deadline. Please check back after the deadline.',

        duration: 6000,

      });

      return;

    }



    // Show appropriate rankings

    if (selectedChallenge.isCurrent) {

      setShowLeaderboard(true);

    } else {

      setShowPreviousRankings(true);

    }

  };



  const handleChallengeChange = (challengeId: string) => {

    setPreviousChallengeId(challengeId);

    console.log('🔍 Selected challenge:', challengeId);

  };



  const handleBackFromPreviousRankings = () => {

    setShowPreviousRankings(false);

  };



  const handleViewNextChallenge = () => {

    // Navigate back to current challenge (like back to challenge button)

    setShowLeaderboard(false);

    setShowPreviousRankings(false); // Also hide previous rankings if shown

  };



  const handleBackToChallenge = () => {

    setShowLeaderboard(false);

  };







  return (



    <div className="min-h-screen bg-gradient-to-br">



      <Toaster />







      {/* Main Container */}



      <div className="container mx-auto px-4 py-8 max-w-7xl">



        



        



        <ChallengeHeader 



          challengeTitle={challenge?.title || "Build Real Project" }



          challengeDifficulty={challenge?.difficulty || "Intermediate"}



          challengePoints={500}



        />







        {/* Main Grid Layout */}



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">



          {/* Left Column - Main Content */}



          <div className="lg:col-span-2 space-y-6">



            {showLeaderboard ? (

              // Show Challenge Leaderboard

              <div>

                <div className="flex items-center justify-between mb-4">

                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">

                    <Trophy className="text-yellow-400" />

                    Challenge Rankings

                  </h2>

                  <Button

                    onClick={handleBackToChallenge}

                    variant="outline"

                    className="border-gray-600 text-gray-300 hover:bg-gray-800"

                  >

                    Back to Challenge

                  </Button>

                </div>

                <ChallengeLeaderboard

                  challengeId={challenge?._id}

                  onViewNextChallenge={handleViewNextChallenge}

                />

              </div>

            ) : showPreviousRankings ? (

              // Show Previous Challenge Rankings

              <div>

                <div className="flex items-center justify-between mb-4">

                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">

                    <Trophy className="text-gray-400" />

                    Previous Challenge Rankings

                  </h2>

                  <Button

                    onClick={handleBackFromPreviousRankings}

                    variant="outline"

                    className="border-gray-600 text-gray-300 hover:bg-gray-800"

                  >

                    Back to Challenge

                  </Button>

                </div>

                {previousChallengeId && (

                  <ChallengeLeaderboard

                    challengeId={previousChallengeId}

                    onViewNextChallenge={handleViewNextChallenge}

                  />

                )}

              </div>

            ) : (

              // Show Regular Challenge Content

              <>

                <ChallengeOverviewCard
                  isRegistered={isRegistered}
                  onJoinClick={handleJoinClick}
                  challengeId={id} // Pass URL parameter or undefined to fetch first active
                  onChallengeLoaded={setChallenge} // Set challenge when loaded
                />



                {isRegistered && (

                  <div className="mb-6">

                    <div className="flex items-center justify-between">

                      <h3 className="text-lg font-semibold text-white">Your Submission</h3>

                      <div className="flex items-center gap-3">

                        <div className="flex items-center gap-2">

                          <Trophy className="w-4 h-4 text-gray-400" />

                          <span className="text-sm text-gray-400">Rankings:</span>

                          <Select

                            value={previousChallengeId || ''}

                            onValueChange={handleChallengeChange}

                            className="w-56"

                          >

                            <Select.Trigger>

                              <Select.Value placeholder="Select challenge" />

                            </Select.Trigger>

                            <Select.Content>

                              {allChallengesForDropdown.map((challenge) => (

                                <Select.Item key={challenge._id} value={challenge._id}>

                                  {challenge.isCurrent ? `Current Challenge (Week ${challenge.weekNumber})` : `Week ${challenge.weekNumber}`}

                                  {!challenge.deadlinePassed && !challenge.isCurrent && (

                                    <span className="text-xs text-gray-500 ml-2">- After deadline</span>

                                  )}

                                </Select.Item>

                              ))}

                            </Select.Content>

                          </Select>

                        </div>

                        <Button

                          onClick={handleViewRankings}

                          disabled={!previousChallengeId}

                          className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"

                        >

                          <Trophy className="w-4 h-4 mr-2" />

                          View Rankings

                        </Button>

                      </div>

                    </div>

                  </div>

                )}

                {/* Show UploadSection only if there's an active challenge */}
                {challenge ? (
                  <UploadSection 
                    registrationMode={registrationMode} 
                    challengeId={challenge?._id} 
                    challengeType="weekly" 
                    userId={user?._id}
                    onSubmissionSuccess={() => {
                      // Refresh challenge data to update timeline
                      setChallenge((prev: any) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          submissions: [
                            ...(prev.submissions || []),
                            {
                              user: user?._id,
                              submittedAt: new Date(),
                              status: 'submitted'
                            }
                          ]
                        };
                      });
                    }}
                  />
                ) : (
                  /* Show rankings button when there's no active challenge */
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Your Submission</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Rankings:</span>
                          <Select
                            value={previousChallengeId || ''}
                            onValueChange={handleChallengeChange}
                            className="w-56"
                          >
                            <Select.Trigger>
                              <Select.Value placeholder="Select challenge" />
                            </Select.Trigger>
                            <Select.Content>
                              {allChallengesForDropdown.map((challenge) => (
                                <Select.Item key={challenge._id} value={challenge._id}>
                                  {challenge.isCurrent ? `Current Challenge (Week ${challenge.weekNumber})` : `Week ${challenge.weekNumber}`}
                                  {!challenge.deadlinePassed && !challenge.isCurrent && (
                                    <span className="text-xs text-gray-500 ml-2">- After deadline</span>
                                  )}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </div>
                        <Button
                          onClick={handleViewRankings}
                          disabled={!previousChallengeId}
                          className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          View Rankings
                        </Button>
                      </div>
                    </div>
                  </div>
                )}



                <ScoringCriteria />



                {challengeEnded && <WinnersSection />}



                <DiscussionSection challengeId={challenge?._id} />

              </>

            )}



          </div>







          {/* Right Column - Sidebar */}



          <div className="space-y-6">



            <LiveStats challengeId={challenge?._id} challengeType="weekly" />



            {/* <AIMentor /> */}



            <ResourcesCard challengeResources={challenge?.resources} />



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



