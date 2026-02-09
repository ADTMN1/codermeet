const Job = require('../models/job');
const User = require('../models/user');

// Get all jobs with filtering and pagination
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      experience,
      location,
      skills,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by job type
    if (type) {
      query.type = type;
    }

    // Filter by experience level
    if (experience) {
      query.experience = experience;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Featured jobs first
    sortOptions.isFeatured = -1;

    const jobs = await Job.find(query)
      .populate('postedBy', 'fullName username avatar')
      .populate('applicants.user', 'fullName username avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// Get a single job by ID
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'fullName username avatar')
      .populate('applicants.user', 'fullName username avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
};

// Create a new job
const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.id
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('postedBy', 'fullName username avatar');

    res.status(201).json({
      success: true,
      data: populatedJob,
      message: 'Job posted successfully'
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job'
    });
  }
};

// Update a job
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'fullName username avatar');

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// Get applicants for a job
const getJobApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = await Job.findById(jobId).populate('postedBy', 'fullName username avatar');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster or admin
    if (job.postedBy._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applicants for this job'
      });
    }

    // Get applicants with user details
    const jobWithApplicants = await Job.findById(jobId)
      .populate({
        path: 'applicants.user',
        select: 'fullName username avatar email skills experience'
      });

    res.json({
      success: true,
      data: jobWithApplicants.applicants
    });
  } catch (error) {
    console.error('Error fetching job applicants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job applicants'
    });
  }
};

// Accept an applicant
const acceptApplicant = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicantId } = req.body;
    const userId = req.user.id;


    // Validate inputs
    if (!jobId || !applicantId) {
      console.log('❌ ERROR: Missing required fields:', { jobId, applicantId });
      return res.status(400).json({
        success: false,
        message: 'Job ID and Applicant ID are required'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log('❌ ERROR: Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('🔍 DEBUG: Job found:', job._id, 'Posted by:', job.postedBy);

    // Check if user is the job poster or admin
    if (job.postedBy._id.toString() !== userId && req.user.role !== 'admin') {
      console.log('❌ ERROR: Unauthorized access attempt:', {
        jobPostedBy: job.postedBy._id,
        requestUserId: userId,
        userRole: req.user.role
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage applicants for this job'
      });
    }

    console.log('🔍 DEBUG: Authorization check passed');

    // Find the applicant in the job's applicants array
    const jobWithApplicants = await Job.findById(jobId)
      .populate({
        path: 'applicants.user',
        select: 'fullName username avatar email skills experience'
      });

    if (!jobWithApplicants) {
      console.log('❌ ERROR: Could not fetch job with applicants:', jobId);
      return res.status(500).json({
        success: false,
        message: 'Error fetching job with applicants'
      });
    }

    console.log('🔍 DEBUG: Job with applicants fetched:', jobWithApplicants.applicants?.length, 'applicants');

    const applicant = jobWithApplicants.applicants.find(
      app => app.user._id.toString() === applicantId
    );

    if (!applicant) {
      console.log('❌ ERROR: Applicant not found in job:', {
        jobId,
        applicantId,
        totalApplicants: jobWithApplicants.applicants?.length
      });
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    console.log('🔍 DEBUG: Applicant found:', {
      applicantId: applicant.user._id,
      applicantName: applicant.user.fullName,
      currentStatus: applicant.status
    });

    // Update applicant status to accepted using MongoDB positional operator
    const updateResult = await Job.updateOne(
      { _id: jobId, 'applicants.user': applicantId },
      { $set: { 'applicants.$.status': 'accepted' } }
    );

    console.log('🔍 DEBUG: MongoDB update result:', updateResult);

    if (!updateResult) {
      console.log('❌ ERROR: Failed to update applicant status');
      return res.status(500).json({
        success: false,
        message: 'Error updating applicant status'
      });
    }

    console.log('🔍 DEBUG: Applicant status updated successfully');

    // Fetch updated job to return to frontend
    const updatedJob = await Job.findById(jobId)
      .populate({
        path: 'applicants.user',
        select: 'fullName username avatar email skills experience'
      });

    res.json({
      success: true,
      message: 'Applicant accepted successfully',
      data: {
        applicantId,
        status: 'accepted',
        updatedJob: updatedJob
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting applicant',
      error: error.message || 'Unknown error'
    });
  }
};

// Reject an applicant
const rejectApplicant = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicantId } = req.body;
    const userId = req.user.id;

    console.log('🔍 DEBUG: Reject applicant request:', {
      jobId,
      applicantId,
      userId,
      body: req.body
    });

    // Validate inputs
    if (!jobId || !applicantId) {
      console.log('❌ ERROR: Missing required fields:', { jobId, applicantId });
      return res.status(400).json({
        success: false,
        message: 'Job ID and Applicant ID are required'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log('❌ ERROR: Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('🔍 DEBUG: Job found:', job._id, 'Posted by:', job.postedBy);

    // Check if user is the job poster or admin
    if (job.postedBy._id.toString() !== userId && req.user.role !== 'admin') {
      console.log('❌ ERROR: Unauthorized access attempt:', {
        jobPostedBy: job.postedBy._id,
        requestUserId: userId,
        userRole: req.user.role
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage applicants for this job'
      });
    }

    console.log('🔍 DEBUG: Authorization check passed');

    // Find the applicant in the job's applicants array
    const jobWithApplicants = await Job.findById(jobId)
      .populate({
        path: 'applicants.user',
        select: 'fullName username avatar email skills experience'
      });

    if (!jobWithApplicants) {
      console.log('❌ ERROR: Could not fetch job with applicants:', jobId);
      return res.status(500).json({
        success: false,
        message: 'Error fetching job with applicants'
      });
    }

    console.log('🔍 DEBUG: Job with applicants fetched:', jobWithApplicants.applicants?.length, 'applicants');

    const applicant = jobWithApplicants.applicants.find(
      app => app.user._id.toString() === applicantId
    );

    if (!applicant) {
      console.log('❌ ERROR: Applicant not found in job:', {
        jobId,
        applicantId,
        totalApplicants: jobWithApplicants.applicants?.length
      });
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    console.log('🔍 DEBUG: Applicant found:', {
      applicantId: applicant.user._id,
      applicantName: applicant.user.fullName,
      currentStatus: applicant.status
    });

    // Update applicant status to rejected using MongoDB positional operator
    const updateResult = await Job.updateOne(
      { _id: jobId, 'applicants.user': applicantId },
      { $set: { 'applicants.$.status': 'rejected' } }
    );

    console.log('🔍 DEBUG: MongoDB update result:', updateResult);

    if (!updateResult) {
      console.log('❌ ERROR: Failed to update applicant status');
      return res.status(500).json({
        success: false,
        message: 'Error updating applicant status'
      });
    }

    console.log('🔍 DEBUG: Applicant status updated successfully');

    // Fetch updated job to return to frontend
    const updatedJob = await Job.findById(jobId)
      .populate({
        path: 'applicants.user',
        select: 'fullName username avatar email skills experience'
      });

    res.json({
      success: true,
      message: 'Applicant rejected successfully',
      data: {
        applicantId,
        status: 'rejected',
        updatedJob: updatedJob
      }
    });
  } catch (error) {
    console.log('❌ ERROR: Exception in rejectApplicant:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting applicant',
      error: error.message || 'Unknown error'
    });
  }
};

// Delete a job
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
};

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { coverLetter, resumeUrl } = req.body;
    const jobId = req.params.id;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has already applied
    const existingApplication = job.applicants.find(
      applicant => applicant.user.toString() === userId
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Add applicant
    job.applicants.push({
      user: userId,
      coverLetter,
      resumeUrl
    });

    await job.save();

    const updatedJob = await Job.findById(jobId)
      .populate('applicants.user', 'fullName username avatar');

    res.json({
      success: true,
      data: updatedJob,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for job'
    });
  }
};

// Like/unlike a job - Professional implementation
const toggleJobLike = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    console.log('🔍 DEBUG: Toggle like request:', { jobId, userId });

    // Use findOneAndUpdate for atomic operation - faster and prevents race conditions
    const user = await User.findById(userId).select('likedJobs');
    if (!user) {
      console.log('❌ ERROR: User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const likedJobs = user.likedJobs || [];
    const isLiked = likedJobs.some(id => id.toString() === jobId.toString());
    
    console.log('🔍 DEBUG: Current liked jobs count:', likedJobs.length);
    console.log('🔍 DEBUG: Is job already liked?', isLiked);

    let updatedLikedJobs;
    let likesChange;

    if (isLiked) {
      // Unlike: Remove job from likedJobs array
      updatedLikedJobs = likedJobs.filter(id => id.toString() !== jobId.toString());
      likesChange = -1;
      console.log('🔍 DEBUG: Unliking job');
    } else {
      // Like: Add job to likedJobs array
      updatedLikedJobs = [...likedJobs, jobId];
      likesChange = 1;
      console.log('🔍 DEBUG: Liking job');
    }

    // Update user's likedJobs in single operation
    await User.findByIdAndUpdate(userId, { 
      $set: { likedJobs: updatedLikedJobs } 
    });

    // Update job's likes count in single operation
    const updatedJob = await Job.findByIdAndUpdate(
      jobId, 
      { $inc: { likes: likesChange } },
      { new: true }
    ).select('likes');

    console.log('🔍 DEBUG: Operation completed:', {
      isLiked: !isLiked,
      newLikesCount: updatedJob.likes,
      likedJobsCount: updatedLikedJobs.length
    });

    res.json({
      success: true,
      data: {
        likes: Math.max(0, updatedJob.likes || 0), // Ensure never negative
        isLiked: !isLiked,
        totalUserLikes: updatedLikedJobs.length
      },
      message: isLiked ? 'Job unliked' : 'Job liked'
    });
  } catch (error) {
    console.log('❌ ERROR: Exception in toggleJobLike:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling job like',
      error: error.message
    });
  }
};

// Get jobs posted by current user
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('postedBy', 'fullName username avatar')
      .populate('applicants.user', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user jobs'
    });
  }
};

// Get jobs user has applied to
const getMyApplications = async (req, res) => {
  try {
    const jobs = await Job.find({ 'applicants.user': req.user.id })
      .populate('postedBy', 'fullName username avatar')
      .populate('applicants.user', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  toggleJobLike,
  getJobApplicants,
  acceptApplicant,
  rejectApplicant,
  getMyJobs,
  getMyApplications
};
