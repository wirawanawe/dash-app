import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const villageId = searchParams.get("villageId");

  if (!villageId) {
    return NextResponse.json(
      { error: "Village ID is required" },
      { status: 400 }
    );
  }

  try {
    const [postalCode] = await query(
      "SELECT code FROM postal_codes WHERE village_id = ?",
      [villageId.toString()]
    );

    return NextResponse.json({ code: postalCode?.code || "" });
  } catch (error) {
    console.error("Error getting postal code:", error);
    return NextResponse.json(
      { error: "Gagal mengambil kode pos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    const insertResult = await query(
      `INSERT INTO postal_codes (
        code, village_id, village_name, district_id, district_name, 
        city_id, city_name, province_id, province_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.code,
        data.villageId,
        data.villageName,
        data.districtId,
        data.districtName,
        data.cityId,
        data.cityName,
        data.provinceId,
        data.provinceName,
      ]
    );

    // Get the created postal code
    const [postalCode] = await query(
      "SELECT * FROM postal_codes WHERE id = ?",
      [insertResult.insertId]
    );

    return NextResponse.json(postalCode);
  } catch (error) {
    console.error("Error creating postal code:", error);
    return NextResponse.json(
      { error: "Gagal membuat kode pos" },
      { status: 500 }
    );
  }
}
