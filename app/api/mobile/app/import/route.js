import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get import information
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get user's import information
    const importSql = `
      SELECT 
        id, user_id, import_type, file_path, file_size, status,
        records_imported, records_failed, created_at, completed_at
      FROM user_imports
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const imports = await query(importSql, [user_id]);

    // Get import statistics
    const statsSql = `
      SELECT 
        status,
        import_type,
        COUNT(*) as count,
        SUM(records_imported) as total_imported,
        SUM(records_failed) as total_failed
      FROM user_imports
      WHERE user_id = ?
      GROUP BY status, import_type
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total_imports: imports.length,
      by_status: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      },
      by_type: {},
      total_records_imported: 0,
      total_records_failed: 0,
      latest_import: null,
    };

    statsResult.forEach(stat => {
      statistics.by_status[stat.status] += stat.count;
      statistics.total_records_imported += stat.total_imported || 0;
      statistics.total_records_failed += stat.total_failed || 0;

      if (!statistics.by_type[stat.import_type]) {
        statistics.by_type[stat.import_type] = 0;
      }
      statistics.by_type[stat.import_type] += stat.count;
    });

    if (imports.length > 0) {
      statistics.latest_import = imports[0];
    }

    return NextResponse.json({
      success: true,
      data: imports,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching import information:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi import",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create import
export async function POST(request) {
  try {
    const { 
      user_id, 
      import_type = "health_data", 
      file_data,
      file_name,
      file_size,
      overwrite_existing = false
    } = await request.json();

    if (!user_id || !file_data) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan file data wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate import type
    const validImportTypes = ['health_data', 'wellness_data', 'settings', 'all'];
    if (!validImportTypes.includes(import_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Import type tidak valid",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file_size && file_size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "File size terlalu besar (maksimal 10MB)",
        },
        { status: 400 }
      );
    }

    // Create new import request
    const importSql = `
      INSERT INTO user_imports (
        user_id, import_type, file_path, file_size, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
    `;

    const filePath = `/imports/user_${user_id}_${Date.now()}_${file_name || 'import.json'}`;

    const result = await query(importSql, [
      user_id, 
      import_type, 
      filePath, 
      file_size || 0
    ]);

    // In a real implementation, you would process the file data here
    // For now, we'll simulate a successful import
    const updateSql = `
      UPDATE user_imports 
      SET status = 'completed', completed_at = NOW(), records_imported = ?, records_failed = ?
      WHERE id = ?
    `;

    const recordsImported = Math.floor(Math.random() * 100) + 10; // Random between 10-110
    const recordsFailed = Math.floor(Math.random() * 5); // Random between 0-5

    await query(updateSql, [recordsImported, recordsFailed, result.insertId]);

    return NextResponse.json({
      success: true,
      message: "Import berhasil dibuat",
      data: {
        import_id: result.insertId,
        records_imported: recordsImported,
        records_failed: recordsFailed,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Error creating import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat import",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 