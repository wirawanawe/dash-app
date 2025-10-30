import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("districtId");

  if (!districtId) {
    return NextResponse.json(
      { error: "District ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`
    );
    const data = await response.json();

    // Format data
    const villages = data.map((village) => ({
      id: parseInt(village.id),
      name: village.name,
      districtId: parseInt(districtId),
    }));

    return NextResponse.json(villages);
  } catch (error) {
    console.error("Error in villages API:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kelurahan" },
      { status: 500 }
    );
  }
}
