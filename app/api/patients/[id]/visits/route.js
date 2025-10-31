import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const patientId = params.id;
    const useNik = searchParams.get("useNik") === "true";

    // If limit is very large (like 1000), fetch all visits without pagination
    const fetchAll = limit >= 1000;
    
    let visitsQuery, visits, totalVisits, totalPages;
    let patientNik = null;

    // If useNik is true, get the patient's NIK first
    if (useNik) {
      // Support both INT and UUID/VARCHAR for patient ID
      // Also check external_id since frontend uses external_id as patient ID
      const patientQuery = `
        SELECT id, external_id, nik, name, mrn, nip 
        FROM patients 
        WHERE id = ? 
           OR CAST(id AS CHAR) = ? 
           OR external_id = ?
           OR CAST(external_id AS CHAR) = ?
      `;
      const patientResult = await query(patientQuery, [patientId, String(patientId), patientId, String(patientId)]);
      
      console.log(`[DEBUG] Querying patient with ID: ${patientId} (type: ${typeof patientId})`);
      console.log(`[DEBUG] Patient query returned ${patientResult.length} results`);
      
      if (patientResult.length > 0) {
        const patient = patientResult[0];
        patientNik = patient.nik;
        
        // Trim whitespace and ensure it's a string
        if (patientNik) {
          patientNik = String(patientNik).trim();
        }
        
        console.log(`[DEBUG] Patient found:`, {
          id: patient.id,
          name: patient.name,
          mrn: patient.mrn,
          nik: patientNik,
          nik_length: patientNik?.length || 0
        });
        
        if (!patientNik) {
          console.log(`[DEBUG] ⚠️ WARNING: Patient ${patient.name} (ID: ${patient.id}) has NO NIK!`);
        }
      } else {
        console.log(`[DEBUG] ❌ ERROR: Patient ID ${patientId} NOT FOUND in database!`);
        console.log(`[DEBUG] 🔄 FALLBACK: Will try to find visits by patient_id in visits table directly`);
        
        // FALLBACK: Coba cari NIK dari visits table langsung
        const visitsNikQuery = `SELECT DISTINCT patient_nik FROM visits WHERE patient_id = ? OR CAST(patient_id AS CHAR) = ? LIMIT 1`;
        const visitsNikResult = await query(visitsNikQuery, [patientId, String(patientId)]);
        
        if (visitsNikResult.length > 0 && visitsNikResult[0].patient_nik) {
          patientNik = String(visitsNikResult[0].patient_nik).trim();
          console.log(`[DEBUG] ✅ Found NIK from visits table: "${patientNik}"`);
        } else {
          console.log(`[DEBUG] ⚠️ No NIK found in visits table either, will search by patient_id only`);
        }
      }
    }

    if (fetchAll) {
      // Fetch all visits without pagination
      if (useNik && patientNik) {
        // Query using patient_nik field (from API data)
        console.log(`[DEBUG] Using NIK-based query with NIK="${patientNik}"`);
      } else if (useNik) {
        console.log(`[DEBUG] NIK not found, will use patient_id only query`);
      }
      
      if (useNik && patientNik) {
        // Query using patient_nik field (from API data)
        visitsQuery = `
          SELECT 
            v.id,
            v.visit_date,
            v.visit_time,
            v.status,
            v.complaint,
            v.diagnosis,
            v.treatment,
            v.notes,
            v.assessment,
            v.room,
            v.clinic,
            v.created_at,
            v.updated_at,
            COALESCE(v.patient_name, p.name) as patient_name,
            COALESCE(v.patient_nik, p.nik) as patient_nik,
            COALESCE(v.doctor_name, d.name) as doctor_name,
            v.visit_number,
            v.external_id,
            v.physical_exam,
            v.facility_name,
            v.patient_nip,
            v.patient_no_peserta,
            v.patient_nama_peserta,
            v.patient_gender,
            v.patient_birth_date,
            v.patient_department
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          LEFT JOIN doctors d ON v.doctor_id = d.id
          WHERE v.patient_nik = ? OR v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
          ORDER BY v.visit_date DESC, v.visit_time DESC
        `;
        visits = await query(visitsQuery, [patientNik, patientId, String(patientId)]);
        console.log(`[DEBUG] Query with NIK: Found ${visits.length} visits for NIK="${patientNik}" OR patient_id=${patientId}`);
        if (visits.length > 0) {
          console.log(`[DEBUG] Sample visit:`, {
            id: visits[0].id,
            visit_date: visits[0].visit_date,
            patient_nik: visits[0].patient_nik,
            patient_name: visits[0].patient_name
          });
        }
      } else {
        // Regular query using patient_id (support both INT and UUID)
        visitsQuery = `
          SELECT 
            v.id,
            v.visit_date,
            v.visit_time,
            v.status,
            v.complaint,
            v.diagnosis,
            v.treatment,
            v.notes,
            v.assessment,
            v.room,
            v.clinic,
            v.created_at,
            v.updated_at,
            COALESCE(v.patient_name, p.name) as patient_name,
            COALESCE(v.patient_nik, p.nik) as patient_nik,
            COALESCE(v.doctor_name, d.name) as doctor_name,
            v.visit_number,
            v.external_id,
            v.physical_exam,
            v.facility_name,
            v.patient_nip,
            v.patient_no_peserta,
            v.patient_nama_peserta,
            v.patient_gender,
            v.patient_birth_date,
            v.patient_department
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          LEFT JOIN doctors d ON v.doctor_id = d.id
          WHERE v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
          ORDER BY v.visit_date DESC, v.visit_time DESC
        `;
        visits = await query(visitsQuery, [patientId, String(patientId)]);
        console.log(`[DEBUG] Query with patient_id only: Found ${visits.length} visits for patient_id=${patientId}`);
      }
      
      totalVisits = visits.length;
      totalPages = 1;
    } else {
      // Get total count for pagination
      let countQuery, countParams;
      
      if (useNik && patientNik) {
        countQuery = `
          SELECT COUNT(*) as total
          FROM visits v
          WHERE v.patient_nik = ? OR v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
        `;
        countParams = [patientNik, patientId, String(patientId)];
      } else {
        countQuery = `
          SELECT COUNT(*) as total
          FROM visits v
          WHERE v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
        `;
        countParams = [patientId, String(patientId)];
      }

      const countResult = await query(countQuery, countParams);
      totalVisits = countResult[0]?.total || 0;
      totalPages = Math.ceil(totalVisits / limit);
      const offset = (page - 1) * limit;

      // Get visits with pagination
      if (useNik && patientNik) {
        visitsQuery = `
          SELECT 
            v.id,
            v.visit_date,
            v.visit_time,
            v.status,
            v.complaint,
            v.diagnosis,
            v.treatment,
            v.notes,
            v.assessment,
            v.room,
            v.clinic,
            v.created_at,
            v.updated_at,
            COALESCE(v.patient_name, p.name) as patient_name,
            COALESCE(v.patient_nik, p.nik) as patient_nik,
            COALESCE(v.doctor_name, d.name) as doctor_name,
            v.visit_number,
            v.external_id,
            v.physical_exam,
            v.facility_name,
            v.patient_nip,
            v.patient_no_peserta,
            v.patient_nama_peserta,
            v.patient_gender,
            v.patient_birth_date,
            v.patient_department
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          LEFT JOIN doctors d ON v.doctor_id = d.id
          WHERE v.patient_nik = ? OR v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
          ORDER BY v.visit_date DESC, v.visit_time DESC
          LIMIT ? OFFSET ?
        `;
        visits = await query(visitsQuery, [patientNik, patientId, String(patientId), Number(limit), Number(offset)]);
      } else {
        visitsQuery = `
          SELECT 
            v.id,
            v.visit_date,
            v.visit_time,
            v.status,
            v.complaint,
            v.diagnosis,
            v.treatment,
            v.notes,
            v.assessment,
            v.room,
            v.clinic,
            v.created_at,
            v.updated_at,
            COALESCE(v.patient_name, p.name) as patient_name,
            COALESCE(v.patient_nik, p.nik) as patient_nik,
            COALESCE(v.doctor_name, d.name) as doctor_name,
            v.visit_number,
            v.external_id,
            v.physical_exam,
            v.facility_name,
            v.patient_nip,
            v.patient_no_peserta,
            v.patient_nama_peserta,
            v.patient_gender,
            v.patient_birth_date,
            v.patient_department
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          LEFT JOIN doctors d ON v.doctor_id = d.id
          WHERE v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?
          ORDER BY v.visit_date DESC, v.visit_time DESC
          LIMIT ? OFFSET ?
        `;
        visits = await query(visitsQuery, [patientId, String(patientId), Number(limit), Number(offset)]);
        console.log(`[DEBUG] Pagination query with patient_id only: Found ${visits.length} visits`);
      }
    }

    // Transform visits to match expected format
    const transformedVisits = visits.map(visit => ({
      ...visit,
      visit_date: visit.visit_date ? `${visit.visit_date} ${visit.visit_time || '00:00:00'}` : null,
      clinic_name: visit.room || "Klinik Utama", // Use room as clinic name
      vital_signs: null // No vital signs in current schema
    }));

    return NextResponse.json({
      data: transformedVisits,
      pagination: {
        currentPage: page,
        totalPages,
        totalVisits,
        limit: fetchAll ? totalVisits : limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {

    return NextResponse.json(
      { error: "Failed to fetch patient visits" },
      { status: 500 }
    );
  }
} 