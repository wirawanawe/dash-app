import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get export information
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

    // Get user's export information
    const exportSql = `
      SELECT 
        id, user_id, export_type, format, file_path, file_size, status,
        created_at, completed_at, expires_at
      FROM user_exports
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const exports = await query(exportSql, [user_id]);

    // Get export statistics
    const statsSql = `
      SELECT 
        status,
        export_type,
        format,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM user_exports
      WHERE user_id = ?
      GROUP BY status, export_type, format
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total_exports: exports.length,
      by_status: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      },
      by_type: {},
      by_format: {},
      total_size: 0,
      latest_export: null,
    };

    statsResult.forEach(stat => {
      statistics.by_status[stat.status] += stat.count;
      statistics.total_size += stat.total_size || 0;

      if (!statistics.by_type[stat.export_type]) {
        statistics.by_type[stat.export_type] = 0;
      }
      statistics.by_type[stat.export_type] += stat.count;

      if (!statistics.by_format[stat.format]) {
        statistics.by_format[stat.format] = 0;
      }
      statistics.by_format[stat.format] += stat.count;
    });

    if (exports.length > 0) {
      statistics.latest_export = exports[0];
    }

    return NextResponse.json({
      success: true,
      data: exports,
      statistics,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi export",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create export
export async function POST(request) {
  try {
    const { 
      user_id, 
      export_type = "all", 
      format = "json",
      include_health_data = true,
      include_wellness_data = true,
      include_settings = true
    } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate export type
    const validExportTypes = ['all', 'health_data', 'wellness_data', 'settings', 'missions', 'activities'];
    if (!validExportTypes.includes(export_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Export type tidak valid",
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xml', 'pdf'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format tidak valid",
        },
        { status: 400 }
      );
    }

    // Check if user has a recent export
    const recentExportSql = `
      SELECT id, created_at
      FROM user_exports
      WHERE user_id = ? AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const recentExport = await query(recentExportSql, [user_id]);

    // If user has a recent export (within 1 hour), return existing export
    if (recentExport.length > 0) {
      const lastExport = recentExport[0];
      const minutesSinceLastExport = (Date.now() - new Date(lastExport.created_at).getTime()) / (1000 * 60);
      
      if (minutesSinceLastExport < 60) {
        return NextResponse.json({
          success: true,
          message: "Export sudah tersedia (dibuat dalam 1 jam terakhir)",
          data: {
            export_id: lastExport.id,
            created_at: lastExport.created_at,
            status: "completed",
          },
        });
      }
    }

    // Create new export request
    const exportSql = `
      INSERT INTO user_exports (
        user_id, export_type, format, status, created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', NOW(), NOW())
    `;

    const result = await query(exportSql, [user_id, export_type, format]);

    // In a real implementation, you would trigger an actual export process here
    // For now, we'll simulate a successful export
    const updateSql = `
      UPDATE user_exports 
      SET status = 'completed', completed_at = NOW(), file_path = ?, file_size = ?
      WHERE id = ?
    `;

    const filePath = `/exports/user_${user_id}_${Date.now()}.${format}`;
    const fileSize = Math.floor(Math.random() * 500000) + 10000; // Random size between 10KB and 500KB

    await query(updateSql, [filePath, fileSize, result.insertId]);

    return NextResponse.json({
      success: true,
      message: "Export berhasil dibuat",
      data: {
        export_id: result.insertId,
        file_path: filePath,
        file_size: fileSize,
        status: "completed",
        download_url: `/api/mobile/app/export/${result.insertId}/download`,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat export",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 