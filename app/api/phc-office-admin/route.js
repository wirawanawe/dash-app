import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM phc_office_admin 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error fetching PHC office admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PHC office admin data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { office_name, phone, email, address, city, postal_code, contact_person } = body;

    // Validate required fields
    if (!office_name || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, error: 'Office name, phone, email, and address are required' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO phc_office_admin 
      (office_name, phone, email, address, city, postal_code, contact_person) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [office_name, phone, email, address, city, postal_code, contact_person]);

    return NextResponse.json({ 
      success: true, 
      message: 'PHC office admin data created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating PHC office admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create PHC office admin data' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, office_name, phone, email, address, city, postal_code, contact_person } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      UPDATE phc_office_admin 
      SET office_name = ?, phone = ?, email = ?, address = ?, 
          city = ?, postal_code = ?, contact_person = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [office_name, phone, email, address, city, postal_code, contact_person, id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'PHC office admin data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PHC office admin data updated successfully' 
    });
  } catch (error) {
    console.error('Error updating PHC office admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update PHC office admin data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      UPDATE phc_office_admin 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'PHC office admin data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PHC office admin data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting PHC office admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete PHC office admin data' },
      { status: 500 }
    );
  }
}
