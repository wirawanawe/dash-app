import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Get specific medicine by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const medicine = await query(`
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
      WHERE m.ElementDetailKey = ?
    `, [id]);

    if (medicine.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Medicine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicine[0]
    });

  } catch (error) {

    return NextResponse.json(
      { success: false, message: 'Failed to fetch medicine' },
      { status: 500 }
    );
  }
}

// PUT - Update medicine
export async function PUT(request, { params }) {
  try {
    const { id } = params;
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
      UserIDModify,
      KFA_Code,
      APLN_Code,
      Berlaku
    } = body;

    // Check if medicine exists
    const existingMedicine = await query(
      'SELECT ElementDetailKey FROM medicines WHERE ElementDetailKey = ?',
      [id]
    );

    if (existingMedicine.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Medicine not found' },
        { status: 404 }
      );
    }

    // Check if clinic exists
    if (clinic_id) {
      const clinicCheck = await query('SELECT id FROM clinics WHERE id = ?', [clinic_id]);
      if (clinicCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Clinic not found' },
          { status: 404 }
        );
      }
    }

    // Update medicine
    const updateQuery = `
      UPDATE medicines SET
        clinic_id = ?,
        Detail = ?,
        DetailDescription = ?,
        HNA = ?,
        HNAJual = ?,
        SmallUnit = ?,
        MediumUnit = ?,
        LargeUnit = ?,
        factor_3 = ?,
        QtyMin = ?,
        UserIDModify = ?,
        KFA_Code = ?,
        APLN_Code = ?,
        Berlaku = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE ElementDetailKey = ?
    `;

    await query(updateQuery, [
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
      UserIDModify,
      KFA_Code,
      APLN_Code,
      Berlaku,
      id
    ]);

    // Get the updated medicine
    const updatedMedicine = await query(`
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
      WHERE m.ElementDetailKey = ?
    `, [id]);

    return NextResponse.json({
      success: true,
      message: 'Medicine updated successfully',
      data: updatedMedicine[0]
    });

  } catch (error) {

    return NextResponse.json(
      { success: false, message: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete medicine (set GCRecord = 1)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if medicine exists
    const existingMedicine = await query(
      'SELECT ElementDetailKey, Detail FROM medicines WHERE ElementDetailKey = ?',
      [id]
    );

    if (existingMedicine.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Medicine not found' },
        { status: 404 }
      );
    }

    // Hard delete - set GCRecord = 1
    await query(
      'UPDATE medicines SET GCRecord = 1 WHERE ElementDetailKey = ?',
      [id]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Medicine permanently deleted'
    });

  } catch (error) {

    return NextResponse.json(
      { success: false, message: 'Failed to delete medicine' },
      { status: 500 }
    );
  }
} 