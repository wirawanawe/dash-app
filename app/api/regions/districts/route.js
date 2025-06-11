import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId");

  if (!cityId) {
    return NextResponse.json({ error: "City ID is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`
    );
    const data = await response.json();

    // Format data sesuai kebutuhan
    const districts = data.map((district) => ({
      id: parseInt(district.id),
      name: district.name,
      cityId: parseInt(cityId),
    }));

    return NextResponse.json(districts);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data kecamatan" },
      { status: 500 }
    );
  }
}
