// services/twoFactorService.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/user');

class TwoFactorService {
  // Generate 2FA secret for user
  static generateSecret(user) {
    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME || 'Codermeet'} (${user.email})`,
      issuer: process.env.APP_NAME || 'Codermeet',
      length: 32
    });

    return secret;
  }

  // Generate QR code for 2FA setup
  static async generateQRCode(secret) {
    try {
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      return qrCodeUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Enable 2FA for user
  static async enable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.adminProfile.twoFactorSecret) {
        throw new Error('2FA secret not generated. Please setup 2FA first.');
      }

      // Verify the token
      const isValid = this.verifyToken(user.adminProfile.twoFactorSecret, token);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      user.adminProfile.twoFactorEnabled = true;
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      user.security.twoFactorBackupCodes = backupCodes;

      await user.save();

      return {
        success: true,
        backupCodes,
        message: '2FA enabled successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Disable 2FA for user
  static async disable2FA(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify the token
      const isValid = this.verifyToken(user.adminProfile.twoFactorSecret, token);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA
      user.adminProfile.twoFactorEnabled = false;
      user.adminProfile.twoFactorSecret = '';
      user.security.twoFactorBackupCodes = [];

      await user.save();

      return {
        success: true,
        message: '2FA disabled successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Setup 2FA for user (generate secret and QR code)
  static async setup2FA(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = this.generateSecret(user);
      
      // Store secret temporarily (not enabled yet)
      user.adminProfile.twoFactorSecret = secret.base32;
      await user.save();

      // Generate QR code
      const qrCode = await this.generateQRCode(secret);

      return {
        secret: secret.base32,
        qrCode,
        backupCode: secret.base32, // For manual entry
        message: '2FA setup initiated. Please verify with your authenticator app.'
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify 2FA token
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (30 seconds each) for clock drift
      time: Math.floor(Date.now() / 1000)
    });
  }

  // Verify backup code
  static verifyBackupCode(user, backupCode) {
    return user.security.twoFactorBackupCodes.includes(backupCode);
  }

  // Use backup code
  static async useBackupCode(userId, backupCode) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!this.verifyBackupCode(user, backupCode)) {
        throw new Error('Invalid backup code');
      }

      // Remove used backup code
      user.security.twoFactorBackupCodes = user.security.twoFactorBackupCodes.filter(
        code => code !== backupCode
      );

      await user.save();

      return {
        success: true,
        remainingCodes: user.security.twoFactorBackupCodes.length,
        message: 'Backup code used successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(speakeasy.generateSecret({ length: 20 }).base32.substring(0, 8));
    }
    return codes;
  }

  // Check if user has 2FA enabled
  static async is2FAEnabled(userId) {
    try {
      const user = await User.findById(userId);
      return user ? user.adminProfile.twoFactorEnabled : false;
    } catch (error) {
      return false;
    }
  }

  // Validate 2FA for login
  static async validate2FA(userId, token, backupCode = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.adminProfile.twoFactorEnabled) {
        return { valid: true, message: '2FA not enabled' };
      }

      // Try token first
      if (token) {
        const isValid = this.verifyToken(user.adminProfile.twoFactorSecret, token);
        if (isValid) {
          return { valid: true, message: 'Token verified successfully' };
        }
      }

      // Try backup code
      if (backupCode) {
        const isValid = this.verifyBackupCode(user, backupCode);
        if (isValid) {
          await this.useBackupCode(userId, backupCode);
          return { valid: true, message: 'Backup code used successfully' };
        }
      }

      return { valid: false, message: 'Invalid 2FA code' };
    } catch (error) {
      throw error;
    }
  }

  // Get 2FA status
  static async get2FAStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        enabled: user.adminProfile.twoFactorEnabled,
        hasSecret: !!user.adminProfile.twoFactorSecret,
        backupCodesCount: user.security.twoFactorBackupCodes.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Regenerate backup codes
  static async regenerateBackupCodes(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.adminProfile.twoFactorEnabled) {
        throw new Error('2FA is not enabled');
      }

      const backupCodes = this.generateBackupCodes();
      user.security.twoFactorBackupCodes = backupCodes;
      await user.save();

      return {
        backupCodes,
        message: 'Backup codes regenerated successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TwoFactorService;
