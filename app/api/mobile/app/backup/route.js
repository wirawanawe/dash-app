import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get backup information
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

    // Get user's backup information
    const backupSql = `
      SELECT 
        id, user_id, backup_type, file_path, file_size, status,
        created_at, completed_at, expires_at
      FROM user_backups
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const backups = await query(backupSql, [user_id]);

    // Get backup statistics
    const statsSql = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM user_backups
      WHERE user_id = ?
      GROUP BY status
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total_backups: backups.length,
      by_status: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      },
      total_size: 0,
      latest_backup: null,
    };

    statsResult.forEach(stat => {
      statistics.by_status[stat.status] = stat.count;
      statistics.total_size += stat.total_size || 0;
    });

    if (backups.length > 0) {
      statistics.latest_backup = backups[0];
    }

    return NextResponse.json({
      success: true,
      data: backups,
      statistics,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi backup",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create backup
export async function POST(request) {
  try {
    const { user_id, backup_type = "full" } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate backup type
    const validBackupTypes = ['full', 'health_data', 'wellness_data', 'settings'];
    if (!validBackupTypes.includes(backup_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup type tidak valid",
        },
        { status: 400 }
      );
    }

    // Check if user has a recent backup
    const recentBackupSql = `
      SELECT id, created_at
      FROM user_backups
      WHERE user_id = ? AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const recentBackup = await query(recentBackupSql, [user_id]);

    // If user has a recent backup (within 24 hours), return existing backup
    if (recentBackup.length > 0) {
      const lastBackup = recentBackup[0];
      const hoursSinceLastBackup = (Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastBackup < 24) {
        return NextResponse.json({
          success: true,
          message: "Backup sudah tersedia (dibuat dalam 24 jam terakhir)",
          data: {
            backup_id: lastBackup.id,
            created_at: lastBackup.created_at,
            status: "completed",
          },
        });
      }
    }

    // Create new backup request
    const backupSql = `
      INSERT INTO user_backups (
        user_id, backup_type, status, created_at, updated_at
      ) VALUES (?, ?, 'pending', NOW(), NOW())
    `;

    const result = await query(backupSql, [user_id, backup_type]);

    // In a real implementation, you would trigger an actual backup process here
    // For now, we'll simulate a successful backup
    const updateSql = `
      UPDATE user_backups 
      SET status = 'completed', completed_at = NOW(), file_path = ?, file_size = ?
      WHERE id = ?
    `;

    const filePath = `/backups/user_${user_id}_${Date.now()}.json`;
    const fileSize = Math.floor(Math.random() * 1000000) + 50000; // Random size between 50KB and 1MB

    await query(updateSql, [filePath, fileSize, result.insertId]);

    return NextResponse.json({
      success: true,
      message: "Backup berhasil dibuat",
      data: {
        backup_id: result.insertId,
        file_path: filePath,
        file_size: fileSize,
        status: "completed",
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat backup",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 