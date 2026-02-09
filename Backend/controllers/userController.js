const User = require("../models/user");
const Submission = require("../models/submission");
const DailySubmission = require("../models/dailySubmission");
const BusinessIdea = require("../models/businessIdea");
const Announcement = require("../models/announcement");
const Comment = require("../models/comment");
const Team = require("../models/team");

// Get current logged-in user
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate('likedJobs', 'title company');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get user's projects
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch projects from multiple collections
    const [submissions, dailySubmissions, businessIdeas] = await Promise.all([
      Submission.find({ userId }).sort({ submittedAt: -1 }),
      DailySubmission.find({ userId }).sort({ date: -1 }),
      BusinessIdea.find({ userId }).sort({ submittedAt: -1 })
    ]);

    // Transform all projects to unified format
    const allProjects = [
      ...submissions.map(submission => ({
        _id: submission._id,
        title: submission.title || 'Untitled Project',
        description: submission.description || 'No description available',
        githubUrl: submission.githubUrl,
        liveUrl: submission.liveUrl,
        status: submission.status || 'completed',
        score: submission.score,
        technologies: submission.technologies || [],
        userId: {
          _id: userId,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar
        },
        challengeSource: submission.challengeSource || 'personal',
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt
      })),
      ...dailySubmissions.map(daily => ({
        _id: daily._id,
        title: daily.code ? `Daily Challenge - ${daily.code.substring(0, 20)}...` : 'Daily Challenge Submission',
        description: `Daily coding challenge solution with score: ${daily.score?.total || 0}`,
        githubUrl: null,
        liveUrl: null,
        status: daily.status === 'passed' ? 'completed' : 
                daily.status === 'submitted' ? 'in-progress' : 'pending',
        score: daily.score?.total,
        technologies: ['JavaScript'],
        userId: {
          _id: userId,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar
        },
        challengeSource: 'daily',
        submittedAt: daily.date,
        updatedAt: daily.completionTime?.submittedAt || daily.date
      })),
      ...businessIdeas.map(business => ({
        _id: business._id,
        title: business.title || 'Business Idea',
        description: business.description || 'No description available',
        githubUrl: null,
        liveUrl: null,
        status: business.status === 'approved' ? 'completed' : 
                business.status === 'submitted' ? 'in-progress' : 'pending',
        score: business.score,
        technologies: business.technologies || [],
        userId: {
          _id: userId,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar
        },
        challengeSource: 'business-competition',
        submittedAt: business.submittedAt,
        updatedAt: business.updatedAt
      }))
    ];

    // Sort by submitted date (newest first)
    allProjects.sort((a, b) => new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt));

    res.status(200).json({
      success: true,
      data: allProjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get community members
exports.getMembers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all users except the current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Transform to match frontend interface and add mock data for demo
    const members = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio || 'Passionate developer and learner.',
      role: user.role || 'developer',
      skills: user.skills || ['JavaScript', 'React', 'Node.js'],
      location: user.location || 'Remote',
      status: ['online', 'offline', 'busy'][Math.floor(Math.random() * 3)],
      isMentor: Math.random() > 0.7,
      isFriend: Math.random() > 0.8,
      projectsCount: Math.floor(Math.random() * 20) + 1,
      connectionsCount: Math.floor(Math.random() * 100) + 10
    }));
    
    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Send connection request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.user.id;

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if already connected
    const currentUser = await User.findById(currentUserId);
    const isConnected = currentUser.connections?.includes(targetUserId);

    if (isConnected) {
      // Remove connection
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { connections: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { connections: currentUserId }
      });

      res.status(200).json({
        success: true,
        message: "Connection removed",
        data: { isConnected: false }
      });
    } else {
      // Add connection
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { connections: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { connections: currentUserId }
      });

      res.status(200).json({
        success: true,
        message: "Connection request sent",
        data: { isConnected: true }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get user connections
exports.getConnections = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const user = await User.findById(currentUserId)
      .populate('connections', 'fullName username avatar role')
      .select('connections');
    
    res.status(200).json({
      success: true,
      data: user.connections || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { id: recipientId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create message (in a real app, you'd save to a Messages collection)
    const messageData = {
      senderId,
      recipientId,
      message: message.trim(),
      createdAt: new Date(),
      read: false
    };

    // For now, just return success (in production, save to database)
    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: messageData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get teams
exports.getTeams = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const teams = await Team.find({
      expiresAt: { $gt: new Date() } // Only return teams that haven't expired
    })
      .populate('leaderId', 'fullName username avatar')
      .populate('members', 'fullName username avatar')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    console.log('🔍 Debug - createTeam called');
    console.log('🔍 Debug - Request body:', req.body);
    console.log('🔍 Debug - User from auth:', req.user);
    
    const { name, description, maxMembers, skillsNeeded } = req.body;
    const currentUserId = req.user.id;

    console.log('🔍 Debug - Extracted data:', { name, description, maxMembers, skillsNeeded, currentUserId });

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Team name is required" });
    }

    const newTeam = new Team({
      name: name.trim(),
      description: description?.trim() || '',
      leaderId: currentUserId,
      maxMembers: maxMembers || 5,
      skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : (skillsNeeded ? skillsNeeded.split(',').map(skill => skill.trim()).filter(skill => skill) : []),
      status: 'forming'
    });

    console.log('🔍 Debug - New team object:', newTeam);
    console.log('🔍 Debug - About to save team...');

    await newTeam.save();

    console.log('🔍 Debug - Team saved successfully');

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: newTeam
    });
  } catch (error) {
    console.error('❌ Debug - Error in createTeam:', error);
    console.error('❌ Debug - Error stack:', error.stack);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Join team
exports.joinTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const currentUserId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ success: false, message: "Team is full" });
    }

    if (team.members.includes(currentUserId)) {
      return res.status(400).json({ success: false, message: "Already a member" });
    }

    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: currentUserId }
    });

    // Update status if team is now full
    if (team.members.length + 1 >= team.maxMembers) {
      await Team.findByIdAndUpdate(teamId, { status: 'active' });
    }

    res.status(200).json({
      success: true,
      message: "Joined team successfully",
      data: { isMember: true }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Leave team
exports.leaveTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const currentUserId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    if (!team.members.includes(currentUserId)) {
      return res.status(400).json({ success: false, message: "Not a member of this team" });
    }

    await Team.findByIdAndUpdate(teamId, {
      $pull: { members: currentUserId }
    });

    // Update status if team is no longer full
    if (team.status === 'active' && team.members.length - 1 < team.maxMembers) {
      await Team.findByIdAndUpdate(teamId, { status: 'seeking-members' });
    }

    res.status(200).json({
      success: true,
      message: "Left team successfully",
      data: { isMember: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const announcements = await Announcement.find({})
      .populate('authorId', 'fullName username avatar')
      .populate('likedBy', '_id')
      .sort({ createdAt: -1 });
    
    // Add isLiked field to each announcement
    const announcementsWithLikeStatus = announcements.map(announcement => ({
      ...announcement.toObject(),
      isLiked: announcement.likedBy.some(likedUser => 
        likedUser._id.toString() === userId
      )
    }));
    
    res.status(200).json({
      success: true,
      data: announcementsWithLikeStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get community projects (all users' projects)
exports.getCommunityProjects = async (req, res) => {
  try {
    const [submissions, dailySubmissions, businessIdeas] = await Promise.all([
      Submission.find({}).populate('userId', 'fullName username avatar').sort({ submittedAt: -1 }),
      DailySubmission.find({}).populate('userId', 'fullName username avatar').sort({ date: -1 }),
      BusinessIdea.find({}).populate('userId', 'fullName username avatar').sort({ submittedAt: -1 })
    ]);

    // Transform all projects to unified format
    const allProjects = [
      ...submissions.map(submission => ({
        _id: submission._id,
        title: submission.title || 'Untitled Project',
        description: submission.description || 'No description available',
        githubUrl: submission.githubUrl,
        liveUrl: submission.liveUrl,
        status: submission.status || 'completed',
        score: submission.score,
        technologies: submission.technologies || [],
        userId: submission.userId,
        challengeSource: submission.challengeSource || 'personal',
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt
      })),
      ...dailySubmissions.map(daily => ({
        _id: daily._id,
        title: daily.code ? `Daily Challenge - ${daily.code.substring(0, 20)}...` : 'Daily Challenge Submission',
        description: `Daily coding challenge solution with score: ${daily.score?.total || 0}`,
        githubUrl: null,
        liveUrl: null,
        status: daily.status === 'passed' ? 'completed' : 
                daily.status === 'submitted' ? 'in-progress' : 'pending',
        score: daily.score?.total,
        technologies: ['JavaScript'],
        userId: daily.userId,
        challengeSource: 'daily',
        submittedAt: daily.date,
        updatedAt: daily.completionTime?.submittedAt || daily.date
      })),
      ...businessIdeas.map(business => ({
        _id: business._id,
        title: business.title || 'Business Idea',
        description: business.description || 'No description available',
        githubUrl: null,
        liveUrl: null,
        status: business.status === 'approved' ? 'completed' : 
                business.status === 'submitted' ? 'in-progress' : 'pending',
        score: business.score,
        technologies: business.technologies || [],
        userId: business.userId,
        challengeSource: 'business-competition',
        submittedAt: business.submittedAt,
        updatedAt: business.updatedAt
      }))
    ];

    // Sort by submitted date (newest first)
    allProjects.sort((a, b) => new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt));

    res.status(200).json({
      success: true,
      data: allProjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update full profile (with optional avatar)
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, location, role, skills } = req.body;
    const userId = req.user.id;
    const updateData = { fullName, bio, location, role, skills };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update profile picture only
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: { avatar: avatarUrl, user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Check if email or username exists
exports.checkUser = async (req, res) => {
  try {
    const { email, username } = req.query;
    const query = {};

    if (email) query.email = email;
    if (username) query.username = username;

    const existingUser = await User.findOne(query).select("email username");

    if (existingUser) {
      return res.status(200).json({
        success: true,
        exists: true,
        field: email ? "email" : "username"
      });
    }

    res.status(200).json({
      success: true,
      exists: false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, githubUrl, liveUrl, technologies, challengeSource, status } = req.body;
    const userId = req.user.id;

    const newProject = new Submission({
      userId,
      title,
      description,
      githubUrl,
      liveUrl,
      technologies: Array.isArray(technologies) ? technologies : technologies.split(',').map(t => t.trim()),
      status,
      challengeSource,
      submittedAt: new Date(),
      updatedAt: new Date()
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Like a project
exports.likeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Submission.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Check if user has already liked this project
    const isLiked = project.likedBy ? project.likedBy.includes(userId) : false;

    if (isLiked) {
      // Remove like
      project.likedBy.pull(userId);
      project.likes = Math.max(0, (project.likes || 0) - 1);
    } else {
      // Add like
      if (!project.likedBy) project.likedBy = [];
      project.likedBy.push(userId);
      project.likes = (project.likes || 0) + 1;
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Project unliked successfully" : "Project liked successfully",
      data: { 
        likes: project.likes,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Comment on a project
exports.commentProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const project = await Submission.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // In real app, you'd save comments to a separate Comments collection
    project.comments = (project.comments || 0) + 1;
    await project.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { comments: project.comments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get announcement comments
exports.getAnnouncementComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await Comment.find({ announcementId: id })
      .populate('userId', 'fullName username avatar')
      .sort({ createdAt: 1 });
    
    // Transform to match frontend interface
    const transformedComments = comments.map(comment => ({
      _id: comment._id,
      comment: comment.comment,
      userId: comment.userId,
      fullName: comment.userId?.fullName || 'Unknown User',
      username: comment.userId?.username || 'unknown',
      avatar: comment.userId?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff95?w=150&h=150&fit=crop&crop=face',
      createdAt: comment.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: transformedComments
    });
  } catch (error) {
    console.error('Error fetching announcement comments:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Like an announcement
exports.likeAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    // Check if user has already liked this announcement
    const isLiked = announcement.likedBy.includes(userId);

    if (isLiked) {
      // Remove like
      announcement.likedBy.pull(userId);
      announcement.likes = Math.max(0, announcement.likes - 1);
    } else {
      // Add like
      announcement.likedBy.push(userId);
      announcement.likes = announcement.likes + 1;
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Announcement unliked successfully" : "Announcement liked successfully",
      data: { 
        likes: announcement.likes,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Comment on an announcement
exports.commentAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    // Create new comment
    const newComment = new Comment({
      announcementId: id,
      userId,
      comment: comment.trim()
    });

    await newComment.save();

    // Update announcement comment count
    await Announcement.findByIdAndUpdate(id, {
      $inc: { comments: 1 }
    });

    // Return the comment with user info
    const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'fullName username avatar');

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
