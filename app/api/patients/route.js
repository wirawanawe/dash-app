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

    let allPatients = [];
    let totalFromAPI = 0;

    if (search) {
      // When searching, fetch all data to search across all records
      // We'll fetch data in smaller batches with delays to avoid overwhelming the API
      let currentPage = 1;
      let hasMoreData = true;
      const batchSize = 50; // Reduced batch size to be gentler on the API
      const delayBetweenRequests = 500; // 500ms delay between requests

      try {
        while (hasMoreData) {
          const apiUrl = `http://api-klinik.doctorphc.id/pasien?page=${currentPage}&limit=${batchSize}`;

          console.log(`Fetching batch ${currentPage} for search: ${search}`);

          const response = await fetchWithRetry(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Add any required headers here (e.g., Authorization if needed)
            },
          });

          if (!response.ok) {
            console.error(`API responded with status: ${response.status}`);
            // If we get a bad response, stop fetching more data but use what we have
            break;
          }

          const externalData = await response.json();

          // Process the external data - the API returns data in a specific format
          let rawPatients = [];
          if (externalData.data && Array.isArray(externalData.data)) {
            rawPatients = externalData.data;
          } else if (Array.isArray(externalData)) {
            rawPatients = externalData;
          }

          if (rawPatients.length === 0) {
            hasMoreData = false;
            break;
          }

          // Transform the external API data to match our expected format
          const transformedPatients = rawPatients.map((patient) => ({
            id: patient.No_MR,
            mrn: patient.No_MR,
            name: patient.Nama_Pasien,
            gender: patient.Jenis_Kelamin?.[0]?.name || "-",
            birthDate: patient.Tgl_Lahir
              ? patient.Tgl_Lahir.split(" ")[0]
              : null,
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

          allPatients.push(...transformedPatients);

          // Check if we should continue fetching
          if (rawPatients.length < batchSize) {
            hasMoreData = false;
          } else {
            currentPage++;
          }

          // Add a safety limit to prevent infinite loops and too many requests
          if (currentPage > 50) {
            // Max 2,500 records (50 pages * 50 per page)
            console.log("Reached maximum page limit for search");
            hasMoreData = false;
          }

          // Add delay between requests to prevent overwhelming the API
          if (hasMoreData) {
            await delay(delayBetweenRequests);
          }
        }

        console.log(
          `Search completed. Found ${allPatients.length} total patients to filter`
        );
      } catch (fetchError) {
        console.error("Error during batch fetching:", fetchError);

        // If we encountered an error but have some data, continue with what we have
        if (allPatients.length === 0) {
          // If no data was fetched at all, fall back to single page fetch
          console.log(
            "Falling back to single page fetch due to batch fetch error"
          );

          try {
            const fallbackUrl = `http://api-klinik.doctorphc.id/pasien?page=1&limit=100`;
            const fallbackResponse = await fetchWithRetry(fallbackUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              let rawPatients = [];
              if (fallbackData.data && Array.isArray(fallbackData.data)) {
                rawPatients = fallbackData.data;
              } else if (Array.isArray(fallbackData)) {
                rawPatients = fallbackData;
              }

              allPatients = rawPatients.map((patient) => ({
                id: patient.No_MR,
                mrn: patient.No_MR,
                name: patient.Nama_Pasien,
                gender: patient.Jenis_Kelamin?.[0]?.name || "-",
                birthDate: patient.Tgl_Lahir
                  ? patient.Tgl_Lahir.split(" ")[0]
                  : null,
                nik:
                  patient.Identitas?.find((id) => id.type === "nik")?.id || "",
                nip:
                  patient.Identitas?.find((id) => id.type === "nip")?.id || "",
                phone: "",
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
            }
          } catch (fallbackError) {
            console.error("Fallback fetch also failed:", fallbackError);
            // Return empty results if all fails
            return NextResponse.json({
              data: [],
              pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0,
              },
              message: "Search temporarily unavailable due to API issues",
            });
          }
        }
      }

      // Apply search filter to all collected data
      const filteredPatients = allPatients.filter(
        (patient) =>
          (patient.name &&
            patient.name.toLowerCase().includes(search.toLowerCase())) ||
          (patient.mrn &&
            patient.mrn.toLowerCase().includes(search.toLowerCase())) ||
          (patient.nik &&
            patient.nik.toLowerCase().includes(search.toLowerCase()))
      );

      console.log(
        `Found ${filteredPatients.length} patients matching search: "${search}"`
      );

      // Apply pagination to filtered results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

      totalFromAPI = filteredPatients.length;
      const totalPages = Math.ceil(totalFromAPI / limit);

      return NextResponse.json({
        data: paginatedPatients,
        pagination: {
          total: totalFromAPI,
          page,
          limit,
          totalPages,
        },
      });
    } else {
      // When not searching, use regular pagination from API
      const apiUrl = `http://api-klinik.doctorphc.id/pasien?page=${page}&limit=${limit}`;
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
      totalFromAPI =
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
    }
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
