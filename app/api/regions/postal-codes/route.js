import { NextResponse } from "next/server";

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
    // Check for debug console.logs and comment them out
    // console.log("District:", district);
    // console.log("Village:", village);

    const districtKey = district.toUpperCase();
    const villageKey = village.toUpperCase();

    // console.log("Looking for:", { districtKey, villageKey });
    // console.log("Available districts:", Object.keys(postalCodesData));

    const districtData = postalCodesData[districtKey];
    // console.log("District data:", districtData);

    const postalCode = districtData?.[villageKey] || "";
    // console.log("Found postal code:", postalCode);

    return NextResponse.json({ postalCode });
  } catch (error) {
    // console.error("Error getting postal code:", error);
    return NextResponse.json(
      { error: "Gagal mengambil kode pos" },
      { status: 500 }
    );
  }
}
