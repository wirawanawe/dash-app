import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - Get health data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const data_type = searchParams.get("data_type");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        id, user_id, data_type, value, unit, recorded_at, notes, created_at, updated_at
      FROM health_data
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (data_type) {
      sql += " AND data_type = ?";
      params.push(data_type);
    }

    if (start_date) {
      sql += " AND DATE(recorded_at) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      sql += " AND DATE(recorded_at) <= ?";
      params.push(end_date);
    }

    sql += " ORDER BY recorded_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const healthData = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM health_data WHERE user_id = ?";
    let countParams = [user_id];

    if (data_type) {
      countSql += " AND data_type = ?";
      countParams.push(data_type);
    }

    if (start_date) {
      countSql += " AND DATE(recorded_at) >= ?";
      countParams.push(start_date);
    }

    if (end_date) {
      countSql += " AND DATE(recorded_at) <= ?";
      countParams.push(end_date);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Calculate summary statistics
    const summary = {
      total_entries: total,
      data_types: {},
      latest_entries: {},
    };

    // Group by data type
    const dataTypeGroups = {};
    healthData.forEach(entry => {
      if (!dataTypeGroups[entry.data_type]) {
        dataTypeGroups[entry.data_type] = [];
      }
      dataTypeGroups[entry.data_type].push(entry);
    });

    // Calculate statistics for each data type
    Object.keys(dataTypeGroups).forEach(dataType => {
      const entries = dataTypeGroups[dataType];
      const values = entries.map(e => parseFloat(e.value)).filter(v => !isNaN(v));
      
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        summary.data_types[dataType] = {
          count: entries.length,
          average: avg,
          min: min,
          max: max,
          unit: entries[0]?.unit || null,
        };

        // Get latest entry for this data type
        const latestEntry = entries[0]; // Already sorted by recorded_at DESC
        summary.latest_entries[dataType] = {
          value: latestEntry.value,
          unit: latestEntry.unit,
          recorded_at: latestEntry.recorded_at,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: healthData,
      summary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching health data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil health data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create health data entry
export async function POST(request) {
  try {
    const {
      user_id,
      data_type,
      value,
      unit,
      recorded_at,
      notes
    } = await request.json();

    if (!user_id || !data_type || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, data type, dan value wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate data type
    const validDataTypes = [
      'blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 
      'temperature', 'oxygen_saturation', 'cholesterol', 'bmi'
    ];
    
    if (!validDataTypes.includes(data_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Data type tidak valid",
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO health_data (user_id, data_type, value, unit, recorded_at, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      user_id,
      data_type,
      value,
      unit || null,
      recorded_at || new Date().toISOString(),
      notes || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Health data berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating health data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan health data",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 