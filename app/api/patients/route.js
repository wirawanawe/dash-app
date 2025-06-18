import { NextResponse } from "next/server";
import { query } from "@/lib/db"; // Gunakan db.js bukan prisma.js
import { Patient, Insurance } from "@/lib/prisma"; // Import helper functions
// atau import { getPatients } from "@/lib/prisma"; // Jika menggunakan helper yang diperbarui

// Helper function to add delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 30000, // 30 second timeout
      });
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error; // Throw on last attempt
      }
      // Wait before retrying (exponential backoff)
      await delay(Math.pow(2, i) * 1000);
    }
  }
}

// GET all patients from external API
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build API URL with keyword parameter for server-side filtering
    let apiUrl = `http://api-klinik.doctorphc.id/pasien?page=${page}&limit=${limit}`;

    // Add keyword parameter if search is provided
    if (search) {
      apiUrl += `&keyword=${encodeURIComponent(search)}`;
    }

    console.log(`Fetching patients from API: ${apiUrl}`);

    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add any required headers here (e.g., Authorization if needed)
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from external API: ${response.status} ${response.statusText}`
      );
    }

    const externalData = await response.json();

    // Process the external data - the API returns data in a specific format
    let rawPatients = [];
    if (externalData.data && Array.isArray(externalData.data)) {
      rawPatients = externalData.data;
    } else if (Array.isArray(externalData)) {
      rawPatients = externalData;
    }

    // Transform the external API data to match our expected format
    const patients = rawPatients.map((patient) => ({
      id: patient.No_MR,
      mrn: patient.No_MR,
      name: patient.Nama_Pasien,
      gender: patient.Jenis_Kelamin?.[0]?.name || "-",
      birthDate: patient.Tgl_Lahir ? patient.Tgl_Lahir.split(" ")[0] : null,
      nik: patient.Identitas?.find((id) => id.type === "nik")?.id || "",
      nip: patient.Identitas?.find((id) => id.type === "nip")?.id || "",
      phone: "", // Not available in external API
      address: patient.Alamat_Rumah?.[0]?.Alamat || "",
      city: patient.Alamat_Rumah?.[0]?.Kota?.[0]?.name || "",
      province: patient.Alamat_Rumah?.[0]?.Propinsi?.[0]?.name || "",
      bloodType: patient.Golongan_Darah?.[0]?.name || "-",
      religion: patient.Agama?.[0]?.name || "-",
      maritalStatus: patient.Status_Marital?.[0]?.name || "-",
      occupation: patient.Pekerjaan?.[0]?.name || "-",
      education: patient.Pendidikan?.[0]?.name || "-",
      created_at: patient.audittrail?.CreatedDate || null,
      updated_at: patient.audittrail?.LastModifiedDate || null,
    }));

    // Use the pagination info from the external API
    const totalFromAPI =
      externalData["total pasien"] || externalData.total || patients.length;
    const totalPages = Math.ceil(totalFromAPI / limit);

    return NextResponse.json({
      data: patients,
      pagination: {
        total: totalFromAPI,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching patients from external API:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch patients from external API",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST new patient
export async function POST(request) {
  try {
    const data = await request.json();

    // Validasi data
    if (!data.name || !data.nik || !data.birthDate) {
      return new NextResponse(
        JSON.stringify({ error: "Nama, NIK, dan Tanggal Lahir wajib diisi" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate MR Number
    const year = new Date().getFullYear();
    const lastPatient = await Patient.findFirst({
      where: { mrNumber: { startsWith: `MR-${year}` } },
      orderBy: { mrNumber: "desc" },
    });

    const sequence = lastPatient
      ? parseInt(lastPatient.mrNumber.split("-")[2]) + 1
      : 1;
    const mrNumber = `MR-${year}-${sequence.toString().padStart(4, "0")}`;

    // Create patient
    const patient = await Patient.create({
      data: {
        mrNumber,
        name: data.name.trim(),
        nik: data.nik.trim(),
        birthDate: new Date(data.birthDate),
        gender: data.gender || null,
        bloodType: data.bloodType || null,
        occupation: data.occupation || null,
        maritalStatus: data.maritalStatus || null,
        nip: data.nip || null,
        citizenship: data.citizenship || "WNI",
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        provinceId: data.provinceId || null,
        provinceName: data.provinceName || null,
        cityId: data.cityId || null,
        cityName: data.cityName || null,
        districtId: data.districtId || null,
        districtName: data.districtName || null,
        villageId: data.villageId || null,
        villageName: data.villageName || null,
        postalCode: data.postalCode || null,
        companyId: data.companyId || null,
      },
    });

    // Create insurance if provided
    if (data.insurance) {
      await Insurance.create({
        data: {
          patientId: patient.id,
          provider: data.insurance.provider,
          number: data.insurance.number || null,
          type: data.insurance.type || null,
          status: data.insurance.status || "Aktif",
        },
      });
    }

    // Format dates before sending response
    const formattedPatient = {
      ...patient,
      birthDate: patient.birthDate
        ? patient.birthDate.toISOString().split("T")[0]
        : null,
      createdAt: patient.createdAt ? patient.createdAt.toISOString() : null,
      updatedAt: patient.updatedAt ? patient.updatedAt.toISOString() : null,
    };

    return new NextResponse(JSON.stringify(formattedPatient), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating patient:", error);

    if (error.code === "P2002" || error.code === "ER_DUP_ENTRY") {
      return new NextResponse(
        JSON.stringify({ error: "NIK sudah terdaftar" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: "Gagal menambahkan pasien" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
