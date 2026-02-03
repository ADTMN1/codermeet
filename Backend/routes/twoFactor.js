// routes/twoFactor.js
const express = require('express');
const router = express.Router();
const TwoFactorService = require('../services/twoFactorService');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');
const AuditService = require('../services/auditService');

// Setup 2FA (generate secret and QR code)
router.post('/setup', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await TwoFactorService.setup2FA(req.userProfile._id);
    
    await AuditService.logAction(req, res, 'setup_2fa', 'security', {
      before: { twoFactorEnabled: false },
      after: { twoFactorSecretGenerated: true }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to setup 2FA'
    });
  }
});

// Enable 2FA (verify token and enable)
router.post('/enable', authenticate, requireAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await TwoFactorService.enable2FA(req.userProfile._id, token);
    
    await AuditService.logAction(req, res, 'enable_2fa', 'security', {
      before: { twoFactorEnabled: false },
      after: { twoFactorEnabled: true }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to enable 2FA'
    });
  }
});

// Disable 2FA
router.post('/disable', authenticate, requireAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await TwoFactorService.disable2FA(req.userProfile._id, token);
    
    await AuditService.logAction(req, res, 'disable_2fa', 'security', {
      before: { twoFactorEnabled: true },
      after: { twoFactorEnabled: false }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to disable 2FA'
    });
  }
});

// Verify 2FA token (for login)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { token, backupCode } = req.body;
    
    if (!token && !backupCode) {
      return res.status(400).json({
        success: false,
        message: 'Token or backup code is required'
      });
    }

    const result = await TwoFactorService.validate2FA(
      req.userProfile._id, 
      token, 
      backupCode
    );

    if (result.valid) {
      await AuditService.logAction(req, res, 'verify_2fa', 'security', {
        success: true,
        method: token ? 'token' : 'backup_code'
      });
    } else {
      await AuditService.logAction(req, res, 'verify_2fa_failed', 'security', {
        success: false,
        method: token ? 'token' : 'backup_code'
      });
    }

    res.json({
      success: result.valid,
      message: result.message
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify 2FA'
    });
  }
});

// Get 2FA status
router.get('/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const status = await TwoFactorService.get2FAStatus(req.userProfile._id);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get 2FA status'
    });
  }
});

// Regenerate backup codes
router.post('/regenerate-backup-codes', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await TwoFactorService.regenerateBackupCodes(req.userProfile._id);
    
    await AuditService.logAction(req, res, 'regenerate_backup_codes', 'security', {
      backupCodesCount: result.backupCodes.length
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to regenerate backup codes'
    });
  }
});

// Use backup code
router.post('/use-backup-code', authenticate, async (req, res) => {
  try {
    const { backupCode } = req.body;
    
    if (!backupCode) {
      return res.status(400).json({
        success: false,
        message: 'Backup code is required'
      });
    }

    const result = await TwoFactorService.useBackupCode(req.userProfile._id, backupCode);
    
    await AuditService.logAction(req, res, 'use_backup_code', 'security', {
      remainingCodes: result.remainingCodes
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Backup code usage error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to use backup code'
    });
  }
});

module.exports = router;
