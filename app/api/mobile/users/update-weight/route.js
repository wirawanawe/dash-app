import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getMobileUserFromRequest } from '@/lib/auth';

export async function PUT(request) {
  try {
    // Get authenticated user
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { weight } = body;

    if (!weight || isNaN(weight) || weight <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid weight value' },
        { status: 400 }
      );
    }

    // Update user weight in database
    const updateSql = `
      UPDATE mobile_users 
      SET weight = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await query(updateSql, [weight, user.id]);

    console.log(`Weight updated for user ${user.id}: ${weight} kg`);

    return NextResponse.json({
      success: true,
      message: 'Weight updated successfully',
      data: { weight }
    });

  } catch (error) {
    console.error('Error updating user weight:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update weight',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
