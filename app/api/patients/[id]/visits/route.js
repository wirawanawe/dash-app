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
    let patientExternalId = null;
    let patientDbId = null;
    let patientName = null;

    // First, try to find patient to get NIK, external_id, name, and database ID
    // Priority: exact match on external_id first, then try other methods
    let patientQuery = `
      SELECT id, external_id, nik, name, mrn, nip 
      FROM patients 
      WHERE BINARY external_id = ?
      LIMIT 1
    `;
    let patientResult = await query(patientQuery, [patientId]);
    
    // If not found by external_id, try other methods
    if (patientResult.length === 0) {
      patientQuery = `
        SELECT id, external_id, nik, name, mrn, nip 
        FROM patients 
        WHERE external_id = ?
           OR CAST(external_id AS CHAR) = ?
        LIMIT 1
      `;
      patientResult = await query(patientQuery, [patientId, String(patientId)]);
    }
    
    // If still not found, try by id (in case patientId is actually the database id)
    if (patientResult.length === 0) {
      patientQuery = `
        SELECT id, external_id, nik, name, mrn, nip 
        FROM patients 
        WHERE id = ? 
           OR CAST(id AS CHAR) = ? 
        LIMIT 1
      `;
      patientResult = await query(patientQuery, [patientId, String(patientId)]);
    }
      
      if (patientResult.length > 0) {
        const patient = patientResult[0];
      patientDbId = patient.id;
      patientExternalId = patient.external_id;
        patientNik = patient.nik;
      patientName = patient.name;
      
      // Verify that we found the correct patient
      const isCorrectPatient = patient.external_id === patientId || 
                                String(patient.external_id) === String(patientId) ||
                                patient.id === parseInt(patientId) ||
                                String(patient.id) === String(patientId);
      
      if (!isCorrectPatient) {
        // Reset to prevent using wrong patient data
        patientDbId = null;
        patientExternalId = null;
        patientNik = null;
        patientName = null;
        patientResult = [];
      } else {
        // Trim whitespace and ensure it's a string
        if (patientNik) {
          patientNik = String(patientNik).trim();
        }
      }
    }

    // If useNik is true and NIK not found, try to find NIK from visits table
    if (useNik && !patientNik) {
      // FALLBACK: Coba cari NIK dari visits table langsung berdasarkan patient_id atau external_id
      const visitsNikQuery = `
        SELECT DISTINCT patient_nik 
        FROM visits 
        WHERE (patient_id = ? OR CAST(patient_id AS CHAR) = ?)
           OR (external_id = ? AND ? IS NOT NULL)
           OR (CAST(external_id AS CHAR) = ? AND ? IS NOT NULL)
           OR (BINARY external_id = ? AND ? IS NOT NULL)
        LIMIT 1
      `;
      const visitsNikParams = [
        patientDbId || patientId, 
        String(patientDbId || patientId),
        patientExternalId || patientId,
        patientExternalId,
        String(patientExternalId || patientId),
        patientExternalId,
        patientExternalId || patientId,
        patientExternalId
      ];
      const visitsNikResult = await query(visitsNikQuery, visitsNikParams);
        
        if (visitsNikResult.length > 0 && visitsNikResult[0].patient_nik) {
          patientNik = String(visitsNikResult[0].patient_nik).trim();
      }
    }

    if (fetchAll) {
      // Fetch all visits without pagination
      // If useNik is true but NIK not found, fallback to patient_id search
      if (useNik && patientNik && patientNik.length > 0) {
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
          WHERE (v.patient_nik = ? OR TRIM(v.patient_nik) = ?)
             OR v.patient_id = ? 
             OR CAST(v.patient_id AS CHAR) = ?
        `;
        
        // Build dynamic query with external_id if available
        let queryParams = [patientNik, patientNik.trim(), patientDbId || patientId, String(patientDbId || patientId)];
        
        if (patientExternalId) {
          visitsQuery += `
             OR v.external_id = ?
             OR CAST(v.external_id AS CHAR) = ?
             OR BINARY v.external_id = ?
          `;
          queryParams.push(patientExternalId, String(patientExternalId), patientExternalId);
        }
        
        visitsQuery += `
          ORDER BY v.visit_date DESC, v.visit_time DESC
        `;
        
        visits = await query(visitsQuery, queryParams);
        
        // Also try to get visits by patient_id separately to ensure we get all visits
        // This handles cases where some visits might have patient_id but different patient_nik
        if (patientDbId) {
          const additionalQuery = `
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
            WHERE v.patient_id = ?
               OR CAST(v.patient_id AS CHAR) = ?
            ORDER BY v.visit_date DESC, v.visit_time DESC
          `;
          const additionalVisits = await query(additionalQuery, [patientDbId, String(patientDbId)]);
          
          // Merge results and remove duplicates
          const allVisits = [...visits, ...additionalVisits];
          const uniqueVisits = allVisits.filter((visit, index, self) => 
            index === self.findIndex(v => v.id === visit.id)
          );
          
          if (uniqueVisits.length !== visits.length) {
            visits = uniqueVisits;
          }
        } else {
          // Remove duplicates based on visit id to ensure we don't count the same visit twice
          const uniqueVisits = visits.filter((visit, index, self) => 
            index === self.findIndex(v => v.id === visit.id)
          );
          
          if (uniqueVisits.length !== visits.length) {
            visits = uniqueVisits;
          }
        }
      } else {
        // Regular query using patient_id (support both INT and UUID)
        // Also search by patient external_id if available, and try to match by patient_nik from visits
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
          WHERE v.patient_id = ? 
             OR CAST(v.patient_id AS CHAR) = ?
        `;
        
        // Build dynamic query with all possible matches
        // IMPORTANT: Only search for visits that belong to the CORRECT patient
        let queryParams = [];
        
        // Primary search: by patient_id (most reliable)
        if (patientDbId) {
          visitsQuery += `
             AND (v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?)
          `;
          queryParams.push(patientDbId, String(patientDbId));
        } else {
          // If no patientDbId, we can't reliably find visits
          visitsQuery += ` AND 1=0 `; // Always false - no results
        }
        
        // Also verify by patient external_id through JOIN to ensure correct patient
        if (patientExternalId && patientExternalId === patientId) {
          visitsQuery += `
             AND (p.external_id = ? OR CAST(p.external_id AS CHAR) = ? OR BINARY p.external_id = ?)
          `;
          queryParams.push(patientExternalId, String(patientExternalId), patientExternalId);
        }
        
        visitsQuery += `
          ORDER BY v.visit_date DESC, v.visit_time DESC
        `;
        
        visits = await query(visitsQuery, queryParams);
        
        // Remove duplicates based on visit id
        const uniqueVisits = visits.filter((visit, index, self) => 
          index === self.findIndex(v => v.id === visit.id)
        );
        
        if (uniqueVisits.length !== visits.length) {
          visits = uniqueVisits;
        }
        
        // If still no visits found, try a more aggressive search
        if (visits.length === 0 && patientDbId) {
          const aggressiveQuery = `
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
              v.patient_department,
              v.patient_id as visit_patient_id,
              p.id as patient_table_id,
              p.external_id as patient_external_id
            FROM visits v
            LEFT JOIN patients p ON v.patient_id = p.id
            LEFT JOIN doctors d ON v.doctor_id = d.id
            WHERE v.patient_id = ?
               OR CAST(v.patient_id AS CHAR) = ?
               OR v.patient_id IN (SELECT id FROM patients WHERE external_id = ? OR CAST(id AS CHAR) = ?)
            ORDER BY v.visit_date DESC, v.visit_time DESC
            LIMIT 100
          `;
          const aggressiveParams = [patientDbId, String(patientDbId), patientExternalId || patientId, String(patientDbId)];
          const aggressiveVisits = await query(aggressiveQuery, aggressiveParams);
          if (aggressiveVisits.length > 0) {
            // Remove duplicates from aggressive search results
            const uniqueAggressiveVisits = aggressiveVisits.filter((visit, index, self) => 
              index === self.findIndex(v => v.id === visit.id)
            );
            visits = uniqueAggressiveVisits;
          }
        }
      }
      
      // Final deduplication before setting total
      const finalUniqueVisits = visits.filter((visit, index, self) => 
        index === self.findIndex(v => v.id === visit.id)
      );
      
      if (finalUniqueVisits.length !== visits.length) {
        visits = finalUniqueVisits;
      }
      
      totalVisits = visits.length;
      totalPages = 1;
    } else {
      // Get total count for pagination
      let countQuery, countParams;
      
      if (useNik && patientNik && patientNik.length > 0) {
        countQuery = `
          SELECT COUNT(*) as total
          FROM visits v
          WHERE (v.patient_nik = ? OR TRIM(v.patient_nik) = ?)
             OR v.patient_id = ? 
             OR CAST(v.patient_id AS CHAR) = ?
        `;
        countParams = [patientNik, patientNik.trim(), patientDbId || patientId, String(patientDbId || patientId)];
        
        if (patientExternalId) {
          countQuery += `
             OR v.external_id = ?
             OR CAST(v.external_id AS CHAR) = ?
             OR BINARY v.external_id = ?
          `;
          countParams.push(patientExternalId, String(patientExternalId), patientExternalId);
        }
      } else {
        countQuery = `
          SELECT COUNT(*) as total
          FROM visits v
          LEFT JOIN patients p ON v.patient_id = p.id
          WHERE v.patient_id = ? 
             OR CAST(v.patient_id AS CHAR) = ?
        `;
        countParams = [patientDbId || patientId, String(patientDbId || patientId)];
        
        // Also search by patient external_id if available (through join)
        if (patientExternalId) {
          countQuery += `
             OR (p.external_id = ? AND p.external_id IS NOT NULL)
             OR (CAST(p.external_id AS CHAR) = ? AND p.external_id IS NOT NULL)
             OR (BINARY p.external_id = ? AND p.external_id IS NOT NULL)
          `;
          countParams.push(patientExternalId, String(patientExternalId), patientExternalId);
        }
        
        // If we have patientDbId, also try to match visits that might have this as patient_id
        if (patientDbId) {
          countQuery += `
             OR v.patient_id = ?
          `;
          countParams.push(patientDbId);
        }
        
        // Also try to find visits by patient_nik from visits table
        if (patientExternalId) {
          countQuery += `
             OR EXISTS (
               SELECT 1 FROM patients p2 
               WHERE p2.external_id = ? 
                 AND p2.nik IS NOT NULL 
                 AND v.patient_nik = p2.nik
             )
          `;
          countParams.push(patientExternalId);
        }
      }

      const countResult = await query(countQuery, countParams);
      totalVisits = countResult[0]?.total || 0;
      totalPages = Math.ceil(totalVisits / limit);
      const offset = (page - 1) * limit;

      // Get visits with pagination
      // If useNik is true but NIK not found, fallback to patient_id search
      if (useNik && patientNik && patientNik.length > 0) {
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
          WHERE (v.patient_nik = ? OR TRIM(v.patient_nik) = ?)
             OR v.patient_id = ? 
             OR CAST(v.patient_id AS CHAR) = ?
        `;
        
        // Build dynamic query with external_id if available
        let queryParams = [patientNik, patientNik.trim(), patientDbId || patientId, String(patientDbId || patientId)];
        
        if (patientExternalId) {
          visitsQuery += `
             OR v.external_id = ?
             OR CAST(v.external_id AS CHAR) = ?
             OR BINARY v.external_id = ?
          `;
          queryParams.push(patientExternalId, String(patientExternalId), patientExternalId);
        }
        
        visitsQuery += `
          ORDER BY v.visit_date DESC, v.visit_time DESC
          LIMIT ? OFFSET ?
        `;
        queryParams.push(Number(limit), Number(offset));
        
        visits = await query(visitsQuery, queryParams);
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
          WHERE 1=1
        `;
        
        // Build dynamic query - ONLY search for visits of the CORRECT patient
        let queryParams = [];
        
        // CRITICAL: Only search if we found the correct patient
        if (patientDbId && patientExternalId === patientId) {
          // Primary search: by patient_id (most reliable)
          visitsQuery += `
             AND (v.patient_id = ? OR CAST(v.patient_id AS CHAR) = ?)
          `;
          queryParams.push(patientDbId, String(patientDbId));
          
          // Also verify through JOIN to ensure correct patient
          visitsQuery += `
             AND (p.external_id = ? OR CAST(p.external_id AS CHAR) = ? OR BINARY p.external_id = ?)
          `;
          queryParams.push(patientId, String(patientId), patientId);
        } else {
          // If patient not found correctly, don't return any visits
          visitsQuery += ` AND 1=0 `; // Always false - no results
        }
        
        visitsQuery += `
          ORDER BY v.visit_date DESC, v.visit_time DESC
          LIMIT ? OFFSET ?
        `;
        queryParams.push(Number(limit), Number(offset));
        
        visits = await query(visitsQuery, queryParams);
        
        // If still no visits found, try aggressive search
        if (visits.length === 0 && patientDbId) {
          const aggressiveQuery = `
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
            WHERE v.patient_id = ?
               OR CAST(v.patient_id AS CHAR) = ?
               OR v.patient_id IN (SELECT id FROM patients WHERE external_id = ? OR CAST(id AS CHAR) = ?)
            ORDER BY v.visit_date DESC, v.visit_time DESC
            LIMIT ? OFFSET ?
          `;
          const aggressiveParams = [patientDbId, String(patientDbId), patientExternalId || patientId, String(patientDbId), Number(limit), Number(offset)];
          const aggressiveVisits = await query(aggressiveQuery, aggressiveParams);
          if (aggressiveVisits.length > 0) {
            visits = aggressiveVisits;
          }
        }
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
      { 
        error: "Failed to fetch patient visits",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 