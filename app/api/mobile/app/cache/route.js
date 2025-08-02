import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get cache information
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

    // Get user's cache information
    const cacheSql = `
      SELECT 
        id, user_id, cache_key, cache_type, data_size, expires_at,
        created_at, updated_at, last_accessed_at
      FROM user_cache
      WHERE user_id = ?
      ORDER BY last_accessed_at DESC
      LIMIT 50
    `;

    const cacheEntries = await query(cacheSql, [user_id]);

    // Get cache statistics
    const statsSql = `
      SELECT 
        cache_type,
        COUNT(*) as count,
        SUM(data_size) as total_size,
        AVG(data_size) as avg_size
      FROM user_cache
      WHERE user_id = ?
      GROUP BY cache_type
    `;

    const statsResult = await query(statsSql, [user_id]);

    const statistics = {
      total_entries: cacheEntries.length,
      by_type: {},
      total_size: 0,
      avg_size: 0,
      expired_entries: 0,
      active_entries: 0,
    };

    let totalSize = 0;
    let totalCount = 0;

    statsResult.forEach(stat => {
      statistics.by_type[stat.cache_type] = {
        count: stat.count,
        total_size: stat.total_size,
        avg_size: stat.avg_size,
      };
      totalSize += stat.total_size || 0;
      totalCount += stat.count;
    });

    statistics.total_size = totalSize;
    statistics.avg_size = totalCount > 0 ? totalSize / totalCount : 0;

    // Count expired and active entries
    const now = new Date();
    cacheEntries.forEach(entry => {
      if (entry.expires_at && new Date(entry.expires_at) < now) {
        statistics.expired_entries++;
      } else {
        statistics.active_entries++;
      }
    });

    return NextResponse.json({
      success: true,
      data: cacheEntries,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching cache information:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi cache",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Set cache entry
export async function POST(request) {
  try {
    const { 
      user_id, 
      cache_key,
      cache_data,
      cache_type = "general",
      expires_in_hours = 24
    } = await request.json();

    if (!user_id || !cache_key || cache_data === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, cache key, dan cache data wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validate cache type
    const validCacheTypes = ['general', 'health_data', 'wellness_data', 'missions', 'activities', 'settings'];
    if (!validCacheTypes.includes(cache_type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Cache type tidak valid",
        },
        { status: 400 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Check if cache entry already exists
    const existingSql = `
      SELECT id FROM user_cache 
      WHERE user_id = ? AND cache_key = ?
    `;

    const existing = await query(existingSql, [user_id, cache_key]);

    const dataSize = JSON.stringify(cache_data).length;

    if (existing.length > 0) {
      // Update existing cache entry
      const updateSql = `
        UPDATE user_cache 
        SET cache_data = ?, cache_type = ?, data_size = ?, expires_at = ?, 
            updated_at = NOW(), last_accessed_at = NOW()
        WHERE user_id = ? AND cache_key = ?
      `;

      await query(updateSql, [
        JSON.stringify(cache_data),
        cache_type,
        dataSize,
        expiresAt.toISOString(),
        user_id,
        cache_key,
      ]);

      return NextResponse.json({
        success: true,
        message: "Cache entry berhasil diperbarui",
        data: {
          cache_key,
          cache_type,
          data_size: dataSize,
          expires_at: expiresAt.toISOString(),
        },
      });
    } else {
      // Create new cache entry
      const insertSql = `
        INSERT INTO user_cache (
          user_id, cache_key, cache_data, cache_type, data_size, 
          expires_at, created_at, updated_at, last_accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `;

      const result = await query(insertSql, [
        user_id,
        cache_key,
        JSON.stringify(cache_data),
        cache_type,
        dataSize,
        expiresAt.toISOString(),
      ]);

      return NextResponse.json({
        success: true,
        message: "Cache entry berhasil dibuat",
        data: {
          cache_id: result.insertId,
          cache_key,
          cache_type,
          data_size: dataSize,
          expires_at: expiresAt.toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error setting cache entry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat cache entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear cache
export async function DELETE(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const cache_type = searchParams.get("cache_type");
    const cache_key = searchParams.get("cache_key");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    let sql = "DELETE FROM user_cache WHERE user_id = ?";
    let params = [user_id];

    if (cache_type) {
      sql += " AND cache_type = ?";
      params.push(cache_type);
    }

    if (cache_key) {
      sql += " AND cache_key = ?";
      params.push(cache_key);
    }

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      message: "Cache berhasil dibersihkan",
      data: {
        deleted_count: result.affectedRows,
      },
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membersihkan cache",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 