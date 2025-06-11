import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("provinceId");

  if (!provinceId) {
    return NextResponse.json(
      { error: "Province ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`
    );
    const data = await response.json();

    // Format data sesuai kebutuhan
    const cities = data.map((city) => ({
      id: parseInt(city.id),
      name: city.name,
      provinceId: parseInt(provinceId),
    }));

    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data kota" },
      { status: 500 }
    );
  }
}
