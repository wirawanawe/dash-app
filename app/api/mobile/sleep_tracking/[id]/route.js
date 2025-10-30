import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [sleepData] = await query(`
      SELECT 
        st.*,
        u.name as user_name,
        u.email as user_email
      FROM sleep_tracking st
      LEFT JOIN mobile_users u ON st.user_id = u.id
      WHERE st.id = ?
    `, [id]);

    if (sleepData.length === 0) {
      return NextResponse.json(
        { message: 'Sleep tracking data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sleepData: sleepData[0]
    });

  } catch (error) {
    console.error('Error fetching sleep tracking data:', error);
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
    const { user_id, sleep_date, sleep_hours, sleep_minutes, sleep_quality, bedtime, wake_time, notes } = body;

    // Check if sleep tracking data exists
    const [existingSleepData] = await query('SELECT id FROM sleep_tracking WHERE id = ?', [id]);
    if (existingSleepData.length === 0) {
      return NextResponse.json(
        { message: 'Sleep tracking data not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!user_id || !sleep_date || sleep_hours === undefined || sleep_minutes === undefined || !sleep_quality) {
      return NextResponse.json(
        { message: 'User ID, sleep date, sleep hours, sleep minutes, and sleep quality are required' },
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

    // Validate sleep quality
    const validSleepQualities = ['excellent', 'good', 'fair', 'poor'];
    if (!validSleepQualities.includes(sleep_quality)) {
      return NextResponse.json(
        { message: 'Invalid sleep quality' },
        { status: 400 }
      );
    }

    // Validate sleep hours and minutes
    if (sleep_hours < 0 || sleep_hours > 24 || sleep_minutes < 0 || sleep_minutes > 59) {
      return NextResponse.json(
        { message: 'Invalid sleep duration' },
        { status: 400 }
      );
    }

    // Update sleep tracking data
    const updateQuery = `
      UPDATE sleep_tracking 
      SET user_id = ?, sleep_date = ?, sleep_hours = ?, sleep_minutes = ?, sleep_quality = ?, bedtime = ?, wake_time = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, [
      user_id,
      sleep_date,
      sleep_hours,
      sleep_minutes,
      sleep_quality,
      bedtime || null,
      wake_time || null,
      notes || null,
      id
    ]);

    // Get the updated sleep tracking data with joined data
    const [updatedSleepData] = await query(`
      SELECT 
        st.*,
        u.name as user_name,
        u.email as user_email
      FROM sleep_tracking st
      LEFT JOIN mobile_users u ON st.user_id = u.id
      WHERE st.id = ?
    `, [id]);

    return NextResponse.json({
      message: 'Sleep tracking data updated successfully',
      sleepData: updatedSleepData[0]
    });

  } catch (error) {
    console.error('Error updating sleep tracking data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if sleep tracking data exists
    const [existingSleepData] = await query('SELECT id FROM sleep_tracking WHERE id = ?', [id]);
    if (existingSleepData.length === 0) {
      return NextResponse.json(
        { message: 'Sleep tracking data not found' },
        { status: 404 }
      );
    }

    // Delete sleep tracking data
    await query('DELETE FROM sleep_tracking WHERE id = ?', [id]);

    return NextResponse.json({
      message: 'Sleep tracking data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sleep tracking data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 