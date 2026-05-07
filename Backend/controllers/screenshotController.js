const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Store screenshot uploads for manual verification
const screenshotUploads = new Map();

// Upload payment screenshot
exports.uploadScreenshot = async (req, res) => {
  try {
    const { plan, amount, email, fullName, pendingRegistration } = req.body;
    const screenshot = req.files?.screenshot;

    if (!screenshot) {
      return res.status(400).json({
        success: false,
        message: 'No screenshot uploaded'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const filename = `payment_${timestamp}_${randomString}.jpg`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/screenshots');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save screenshot
    const filepath = path.join(uploadsDir, filename);
    await screenshot.mv(filepath);

    // Store upload info
    const uploadInfo = {
      id: filename,
      plan,
      amount,
      email: email || 'unknown',
      fullName: fullName || 'Unknown',
      pendingRegistration: pendingRegistration === 'true',
      filename,
      filepath,
      uploadedAt: new Date(),
      status: 'pending',
      verified: false
    };

    screenshotUploads.set(filename, uploadInfo);

    console.log('📸 Payment screenshot uploaded:', {
      id: filename,
      plan,
      amount,
      email,
      pendingRegistration,
      filename
    });

    return res.status(200).json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        uploadId: filename,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload screenshot'
    });
  }
};

// Get all pending screenshots (for admin)
exports.getPendingScreenshots = async (req, res) => {
  try {
    const pending = Array.from(screenshotUploads.values())
      .filter(upload => upload.status === 'pending')
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    return res.status(200).json({
      success: true,
      data: pending
    });

  } catch (error) {
    console.error('Get pending screenshots error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending screenshots'
    });
  }
};

// Verify screenshot and complete registration
exports.verifyScreenshot = async (req, res) => {
  try {
    const { uploadId, action, notes } = req.body;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: 'Upload ID required'
      });
    }

    const upload = screenshotUploads.get(uploadId);
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (action === 'approve') {
      // Update upload status
      upload.status = 'approved';
      upload.verified = true;
      upload.verifiedAt = new Date();
      upload.notes = notes;

      // If this is for pending registration, complete it
      if (upload.pendingRegistration) {
        // This would complete user registration
        console.log('✅ Approving pending registration:', upload.email);
        // TODO: Send email notification to user
      }

      console.log('✅ Screenshot verified and approved:', uploadId);

      return res.status(200).json({
        success: true,
        message: 'Screenshot approved and user activated'
      });

    } else if (action === 'reject') {
      upload.status = 'rejected';
      upload.verified = false;
      upload.verifiedAt = new Date();
      upload.notes = notes;

      console.log('❌ Screenshot rejected:', uploadId);

      return res.status(200).json({
        success: false,
        message: 'Screenshot rejected'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

  } catch (error) {
    console.error('Verify screenshot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify screenshot'
    });
  }
};

// Get screenshot by ID (serve image)
exports.getScreenshot = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = screenshotUploads.get(uploadId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Screenshot not found'
      });
    }

    if (!fs.existsSync(upload.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(upload.filepath);

  } catch (error) {
    console.error('Get screenshot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get screenshot'
    });
  }
};
