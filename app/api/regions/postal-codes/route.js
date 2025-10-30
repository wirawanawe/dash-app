import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const postalCodesData = {
  // Jakarta Pusat
  "TANAH ABANG": {
    "BENDUNGAN HILIR": "10210",
    "KARET TENGSIN": "10220",
    "KEBON MELATI": "10230",
    "KEBON KACANG": "10240",
    "KAMPUNG BALI": "10250",
    PETAMBURAN: "10260",
    GELORA: "10270",
  },
  MENTENG: {
    MENTENG: "10310",
    PEGANGSAAN: "10320",
    CIKINI: "10330",
    "KEBON SIRIH": "10340",
    GONDANGDIA: "10350",
  },
  // ... tambahkan data kode pos lainnya
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const village = searchParams.get("village");

  if (!district || !village) {
    return NextResponse.json(
      { error: "District and village names are required" },
      { status: 400 }
    );
  }

  try {
    const districtKey = district.toUpperCase();
    const villageKey = village.toUpperCase();

    const districtData = postalCodesData[districtKey];
    const postalCode = districtData?.[villageKey] || "";

    return NextResponse.json({ postalCode });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil kode pos" },
      { status: 500 }
    );
  }
}
