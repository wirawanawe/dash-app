import { NextResponse } from "next/server";

// GET - Get app configuration
export async function GET(request) {
  try {
    const configInfo = {
      app_name: "PHC Mobile",
      app_description: "Aplikasi kesehatan mobile yang membantu pengguna melacak kesehatan, kebugaran, dan kesejahteraan mereka.",
      features: {
        health_tracking: {
          enabled: true,
          features: ["water", "sleep", "mood", "fitness", "nutrition", "health_data"]
        },
        wellness: {
          enabled: true,
          features: ["missions", "challenges", "activities", "mood_tracker"]
        },
        education: {
          enabled: true,
          features: ["articles", "news", "help", "calculators"]
        },
        social: {
          enabled: false,
          features: ["friends", "groups", "sharing"]
        },
        notifications: {
          enabled: true,
          types: ["reminder", "achievement", "news", "system"]
        }
      },
      limits: {
        max_water_entries_per_day: 50,
        max_sleep_entries_per_day: 1,
        max_mood_entries_per_day: 10,
        max_fitness_entries_per_day: 20,
        max_health_data_entries_per_day: 30,
        max_mission_acceptance: 5,
        max_challenge_join: 3
      },
      targets: {
        daily_water_ml: 2000,
        daily_sleep_hours: 8,
        daily_steps: 10000,
        daily_exercise_minutes: 30,
        weekly_wellness_activities: 3
      },
      privacy: {
        data_retention_days: 365,
        auto_backup: true,
        data_export: true,
        analytics_enabled: true
      },
      api: {
        base_url: "https://api.phcmobile.com",
        version: "v1",
        timeout_seconds: 30,
        rate_limit: {
          requests_per_minute: 100,
          requests_per_hour: 1000
        }
      },
      ui: {
        theme: "light",
        language: "id",
        currency: "IDR",
        timezone: "Asia/Jakarta",
        date_format: "DD/MM/YYYY",
        time_format: "24h"
      },
      integrations: {
        google_fit: {
          enabled: false,
          scopes: ["activity", "body", "nutrition"]
        },
        apple_health: {
          enabled: false,
          scopes: ["activity", "body", "nutrition"]
        },
        fitbit: {
          enabled: false,
          scopes: ["activity", "body", "nutrition"]
        }
      },
      maintenance: {
        enabled: false,
        message: "",
        start_time: null,
        end_time: null
      }
    };

    return NextResponse.json({
      success: true,
      data: configInfo,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil konfigurasi aplikasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 