import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';


export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const patientId = params.id;

    // If limit is very large (like 1000), fetch all visits without pagination
    const fetchAll = limit >= 1000;
    
    let visitsQuery, visits, totalVisits, totalPages;

    if (fetchAll) {
      // Fetch all visits without pagination
      visitsQuery = `
        SELECT 
          v.id,
          v.visit_date,
          v.visit_time,
          v.status,
          v.complaint,
          v.treatment,
          v.notes,
          v.room,
          v.created_at,
          v.updated_at,
          p.name as patient_name,
          p.mrn as mr_number,
          d.name as doctor_name
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.id
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE v.patient_id = ?
        ORDER BY v.visit_date DESC, v.visit_time DESC
      `;
      
      visits = await query(visitsQuery, [patientId]);
      totalVisits = visits.length;
      totalPages = 1;
    } else {
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.id
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE v.patient_id = ?
      `;

      const countResult = await query(countQuery, [patientId]);
      totalVisits = countResult[0]?.total || 0;
      totalPages = Math.ceil(totalVisits / limit);
      const offset = (page - 1) * limit;

      // Get visits with pagination
      visitsQuery = `
        SELECT 
          v.id,
          v.visit_date,
          v.visit_time,
          v.status,
          v.complaint,
          v.treatment,
          v.notes,
          v.room,
          v.created_at,
          v.updated_at,
          p.name as patient_name,
          p.mrn as mr_number,
          d.name as doctor_name
        FROM visits v
        LEFT JOIN patients p ON v.patient_id = p.id
        LEFT JOIN doctors d ON v.doctor_id = d.id
        WHERE v.patient_id = ?
        ORDER BY v.visit_date DESC, v.visit_time DESC
        LIMIT ? OFFSET ?
      `;

      visits = await query(visitsQuery, [patientId, Number(limit), Number(offset)]);
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
    console.error("Error fetching patient visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient visits" },
      { status: 500 }
    );
  }
} 