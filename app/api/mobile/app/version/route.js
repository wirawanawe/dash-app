import { NextResponse } from "next/server";

// GET - Get app version information
export async function GET(request) {
  try {
    const versionInfo = {
      current_version: "1.0.0",
      latest_version: "1.0.0",
      minimum_required_version: "1.0.0",
      update_available: false,
      force_update: false,
      release_notes: [
        "Initial release of PHC Mobile app",
        "Health tracking features",
        "Wellness missions and challenges",
        "Educational content and articles",
        "Health calculators (BMI, BMR)",
        "Push notifications",
        "Data synchronization"
      ],
      download_urls: {
        android: "https://play.google.com/store/apps/details?id=com.phcmobile.app",
        ios: "https://apps.apple.com/app/phc-mobile/id123456789"
      },
      maintenance_mode: false,
      maintenance_message: "",
      server_status: "online",
      api_version: "v1",
      build_number: "100",
      release_date: "2024-01-01",
      changelog: [
        {
          version: "1.0.0",
          date: "2024-01-01",
          changes: [
            "Initial release",
            "Health tracking features",
            "Wellness missions",
            "Educational content",
            "Health calculators"
          ]
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: versionInfo,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi versi aplikasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 