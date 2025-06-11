import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

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
    // console.log("Searching postal code for villageId:", villageId); // Debug log

    const postalCode = await PostalCode.findFirst({
      where: {
        villageId: villageId.toString(), // Pastikan format string
      },
      select: {
        code: true,
      },
    });

    // console.log("Found postal code:", postalCode); // Debug log

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
    const postalCode = await PostalCode.create({
      data: {
        code: data.code,
        villageId: data.villageId,
        villageName: data.villageName,
        districtId: data.districtId,
        districtName: data.districtName,
        cityId: data.cityId,
        cityName: data.cityName,
        provinceId: data.provinceId,
        provinceName: data.provinceName,
      },
    });
    return NextResponse.json(postalCode);
  } catch (error) {
    console.error("Error creating postal code:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan kode pos" },
      { status: 500 }
    );
  }
}
