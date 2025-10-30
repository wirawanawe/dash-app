import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Get PIN status for user
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
      'SELECT pin_enabled, pin_attempts, pin_locked_until FROM mobile_users WHERE id = ? OR email = ?',
      [userId, userId]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if PIN is locked
    const isLocked = user.pin_locked_until && new Date() < new Date(user.pin_locked_until);

    return NextResponse.json({
      success: true,
      data: {
        pin_enabled: user.pin_enabled,
        pin_attempts: user.pin_attempts,
        is_locked: isLocked,
        locked_until: user.pin_locked_until
      }
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Enable PIN for user
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

    // Check if user exists
    const [user] = await query(
      'SELECT id FROM mobile_users WHERE id = ? OR email = ?',
      [user_id, user_id]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Hash the PIN code
    const hashedPin = await bcrypt.hash(pin_code, 10);

    // Enable PIN for user
    await query(
      `UPDATE mobile_users 
       SET pin_enabled = TRUE, 
           pin_code = ?, 
           pin_attempts = 0, 
           pin_locked_until = NULL,
           pin_last_attempt = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [hashedPin, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'PIN enabled successfully'
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update PIN for user
export async function PUT(request) {
  try {
    const body = await request.json();
    const { user_id, old_pin, new_pin } = body;

    if (!user_id || !old_pin || !new_pin) {
      return NextResponse.json({
        success: false,
        message: 'User ID, old PIN, and new PIN are required'
      }, { status: 400 });
    }

    if (new_pin.length !== 6 || !/^\d+$/.test(new_pin)) {
      return NextResponse.json({
        success: false,
        message: 'New PIN must be exactly 6 digits'
      }, { status: 400 });
    }

    // Get user with current PIN
    const [user] = await query(
      'SELECT id, pin_code, pin_enabled FROM mobile_users WHERE id = ? OR email = ?',
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

    // Verify old PIN
    const isOldPinValid = await bcrypt.compare(old_pin, user.pin_code);
    if (!isOldPinValid) {
      return NextResponse.json({
        success: false,
        message: 'Old PIN is incorrect'
      }, { status: 400 });
    }

    // Hash the new PIN
    const hashedNewPin = await bcrypt.hash(new_pin, 10);

    // Update PIN
    await query(
      `UPDATE mobile_users 
       SET pin_code = ?, 
           pin_attempts = 0, 
           pin_locked_until = NULL,
           pin_last_attempt = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [hashedNewPin, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'PIN updated successfully'
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Disable PIN for user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Check if user exists
    const [user] = await query(
      'SELECT id FROM mobile_users WHERE id = ? OR email = ?',
      [userId, userId]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Disable PIN for user
    await query(
      `UPDATE mobile_users 
       SET pin_enabled = FALSE, 
           pin_code = NULL, 
           pin_attempts = 0, 
           pin_locked_until = NULL,
           pin_last_attempt = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'PIN disabled successfully'
    });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
