import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [userMission] = await query(`
      SELECT 
        um.*,
        u.name as user_name,
        u.email as user_email,
        m.title as mission_title,
        m.category as mission_category,
        m.description as mission_description
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      WHERE um.id = ?
    `, [id]);

    if (userMission.length === 0) {
      return NextResponse.json(
        { message: 'User mission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userMission: userMission[0]
    });

  } catch (error) {
    console.error('Error fetching user mission:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user_id, mission_id, status, progress, start_date, end_date, notes } = body;

    // Check if user mission exists
    const [existingUserMission] = await query('SELECT id FROM user_missions WHERE id = ?', [id]);
    if (existingUserMission.length === 0) {
      return NextResponse.json(
        { message: 'User mission not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!user_id || !mission_id) {
      return NextResponse.json(
        { message: 'User ID and Mission ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userExists] = await query('SELECT id FROM mobile_users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if mission exists
    const [missionExists] = await query('SELECT id FROM missions WHERE id = ?', [mission_id]);
    if (missionExists.length === 0) {
      return NextResponse.json(
        { message: 'Mission not found' },
        { status: 404 }
      );
    }

    // Check if user mission already exists for different record
    const [duplicateUserMission] = await query(
      'SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ? AND id != ?',
      [user_id, mission_id, id]
    );

    if (duplicateUserMission.length > 0) {
      return NextResponse.json(
        { message: 'User mission already exists' },
        { status: 409 }
      );
    }

    // Update user mission
    const updateQuery = `
      UPDATE user_missions 
      SET user_id = ?, mission_id = ?, status = ?, progress = ?, start_date = ?, end_date = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [
      user_id,
      mission_id,
      status || 'pending',
      progress || 0,
      start_date || null,
      end_date || null,
      notes || null,
      id
    ]);

    // Get the updated user mission with joined data
    const [updatedUserMission] = await query(`
      SELECT 
        um.*,
        u.name as user_name,
        u.email as user_email,
        m.title as mission_title,
        m.category as mission_category,
        m.description as mission_description
      FROM user_missions um
      LEFT JOIN mobile_users u ON um.user_id = u.id
      LEFT JOIN missions m ON um.mission_id = m.id
      WHERE um.id = ?
    `, [id]);

    return NextResponse.json({
      message: 'User mission updated successfully',
      userMission: updatedUserMission[0]
    });

  } catch (error) {
    console.error('Error updating user mission:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if user mission exists
    const [existingUserMission] = await query('SELECT id FROM user_missions WHERE id = ?', [id]);
    if (existingUserMission.length === 0) {
      return NextResponse.json(
        { message: 'User mission not found' },
        { status: 404 }
      );
    }

    // Delete user mission
    await query('DELETE FROM user_missions WHERE id = ?', [id]);

    return NextResponse.json({
      message: 'User mission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user mission:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 