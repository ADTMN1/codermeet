const User = require("../models/user");
const Submission = require("../models/submission"); // Import new Submission model
const DailySubmission = require("../models/dailySubmission"); // Import DailySubmission model
const BusinessIdea = require("../models/businessIdea"); // Import BusinessIdea model
const { uploadToCloudinary } = require("../utils/cloudinary"); // your cloudinary upload helper

// Check if user exists by email or username
exports.checkUser = async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res.status(400).json({ success: false, message: "Field and value are required" });
    }

    if (!["email", "username"].includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid field. Must be "email" or "username"' });
    }

    const query = { [field]: field === "email" ? value.toLowerCase() : value };
    const user = await User.findOne(query).select("_id").lean();

    res.status(200).json({ success: true, exists: !!user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get current logged-in user
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userProfile?._id || req.user?.id).select("-password -tokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user, message: "User profile retrieved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get user's projects from different collections
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.userProfile?._id || req.user?.id;
    
    console.log('🔍 Fetching projects for user:', userId);
    
    // Fetch from different collections
    const [submissions, dailySubmissions, businessIdeas] = await Promise.all([
      Submission.find({ userId }).lean(),
      DailySubmission.find({ userId }).lean(),
      BusinessIdea.find({ userId }).lean()
    ]);

    console.log('📊 Found:', submissions.length, 'submissions,', dailySubmissions.length, 'daily submissions,', businessIdeas.length, 'business ideas');

    // Transform all data into unified project format
    const projects = [
      // Weekly/General submissions
      ...submissions.map(submission => ({
        _id: submission._id,
        title: submission.title,
        description: submission.description,
        githubUrl: submission.githubUrl,
        liveUrl: submission.liveUrl || null,
        technologies: submission.technologies || [],
        status: submission.status,
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt,
        challengeSource: submission.challengeType || 'weekly',
        challenge: submission.challengeId ? {
          _id: submission.challengeId,
          title: submission.title,
          category: 'Full-Stack',
          difficulty: 'Intermediate',
          type: submission.challengeType
        } : null,
        score: submission.score,
        feedback: submission.feedback,
        featured: submission.featured
      })),
      
      // Daily submissions
      ...dailySubmissions.map(daily => ({
        _id: daily._id,
        title: daily.code ? `Daily Challenge - ${daily.code.substring(0, 20)}...` : 'Daily Challenge Submission',
        description: `Daily coding challenge solution with score: ${daily.score?.total || 0}`,
        githubUrl: null,
        liveUrl: null,
        technologies: ['JavaScript'],
        status: daily.status === 'passed' ? 'completed' : 
                daily.status === 'submitted' ? 'in-progress' : 'pending',
        submittedAt: daily.date,
        updatedAt: daily.completionTime?.submittedAt || daily.date,
        challengeSource: 'daily',
        challenge: {
          _id: daily.challengeId,
          title: 'Daily Coding Challenge',
          category: 'Coding',
          difficulty: 'Beginner',
          type: 'daily'
        },
        score: daily.score?.total || 0,
        feedback: `Test results: ${daily.testResults?.filter(t => t.passed).length || 0}/${daily.testResults?.length || 0} passed`,
        featured: false
      })),
      
      // Business ideas
      ...businessIdeas.map(idea => ({
        _id: idea._id,
        title: idea.title,
        description: idea.description,
        githubUrl: null,
        liveUrl: null,
        technologies: [],
        status: idea.status || 'completed',
        submittedAt: idea.createdAt,
        updatedAt: idea.updatedAt,
        challengeSource: 'business-competition',
        challenge: {
          _id: idea._id,
          title: 'Business Idea Competition',
          category: 'Business',
          difficulty: 'Advanced',
          type: 'business-competition'
        },
        score: idea.score || 0,
        feedback: idea.feedback || '',
        featured: idea.featured || false
      }))
    ];

    // Sort by submittedAt date
    projects.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    console.log('📤 Returning total projects:', projects.length);

    res.status(200).json({ 
      success: true, 
      data: projects, 
      message: "User projects retrieved successfully" 
    });

  } catch (error) {
    console.error('❌ Error fetching user projects:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userProfile?._id || req.user?.id;

    const {
      name,
      email,
      bio,
      location,
      website,
      github,
      linkedin,
      skills,
    } = req.body || {};

    const updateData = {};

    if (name) updateData.fullName = name;

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ success: false, message: "Email already in use" });
      updateData.email = email.toLowerCase();
    }

    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;

    if (skills !== undefined) {
      updateData.skills = typeof skills === "string"
        ? skills.split(",").map((s) => s.trim())
        : skills;
    }

    // Handle avatar upload if provided (multer + Cloudinary)
    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.path, userId);
      updateData.avatar = avatarUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select("-password -tokens");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

   res.status(200).json({ 
  success: true, 
  message: "Profile updated successfully", 
  data: { user: updatedUser }   // <-- wrap in `user`
});

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error during profile update", error: error.message });
  }
};

// Update only profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.userProfile?._id || req.user?.id;

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    // Upload file securely
    const avatarUrl = await uploadToCloudinary(req.file.path, userId);

    const updatedUser = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true, runValidators: true })
      .select("-password -tokens");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: { avatar: avatarUrl, user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
