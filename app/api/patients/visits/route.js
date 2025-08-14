import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mrNumber = searchParams.get("mrNumber");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const fetchAll = searchParams.get("fetchAll") === "true";

    if (!mrNumber) {
      return NextResponse.json(
        { error: "MR Number is required" },
        { status: 400 }
      );
    }

    if (fetchAll) {
      // Fetch all visits for the patient
      let allVisits = [];
      let currentPage = 1;
      const maxPages = 50; // Safety limit

      while (currentPage <= maxPages) {
        const url = `http://api-klinik.doctorphc.id/transaksi/kunjungan?mr_number=${mrNumber}&page=${currentPage}&limit=100`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          break;
        }

        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          allVisits = allVisits.concat(data.data);
          
          // Check if we've reached the end
          if (data.data.length < 100) {
            break;
          }
        } else {
          break;
        }

        currentPage++;
      }

      return NextResponse.json({
        success: true,
        visits: allVisits,
        total: allVisits.length,
      });
    } else {
      // Fetch single page
      const url = `http://api-klinik.doctorphc.id/transaksi/kunjungan?mr_number=${mrNumber}&page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch visits" },
          { status: response.status }
        );
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        visits: data.data || [],
        pagination: data.pagination || {},
      });
    }
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 