import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json"
    );
    const data = await response.json();

    // Format data sesuai kebutuhan
    const provinces = data.map((province) => ({
      id: parseInt(province.id),
      name: province.name,
    }));

    return NextResponse.json(provinces);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data provinsi" },
      { status: 500 }
    );
  }
}
