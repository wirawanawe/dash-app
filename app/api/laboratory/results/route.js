import { NextResponse } from "next/server";

// Gunakan mock data statis untuk semua request
const staticDate = "2023-12-31T12:00:00.000Z";

// Database lokal untuk mock data
const mockDatabase = [
  {
    id: "LAB001",
    labNumber: "LAB/2023/001",
    date: staticDate,
    patientName: "John Doe",
    testType: "Hematologi Lengkap",
    status: "Completed",
    result: "Normal",
    unit: "g/dL",
    normalValue: "12-16",
    doctor: "dr. Ahmad",
    note: "-",
  },
  {
    id: "LAB002",
    labNumber: "LAB/2023/002",
    date: staticDate,
    patientName: "Jane Smith",
    testType: "Gula Darah",
    status: "Completed",
    result: "120",
    unit: "mg/dL",
    normalValue: "70-130",
    doctor: "dr. Budi",
    note: "-",
  },
  {
    id: "LAB003",
    labNumber: "LAB/2023/003",
    date: staticDate,
    patientName: "Budi Santoso",
    testType: "Kolesterol Total",
    status: "Completed",
    result: "190",
    unit: "mg/dL",
    normalValue: "<200",
    doctor: "dr. Siti",
    note: "-",
  },
  {
    id: "LAB004",
    labNumber: "LAB/2023/004",
    date: staticDate,
    patientName: "Dewi Lestari",
    testType: "Fungsi Hati (SGOT/SGPT)",
    status: "Completed",
    result: "25/30",
    unit: "U/L",
    normalValue: "<35/<40",
    doctor: "dr. Joko",
    note: "-",
  },
  {
    id: "LAB005",
    labNumber: "LAB/2023/005",
    date: staticDate,
    patientName: "Indra Wijaya",
    testType: "Urinalisis",
    status: "Completed",
    result: "Normal",
    unit: "-",
    normalValue: "-",
    doctor: "dr. Maya",
    note: "Tidak ada kelainan",
  },
];

export async function GET(request) {
  try {
    // Nonaktifkan penggunaan API eksternal sepenuhnya
    // Hanya gunakan mock data untuk semua user (baik admin maupun user biasa)

    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search")?.toLowerCase() || "";

    // Filter data berdasarkan pencarian jika ada
    let results = [...mockDatabase];
    if (search) {
      results = results.filter(
        (item) =>
          item.patientName.toLowerCase().includes(search) ||
          item.labNumber.toLowerCase().includes(search) ||
          item.testType.toLowerCase().includes(search)
      );
    }

    // Buat delay kecil untuk simulasi network request (50-150ms)
    const randomDelay = Math.floor(Math.random() * 100) + 50;
    await new Promise((resolve) => setTimeout(resolve, randomDelay));

    // Return mock data dengan HTTP 200
    const response = NextResponse.json(results);
    response.headers.set("Cache-Control", "private, max-age=60"); // Cache 1 menit

    return response;
  } catch (error) {
    console.error("Error dalam endpoint hasil lab:", error);
    // Selalu kembalikan data meskipun terjadi error
    return NextResponse.json(mockDatabase.slice(0, 2)); // Kembalikan 2 data jika error
  }
}

// Implementasi CRUD lainnya tetap sama
export async function POST(request) {
  try {
    const data = await request.json();

    // Validasi data minimal
    if (!data.patientName || !data.testType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate ID baru
    const newId = `LAB${String(mockDatabase.length + 1).padStart(3, "0")}`;
    const newEntry = {
      id: newId,
      labNumber: `LAB/${new Date().getFullYear()}/${String(
        mockDatabase.length + 1
      ).padStart(3, "0")}`,
      date: staticDate, // Gunakan tanggal statis
      patientName: data.patientName,
      testType: data.testType,
      status: data.status || "Pending",
      result: data.result || "-",
      unit: data.unit || "-",
      normalValue: data.normalValue || "-",
      doctor: data.doctor || "-",
      note: data.note || "-",
    };

    // Simpan ke database lokal
    mockDatabase.push(newEntry);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating lab result:", error);
    return NextResponse.json(
      { message: "Failed to create laboratory result" },
      { status: 500 }
    );
  }
}
