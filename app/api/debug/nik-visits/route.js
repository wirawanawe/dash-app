import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetNik = searchParams.get("nik") || "3277034105640001";
    
    const results = {
      nik: targetNik,
      timestamp: new Date().toISOString(),
      steps: {}
    };

    // 1. Cek apakah NIK ada di tabel patients
    const patients = await query(
      'SELECT id, mrn, name, nik, birthdate, gender FROM patients WHERE nik = ? OR TRIM(nik) = ?',
      [targetNik, targetNik]
    );
    
    results.steps.step1_patients_table = {
      description: "Mencari di tabel PATIENTS",
      found: patients.length > 0,
      count: patients.length,
      data: patients
    };

    // 2. Cek apakah NIK ada di tabel visits (field patient_nik)
    const visitsWithNik = await query(
      `SELECT 
        id, 
        patient_id, 
        patient_nik, 
        patient_name, 
        visit_date, 
        visit_time,
        status,
        diagnosis,
        doctor_name,
        clinic
      FROM visits 
      WHERE patient_nik = ?
      ORDER BY visit_date DESC`,
      [targetNik]
    );
    
    results.steps.step2_visits_by_nik = {
      description: "Mencari di tabel VISITS (field patient_nik)",
      found: visitsWithNik.length > 0,
      count: visitsWithNik.length,
      data: visitsWithNik
    };

    // 3. Cek kunjungan berdasarkan patient_id (jika pasien ditemukan)
    if (patients.length > 0) {
      const patientId = patients[0].id;
      const visitsWithId = await query(
        `SELECT 
          id, 
          patient_id, 
          patient_nik, 
          patient_name, 
          visit_date, 
          visit_time,
          status,
          diagnosis,
          doctor_name,
          clinic
        FROM visits 
        WHERE patient_id = ?
        ORDER BY visit_date DESC`,
        [patientId]
      );
      
      results.steps.step3_visits_by_patient_id = {
        description: `Mencari di tabel VISITS (patient_id = ${patientId})`,
        found: visitsWithId.length > 0,
        count: visitsWithId.length,
        data: visitsWithId
      };

      // 4. Cek total kombinasi (support UUID)
      const combinedVisits = await query(
        `SELECT 
          COUNT(*) as total,
          MIN(visit_date) as first_visit,
          MAX(visit_date) as last_visit
        FROM visits 
        WHERE patient_nik = ? OR patient_id = ? OR CAST(patient_id AS CHAR) = ?`,
        [targetNik, patientId, String(patientId)]
      );
      
      results.steps.step4_combined_total = {
        description: "Total kunjungan (kombinasi patient_nik DAN patient_id)",
        data: combinedVisits[0]
      };
    }

    // 5. Cek dengan LIKE pattern untuk masalah format
    const likePatients = await query(
      'SELECT id, mrn, name, nik FROM patients WHERE nik LIKE ?',
      [`%${targetNik}%`]
    );
    
    results.steps.step5_like_pattern_patients = {
      description: "Mencari NIK dengan LIKE pattern di patients",
      found: likePatients.length > 0,
      count: likePatients.length,
      data: likePatients.map(p => ({
        ...p,
        nik_length: p.nik?.length || 0
      }))
    };

    // 6. Cek visits dengan LIKE pattern
    const likeVisits = await query(
      'SELECT DISTINCT patient_nik, patient_name, COUNT(*) as total FROM visits WHERE patient_nik LIKE ? GROUP BY patient_nik, patient_name',
      [`%${targetNik}%`]
    );
    
    results.steps.step6_like_pattern_visits = {
      description: "Mencari visits dengan patient_nik LIKE pattern",
      found: likeVisits.length > 0,
      count: likeVisits.length,
      data: likeVisits.map(v => ({
        ...v,
        nik_length: v.patient_nik?.length || 0
      }))
    };

    // 7. Sample visits untuk referensi
    const sampleVisits = await query(
      `SELECT id, patient_id, patient_nik, patient_name, visit_date, status 
       FROM visits 
       WHERE patient_nik IS NOT NULL 
       ORDER BY visit_date DESC 
       LIMIT 5`
    );
    
    results.steps.step7_sample_visits = {
      description: "Sample 5 visits terbaru (untuk referensi)",
      count: sampleVisits.length,
      data: sampleVisits.map(v => ({
        ...v,
        nik_length: v.patient_nik?.length || 0
      }))
    };

    // Summary
    results.summary = {
      patient_found_in_patients_table: patients.length > 0,
      patient_id: patients.length > 0 ? patients[0].id : null,
      visits_with_patient_nik: visitsWithNik.length,
      visits_with_patient_id: patients.length > 0 ? results.steps.step3_visits_by_patient_id?.count || 0 : 0,
      total_visits: patients.length > 0 ? results.steps.step4_combined_total?.data?.total || 0 : visitsWithNik.length,
      issue_detected: visitsWithNik.length === 0 && patients.length > 0 ? "NIK ditemukan di patients tapi tidak ada di visits" : 
                       visitsWithNik.length > 0 && patients.length === 0 ? "Ada visits dengan NIK tapi tidak ada patient" :
                       "Data konsisten"
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { 
        error: "Failed to debug NIK visits",
        message: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

