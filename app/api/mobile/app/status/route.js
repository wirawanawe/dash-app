import { NextResponse } from "next/server";

// GET - Get app status
export async function GET(request) {
  try {
    const statusInfo = {
      status: "online",
      timestamp: new Date().toISOString(),
      uptime: "99.9%",
      response_time: "150ms",
      services: {
        database: {
          status: "online",
          response_time: "50ms"
        },
        authentication: {
          status: "online",
          response_time: "30ms"
        },
        notifications: {
          status: "online",
          response_time: "20ms"
        },
        file_storage: {
          status: "online",
          response_time: "40ms"
        }
      },
      maintenance: {
        scheduled: false,
        start_time: null,
        end_time: null,
        message: ""
      },
      alerts: [],
      version: {
        api: "v1",
        app: "1.0.0",
        database: "1.0.0"
      }
    };

    return NextResponse.json({
      success: true,
      data: statusInfo,
    });
  } catch (error) {
    console.error("Error fetching app status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil status aplikasi",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 