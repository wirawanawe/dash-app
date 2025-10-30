import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET - Get user water settings
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
        id,
        user_id,
        daily_goal_ml,
        custom_goal_ml,
        doctor_recommended_ml,
        doctor_id,
        is_doctor_set,
        reminder_enabled,
        reminder_interval_minutes,
        reminder_start_time,
        reminder_end_time,
        weight_kg,
        activity_level,
        climate_factor,
        notes,
        created_at,
        updated_at
      FROM user_water_settings
      WHERE user_id = ?
    `;

    const settings = await query(sql, [user_id]);

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          user_id: parseInt(user_id),
          daily_goal_ml: 2000,
          custom_goal_ml: null,
          doctor_recommended_ml: null,
          doctor_id: null,
          is_doctor_set: false,
          reminder_enabled: true,
          reminder_interval_minutes: 60,
          reminder_start_time: "07:00:00",
          reminder_end_time: "22:00:00",
          weight_kg: null,
          activity_level: "moderate",
          climate_factor: "normal",
          notes: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: settings[0],
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil pengaturan air",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update user water settings
export async function PUT(request) {
  try {
    const {
      user_id,
      daily_goal_ml,
      custom_goal_ml,
      doctor_recommended_ml,
      doctor_id,
      is_doctor_set,
      reminder_enabled,
      reminder_interval_minutes,
      reminder_start_time,
      reminder_end_time,
      weight_kg,
      activity_level,
      climate_factor,
      notes
    } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Check if settings exist for this user
    const checkSql = "SELECT id FROM user_water_settings WHERE user_id = ?";
    const existingSettings = await query(checkSql, [user_id]);

    if (existingSettings.length === 0) {
      // Create new settings
      const insertSql = `
        INSERT INTO user_water_settings (
          user_id, daily_goal_ml, custom_goal_ml, doctor_recommended_ml, doctor_id, is_doctor_set,
          reminder_enabled, reminder_interval_minutes, reminder_start_time, reminder_end_time,
          weight_kg, activity_level, climate_factor, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertSql, [
        user_id,
        daily_goal_ml || 2000,
        custom_goal_ml || null,
        doctor_recommended_ml || null,
        doctor_id || null,
        is_doctor_set || false,
        reminder_enabled !== undefined ? reminder_enabled : true,
        reminder_interval_minutes || 60,
        reminder_start_time || "07:00:00",
        reminder_end_time || "22:00:00",
        weight_kg || null,
        activity_level || "moderate",
        climate_factor || "normal",
        notes || null
      ]);
    } else {
      // Update existing settings
      const updateSql = `
        UPDATE user_water_settings SET
          daily_goal_ml = ?,
          custom_goal_ml = ?,
          doctor_recommended_ml = ?,
          doctor_id = ?,
          is_doctor_set = ?,
          reminder_enabled = ?,
          reminder_interval_minutes = ?,
          reminder_start_time = ?,
          reminder_end_time = ?,
          weight_kg = ?,
          activity_level = ?,
          climate_factor = ?,
          notes = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `;

      await query(updateSql, [
        daily_goal_ml || 2000,
        custom_goal_ml || null,
        doctor_recommended_ml || null,
        doctor_id || null,
        is_doctor_set || false,
        reminder_enabled !== undefined ? reminder_enabled : true,
        reminder_interval_minutes || 60,
        reminder_start_time || "07:00:00",
        reminder_end_time || "22:00:00",
        weight_kg || null,
        activity_level || "moderate",
        climate_factor || "normal",
        notes || null,
        user_id
      ]);
    }

    // Get the updated settings to return
    const updatedSettings = await query(
      "SELECT * FROM user_water_settings WHERE user_id = ?",
      [user_id]
    );

    return NextResponse.json({
      success: true,
      message: "Water settings updated successfully",
      data: updatedSettings[0] || null,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengupdate pengaturan air",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Calculate recommended water intake
export async function POST(request) {
  try {
    const { weight_kg, activity_level, climate_factor } = await request.json();

    if (!weight_kg) {
      return NextResponse.json(
        {
          success: false,
          message: "Weight is required for calculation",
        },
        { status: 400 }
      );
    }

    // Calculate recommended water intake based on weight, activity, and climate
    let baseWater = weight_kg * 30; // 30ml per kg body weight

    // Activity level multiplier
    const activityMultipliers = {
      low: 1.0,
      moderate: 1.2,
      high: 1.5
    };
    baseWater *= activityMultipliers[activity_level || "moderate"];

    // Climate factor multiplier
    const climateMultipliers = {
      normal: 1.0,
      hot: 1.2,
      very_hot: 1.4
    };
    baseWater *= climateMultipliers[climate_factor || "normal"];

    const recommendedWater = Math.round(baseWater);

    return NextResponse.json({
      success: true,
      data: {
        recommended_water_ml: recommendedWater,
        calculation_factors: {
          weight_kg,
          activity_level: activity_level || "moderate",
          climate_factor: climate_factor || "normal",
          base_calculation: weight_kg * 30,
          activity_multiplier: activityMultipliers[activity_level || "moderate"],
          climate_multiplier: climateMultipliers[climate_factor || "normal"]
        }
      }
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghitung rekomendasi air",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 