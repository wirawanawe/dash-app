import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Validate PIN for user
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, pin_code } = body;

    if (!user_id || !pin_code) {
      return NextResponse.json({
        success: false,
        message: 'User ID and PIN code are required'
      }, { status: 400 });
    }

    if (pin_code.length !== 6 || !/^\d+$/.test(pin_code)) {
      return NextResponse.json({
        success: false,
        message: 'PIN must be exactly 6 digits'
      }, { status: 400 });
    }

    // Get user with PIN information
    const [user] = await query(
      `SELECT id, pin_enabled, pin_code, pin_attempts, pin_locked_until, pin_last_attempt 
       FROM mobile_users WHERE id = ? OR email = ?`,
      [user_id, user_id]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    if (!user.pin_enabled) {
      return NextResponse.json({
        success: false,
        message: 'PIN is not enabled for this user'
      }, { status: 400 });
    }

    // Check if PIN is locked
    if (user.pin_locked_until && new Date() < new Date(user.pin_locked_until)) {
      return NextResponse.json({
        success: false,
        message: 'PIN is locked. Please try again later.',
        data: {
          is_locked: true,
          locked_until: user.pin_locked_until,
          attempts_remaining: 0
        }
      }, { status: 423 }); // 423 Locked
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin_code, user.pin_code);

    if (isPinValid) {
      // PIN is correct - reset attempts and unlock
      await query(
        `UPDATE mobile_users 
         SET pin_attempts = 0, 
             pin_locked_until = NULL,
             pin_last_attempt = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [user.id]
      );

      return NextResponse.json({
        success: true,
        message: 'PIN validated successfully',
        data: {
          is_valid: true,
          attempts_remaining: 5
        }
      });

    } else {
      // PIN is incorrect - increment attempts
      const newAttempts = (user.pin_attempts || 0) + 1;
      const maxAttempts = 5;
      const lockoutMinutes = 30;
      
      let lockoutUntil = null;
      if (newAttempts >= maxAttempts) {
        lockoutUntil = new Date(Date.now() + (lockoutMinutes * 60 * 1000));
      }

      await query(
        `UPDATE mobile_users 
         SET pin_attempts = ?, 
             pin_locked_until = ?,
             pin_last_attempt = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [newAttempts, lockoutUntil, user.id]
      );

      const attemptsRemaining = Math.max(0, maxAttempts - newAttempts);

      return NextResponse.json({
        success: false,
        message: `PIN is incorrect. ${attemptsRemaining} attempts remaining.`,
        data: {
          is_valid: false,
          attempts_remaining: attemptsRemaining,
          is_locked: newAttempts >= maxAttempts,
          locked_until: lockoutUntil
        }
      }, { status: 401 });

    }

  } catch (error) {
    console.error('Error validating PIN:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Get PIN validation status for user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const [user] = await query(
      `SELECT pin_enabled, pin_attempts, pin_locked_until, pin_last_attempt 
       FROM mobile_users WHERE id = ? OR email = ?`,
      [userId, userId]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    if (!user.pin_enabled) {
      return NextResponse.json({
        success: false,
        message: 'PIN is not enabled for this user'
      }, { status: 400 });
    }

    // Check if PIN is locked
    const isLocked = user.pin_locked_until && new Date() < new Date(user.pin_locked_until);
    const attemptsRemaining = Math.max(0, 5 - (user.pin_attempts || 0));

    return NextResponse.json({
      success: true,
      data: {
        pin_enabled: user.pin_enabled,
        pin_attempts: user.pin_attempts || 0,
        attempts_remaining: attemptsRemaining,
        is_locked: isLocked,
        locked_until: user.pin_locked_until,
        last_attempt: user.pin_last_attempt
      }
    });

  } catch (error) {
    console.error('Error getting PIN validation status:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
