import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const mrn = searchParams.get("mrn");
    const nik = searchParams.get("nik");
    const id = searchParams.get("id");
    
    const results = {
      search_params: { name, mrn, nik, id },
      timestamp: new Date().toISOString(),
      findings: {}
    };

    // 1. Cari by ID (jika ada)
    if (id) {
      const byId = await query(
        'SELECT * FROM patients WHERE id = ? OR CAST(id AS CHAR) = ? OR external_id = ? OR CAST(external_id AS CHAR) = ? LIMIT 5',
        [id, String(id), id, String(id)]
      );
      results.findings.by_id = {
        description: `Mencari patient dengan ID atau external_id = ${id}`,
        found: byId.length > 0,
        count: byId.length,
        data: byId
      };
    }

    // 2. Cari by MRN
    if (mrn) {
      const byMrn = await query(
        'SELECT * FROM patients WHERE mrn = ? OR mrn LIKE ? LIMIT 5',
        [mrn, `%${mrn}%`]
      );
      results.findings.by_mrn = {
        description: `Mencari patient dengan MRN = ${mrn}`,
        found: byMrn.length > 0,
        count: byMrn.length,
        data: byMrn
      };
    }

    // 3. Cari by Name
    if (name) {
      const byName = await query(
        'SELECT * FROM patients WHERE name LIKE ? LIMIT 10',
        [`%${name}%`]
      );
      results.findings.by_name = {
        description: `Mencari patient dengan nama mengandung "${name}"`,
        found: byName.length > 0,
        count: byName.length,
        data: byName
      };
    }

    // 4. Cari by NIK
    if (nik) {
      const byNik = await query(
        'SELECT * FROM patients WHERE nik = ? OR nik LIKE ? LIMIT 5',
        [nik, `%${nik}%`]
      );
      results.findings.by_nik = {
        description: `Mencari patient dengan NIK = ${nik}`,
        found: byNik.length > 0,
        count: byNik.length,
        data: byNik
      };
    }

    // 5. Jika tidak ada parameter, tampilkan sample 10 patients
    if (!id && !mrn && !name && !nik) {
      const sample = await query(
        'SELECT id, mrn, name, nik, birthdate, gender FROM patients ORDER BY created_at DESC LIMIT 10'
      );
      results.findings.sample = {
        description: "Sample 10 patients terbaru",
        count: sample.length,
        data: sample
      };
    }

    // 6. Cari visits dengan patient_nik jika NIK diberikan
    if (nik) {
      const visitsByNik = await query(
        'SELECT COUNT(*) as total, patient_nik, patient_name FROM visits WHERE patient_nik = ? GROUP BY patient_nik, patient_name',
        [nik]
      );
      results.findings.visits_with_nik = {
        description: `Visits dengan patient_nik = ${nik}`,
        count: visitsByNik.length > 0 ? visitsByNik[0].total : 0,
        data: visitsByNik
      };
    }

    // 7. Total patients
    const totalPatients = await query('SELECT COUNT(*) as total FROM patients');
    results.total_patients_in_db = totalPatients[0].total;

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error("Debug find patient error:", error);
    return NextResponse.json(
      { 
        error: "Failed to find patient",
        message: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

