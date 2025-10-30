import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get anthropometry progress data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get('user_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const measured_date = searchParams.get('measured_date');
    const limit = parseInt(searchParams.get('limit')) || 30;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Build query for progress data
    let sql = `
      SELECT 
        ap.id,
        ap.user_id,
        ap.weight,
        ap.height,
        ap.bmi,
        ap.bmi_category,
        ap.notes,
        ap.measured_date,
        ap.created_at,
        ap.updated_at,
        -- Get initial data for comparison
        aid.initial_weight,
        aid.initial_height,
        -- Calculate changes
        CASE 
          WHEN aid.initial_weight IS NOT NULL AND ap.weight IS NOT NULL 
          THEN ap.weight - aid.initial_weight 
          ELSE NULL 
        END as weight_change,
        CASE 
          WHEN aid.initial_weight IS NOT NULL AND ap.weight IS NOT NULL AND aid.initial_weight > 0
          THEN ((ap.weight - aid.initial_weight) / aid.initial_weight) * 100
          ELSE NULL 
        END as weight_change_percentage,
        CASE 
          WHEN aid.initial_weight IS NOT NULL AND aid.initial_height IS NOT NULL AND ap.bmi IS NOT NULL
          THEN ap.bmi - (aid.initial_weight / POWER(aid.initial_height / 100, 2))
          ELSE NULL 
        END as bmi_change
      FROM anthropometry_progress ap
      LEFT JOIN anthropometry_initial_data aid ON ap.user_id = aid.user_id
      WHERE ap.user_id = ?
    `;
    let params = [user_id];

    if (measured_date) {
      sql += " AND ap.measured_date = ?";
      params.push(measured_date);
    } else if (start_date) {
      sql += " AND ap.measured_date >= ?";
      params.push(start_date);
    }

    if (end_date && !measured_date) {
      sql += " AND ap.measured_date <= ?";
      params.push(end_date);
    }

    sql += " ORDER BY ap.measured_date DESC LIMIT " + limit;

    const progressData = await query(sql, params);

    // Get initial data from health_data
    const initialDataSql = `
      SELECT 
        MAX(CASE WHEN data_type = 'weight' THEN value END) as initial_weight,
        MAX(CASE WHEN data_type = 'height' THEN value END) as initial_height,
        MAX(CASE WHEN data_type = 'weight' THEN measured_at END) as weight_date,
        MAX(CASE WHEN data_type = 'height' THEN measured_at END) as height_date
      FROM health_data 
      WHERE user_id = ? AND data_type IN ('weight', 'height')
    `;
    const initialData = await query(initialDataSql, [user_id]);

    // Calculate summary statistics
    const summary = {
      total_entries: progressData.length,
      initial_data: initialData[0] || null,
      latest_entry: progressData[0] || null,
      progress_summary: null
    };

    if (progressData.length > 0 && initialData[0]) {
      const latest = progressData[0];
      const initial = initialData[0];
      
      summary.progress_summary = {
        total_weight_change: latest.weight_change || 0,
        total_weight_change_percentage: latest.weight_change_percentage || 0,
        total_bmi_change: latest.bmi_change || 0,
        category_change: latest.bmi_category !== (initial.initial_weight && initial.initial_height ? 
          (() => {
            const initialBMI = initial.initial_weight / Math.pow(initial.initial_height / 100, 2);
            if (initialBMI < 18.5) return 'Kurus';
            if (initialBMI < 25) return 'Normal';
            if (initialBMI < 30) return 'Gemuk';
            return 'Obesitas';
          })() : null)
      };
    }

    return NextResponse.json({
      success: true,
      data: progressData,
      summary,
      pagination: {
        total: progressData.length,
        limit,
        offset,
        hasMore: progressData.length === limit,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data progress antropometri",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create or update anthropometry progress entry
export async function POST(request) {
  try {
    const {
      user_id,
      weight,
      height,
      bmi,
      bmi_category,
      notes,
      measured_date
    } = await request.json();

    if (!user_id || !measured_date) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan tanggal pengukuran wajib diisi",
        },
        { status: 400 }
      );
    }

    // Calculate BMI if not provided but weight and height are available
    let calculatedBMI = bmi;
    let calculatedCategory = bmi_category;
    
    if (!calculatedBMI && weight && height) {
      calculatedBMI = weight / Math.pow(height / 100, 2);
      
      // Determine category
      if (calculatedBMI < 18.5) {
        calculatedCategory = 'Kurus';
      } else if (calculatedBMI < 25) {
        calculatedCategory = 'Normal';
      } else if (calculatedBMI < 30) {
        calculatedCategory = 'Gemuk';
      } else {
        calculatedCategory = 'Obesitas';
      }
    }

    // Use UPSERT to handle duplicate dates
    const sql = `
      INSERT INTO anthropometry_progress 
        (user_id, weight, height, bmi, bmi_category, notes, measured_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        weight = VALUES(weight),
        height = VALUES(height),
        bmi = VALUES(bmi),
        bmi_category = VALUES(bmi_category),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `;

    const result = await query(sql, [
      user_id,
      weight || null,
      height || null,
      calculatedBMI || null,
      calculatedCategory || null,
      notes || null,
      measured_date
    ]);

    return NextResponse.json({
      success: true,
      message: "Data progress antropometri berhasil disimpan",
      data: { 
        id: result.insertId || result.affectedRows,
        bmi: calculatedBMI,
        bmi_category: calculatedCategory
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan data progress antropometri",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
