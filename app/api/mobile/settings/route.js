import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get user settings
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

    const sql = `
      SELECT 
        id, user_id, setting_key, setting_value, setting_type, created_at, updated_at
      FROM user_settings
      WHERE user_id = ?
      ORDER BY setting_key
    `;

    const settings = await query(sql, [user_id]);

    // Convert to key-value object
    const settingsObject = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      // Parse value based on type
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      settingsObject[setting.setting_key] = value;
    });

    return NextResponse.json({
      success: true,
      data: settingsObject,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil user settings",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Update user settings
export async function POST(request) {
  try {
    const { user_id, settings } = await request.json();

    if (!user_id || !settings || typeof settings !== 'object') {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan settings wajib diisi",
        },
        { status: 400 }
      );
    }

    const results = [];

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      let settingValue = value;
      let settingType = 'string';

      // Determine type and convert value
      if (typeof value === 'boolean') {
        settingValue = value.toString();
        settingType = 'boolean';
      } else if (typeof value === 'number') {
        settingValue = value.toString();
        settingType = 'number';
      } else if (typeof value === 'object') {
        settingValue = JSON.stringify(value);
        settingType = 'json';
      }

      // Check if setting exists
      const existingSql = `
        SELECT id FROM user_settings 
        WHERE user_id = ? AND setting_key = ?
      `;
      const existing = await query(existingSql, [user_id, key]);

      if (existing.length > 0) {
        // Update existing setting
        const updateSql = `
          UPDATE user_settings 
          SET setting_value = ?, setting_type = ?, updated_at = NOW()
          WHERE user_id = ? AND setting_key = ?
        `;
        await query(updateSql, [settingValue, settingType, user_id, key]);
        results.push({ key, action: 'updated' });
      } else {
        // Insert new setting
        const insertSql = `
          INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `;
        await query(insertSql, [user_id, key, settingValue, settingType]);
        results.push({ key, action: 'created' });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Settings berhasil diperbarui",
      data: {
        updated_count: results.length,
        results,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui user settings",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 