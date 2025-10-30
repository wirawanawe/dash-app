import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get all medicines for a clinic
export async function GET(request) {
  try {

    // Parse search parameters
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // Build query with filters
    let medicinesQuery = `
      SELECT 
        m.ElementDetailKey,
        m.clinic_id,
        c.name as clinic_name,
        m.Detail,
        m.DetailDescription,
        m.HNA,
        m.HNAJual,
        m.SmallUnit,
        m.MediumUnit,
        m.LargeUnit,
        m.factor_3,
        m.QtyMin,
        m.UserIDInput,
        m.UserIDModify,
        m.Berlaku,
        m.GCRecord,
        m.ReffID,
        m.KFA_Code,
        m.IsSyncServerPHC,
        m.APLN_Code,
        m.created_at,
        m.updated_at
      FROM medicines m
      LEFT JOIN clinics c ON m.clinic_id = c.id
      WHERE m.GCRecord = 0
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM medicines m
      LEFT JOIN clinics c ON m.clinic_id = c.id
      WHERE m.GCRecord = 0
    `;

    // Add clinic filter if provided
    if (clinicId && clinicId !== '') {
      medicinesQuery += ` AND m.clinic_id = ${parseInt(clinicId)}`;
      countQuery += ` AND m.clinic_id = ${parseInt(clinicId)}`;
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      medicinesQuery += ` AND (m.Detail LIKE '${searchTerm}' OR m.DetailDescription LIKE '${searchTerm}' OR m.KFA_Code LIKE '${searchTerm}')`;
      countQuery += ` AND (m.Detail LIKE '${searchTerm}' OR m.DetailDescription LIKE '${searchTerm}' OR m.KFA_Code LIKE '${searchTerm}')`;
    }

    // Add ordering and pagination
    medicinesQuery += ` ORDER BY m.ElementDetailKey DESC LIMIT ${limit} OFFSET ${offset}`;

    const medicines = await query(medicinesQuery);

    const totalCount = await query(countQuery);
    const total = totalCount[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: medicines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch medicines',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Create new medicine
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clinic_id,
      Detail,
      DetailDescription,
      HNA,
      HNAJual,
      SmallUnit,
      MediumUnit,
      LargeUnit,
      factor_3,
      QtyMin,
      UserIDInput,
      KFA_Code,
      APLN_Code
    } = body;

    // Validate required fields
    if (!clinic_id || !Detail) {
      return NextResponse.json(
        { success: false, message: 'Clinic ID and Detail are required' },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const clinicCheck = await query('SELECT id FROM clinics WHERE id = ?', [clinic_id]);
    if (clinicCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Clinic not found' },
        { status: 404 }
      );
    }

    // Insert new medicine
    const insertQuery = `
      INSERT INTO medicines (
        clinic_id, Detail, DetailDescription, HNA, HNAJual,
        SmallUnit, MediumUnit, LargeUnit, factor_3, QtyMin,
        UserIDInput, KFA_Code, APLN_Code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [
      clinic_id,
      Detail,
      DetailDescription || '',
      HNA || 0,
      HNAJual || 0,
      SmallUnit || '',
      MediumUnit || '',
      LargeUnit || '',
      factor_3 || 1,
      QtyMin || 0,
      UserIDInput,
      KFA_Code,
      APLN_Code
    ]);

    // Get the created medicine
    const newMedicine = await query(
      'SELECT * FROM medicines WHERE ElementDetailKey = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Medicine created successfully',
      data: newMedicine[0]
    }, { status: 201 });

  } catch (error) {

    return NextResponse.json(
      { success: false, message: 'Failed to create medicine' },
      { status: 500 }
    );
  }
} 