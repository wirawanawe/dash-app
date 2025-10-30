import { NextResponse } from "next/server";

// GET - Get about information
export async function GET(request) {
  try {
    const aboutInfo = {
      app_name: "PHC Mobile",
      version: "1.0.0",
      description: "Aplikasi kesehatan mobile yang membantu pengguna melacak kesehatan, kebugaran, dan kesejahteraan mereka.",
      features: [
        "Tracking kesehatan dan kebugaran",
        "Misi dan tantangan wellness",
        "Artikel kesehatan dan edukasi",
        "Kalkulator kesehatan",
        "Notifikasi dan pengingat",
        "Laporan dan analisis data"
      ],
      contact: {
        email: "support@phcmobile.com",
        phone: "+62-21-1234567",
        website: "https://phcmobile.com",
        address: "Jakarta, Indonesia"
      },
      social_media: {
        facebook: "https://facebook.com/phcmobile",
        twitter: "https://twitter.com/phcmobile",
        instagram: "https://instagram.com/phcmobile",
        youtube: "https://youtube.com/phcmobile"
      },
      privacy_policy: "https://phcmobile.com/privacy",
      terms_of_service: "https://phcmobile.com/terms",
      developer: {
        name: "PHC Mobile Team",
        website: "https://phcmobile.com",
        email: "dev@phcmobile.com"
      },
      acknowledgments: [
        "React Native",
        "Next.js",
        "MySQL",
        "Node.js",
        "Expo"
      ],
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
      ],
      system_requirements: {
        minimum_ios: "12.0",
        minimum_android: "6.0",
        recommended_ram: "2GB",
        storage_space: "100MB"
      }
    };

    return NextResponse.json({
      success: true,
      data: aboutInfo,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil informasi about",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 