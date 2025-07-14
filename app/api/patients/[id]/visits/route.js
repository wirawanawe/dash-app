import { NextResponse } from "next/server";

// Helper function to retry failed requests
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 5000, // 5 second timeout
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// Helper function to determine if a visit matches the patient
function isVisitForPatient(visit, patientMRN) {
  // Check if the visit has patient data
  if (
    !visit.Pasien ||
    !Array.isArray(visit.Pasien) ||
    visit.Pasien.length === 0
  ) {
    return false;
  }

  // Get the patient's MRN from the visit
  const visitPatientMRN = visit.Pasien[0]?.No_MR;
  return visitPatientMRN === patientMRN;
}

// GET patient visits by patient ID
export async function GET(request, { params }) {
  try {
    const patientId = params.id; // This is actually the MRN from external API
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Try to fetch from external API first using patientId as MRN
    try {
      const apiUrl = `http://api-klinik.doctorphc.id/transaksi/kunjungan?page=${page}&limit=${limit}&keyword=${encodeURIComponent(
        patientId
      )}`;

      const response = await fetchWithRetry(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch from external API: ${response.status}`
        );
      }

      const externalData = await response.json();

      // Process the external data
      let rawVisits = [];
      if (externalData.data && Array.isArray(externalData.data)) {
        rawVisits = externalData.data;
      } else if (Array.isArray(externalData)) {
        rawVisits = externalData;
      }

      // Filter visits for this specific patient
      const filteredVisits = rawVisits.filter((visit) =>
        isVisitForPatient(visit, patientId)
      );

      // Transform the visits data
      const visits = filteredVisits.map((visit) => {
        const patient = visit.Pasien?.[0] || {};
        const examination = visit.Pemeriksaan?.[0] || {};
        const clinic = visit.Klinik?.[0] || {};

        // Get vital signs
        const vitalSigns = {
          tinggi_badan: examination.TinggiBadan || null,
          berat_badan: examination.BeratBadan || null,
          tekanan_darah: examination.TekananDarah || null,
          nadi: examination.Nadi || null,
          suhu: examination.Suhu || null,
          respirasi: examination.Respirasi || null,
        };

        // Get diagnosis
        const diagnosis =
          examination.DiagnosisUtama || examination.Diagnosis || null;

        // Get treatment/therapy
        const treatment = examination.Terapi || examination.Treatment || null;

        // Get notes
        const notes =
          examination.CatatanPemeriksaan || examination.Notes || null;

        return {
          id: visit.ID || visit.id,
          visit_date: visit.TanggalKunjungan || visit.CreatedAt,
          patient_id: patient.ID || patient.id,
          patient_name: patient.NamaLengkap || patient.name,
          patient_mrn: patient.No_MR || patient.mrn,
          clinic_name: clinic.NamaKlinik || clinic.name || "Unknown Clinic",
          doctor_name:
            examination.NamaDokter ||
            examination.doctor_name ||
            "Unknown Doctor",
          complaint: examination.KeluhanUtama || examination.complaint,
          diagnosis: diagnosis,
          treatment: treatment,
          notes: notes,
          vital_signs: vitalSigns,
          status: visit.Status || "completed",
          created_at: visit.CreatedAt,
          updated_at: visit.UpdatedAt,
        };
      });

      // Apply pagination to the filtered results
      const total = visits.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVisits = visits.slice(startIndex, endIndex);

      const result = {
        data: paginatedVisits,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      return NextResponse.json(result);
    } catch (externalError) {
      console.error(
        "Error fetching patient visits from external API:",
        externalError
      );

      // Fallback to local database if external API fails
      try {
        const { query } = await import("@/lib/db");

        // Try to find patient in local database
        const [patient] = await query(
          "SELECT * FROM patients WHERE mrn = ? OR id = ?",
          [patientId, patientId]
        );

        if (!patient) {
          return NextResponse.json(
            {
              data: [],
              pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
              },
            },
            { status: 200 }
          );
        }

        // Fetch visits from local database
        const offset = (page - 1) * limit;
        const visits = await query(
          `SELECT 
            v.id,
            v.visit_date,
            v.patient_id,
            v.complaint,
            v.diagnosis,
            v.treatment,
            v.notes,
            v.status,
            v.created_at,
            v.updated_at,
            p.name as patient_name,
            p.mrn as patient_mrn,
            d.name as doctor_name,
            c.name as clinic_name
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          LEFT JOIN doctors d ON v.doctor_id = d.id
          LEFT JOIN clinics c ON v.clinic_id = c.id
          WHERE v.patient_id = ?
          ORDER BY v.visit_date DESC
          LIMIT ? OFFSET ?`,
          [patient.id, limit, offset]
        );

        const [countResult] = await query(
          "SELECT COUNT(*) as total FROM visits WHERE patient_id = ?",
          [patient.id]
        );

        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
          data: visits,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      } catch (dbError) {
        console.error("Error fetching patient visits from database:", dbError);
        return NextResponse.json(
          { error: "Failed to fetch patient visits" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in patient visits endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
