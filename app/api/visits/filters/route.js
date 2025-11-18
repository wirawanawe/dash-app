import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET unique doctors and clinics from visits table for filtering
export async function GET(request) {
  try {
    // Get unique doctors with their polyclinics from visits
    const doctorsQuery = `
      SELECT DISTINCT 
        doctor_name as name,
        clinic as polyclinic,
        room as polyclinic_alt
      FROM visits 
      WHERE external_id IS NOT NULL
        AND doctor_name IS NOT NULL 
        AND doctor_name != '' 
        AND doctor_name != '-'
      ORDER BY doctor_name ASC
    `;
    
    const doctorsRaw = await query(doctorsQuery);
    
    // Create a map of doctors with their associated polyclinics
    const doctorPoliMap = {};
    doctorsRaw.forEach(doc => {
      const docName = doc.name;
      const poli = doc.polyclinic || doc.polyclinic_alt || null;
      
      if (!doctorPoliMap[docName]) {
        doctorPoliMap[docName] = new Set();
      }
      if (poli && poli !== '-') {
        doctorPoliMap[docName].add(poli);
      }
    });
    
    // Get unique clinics/polyclinics from visits (both clinic and room columns)
    const clinicsQuery = `
      SELECT DISTINCT name 
      FROM (
        SELECT DISTINCT clinic as name FROM visits WHERE external_id IS NOT NULL AND clinic IS NOT NULL AND clinic != '' AND clinic != '-'
        UNION
        SELECT DISTINCT room as name FROM visits WHERE external_id IS NOT NULL AND room IS NOT NULL AND room != '' AND room != '-'
      ) AS combined_clinics
      ORDER BY name ASC
    `;
    
    const clinics = await query(clinicsQuery);
    
    // Format the response to include id, name, and polyclinics for doctors
    const formattedDoctors = Object.keys(doctorPoliMap).map((docName, index) => ({
      id: index + 1,
      name: docName,
      polyclinics: Array.from(doctorPoliMap[docName]),
    }));
    
    const formattedClinics = clinics.map((clinic, index) => ({
      id: index + 1,
      name: clinic.name,
    }));
    
    // Get unique facility names (faskes) from visits table
    const facilityNamesQuery = `
      SELECT DISTINCT facility_name as name
      FROM visits 
      WHERE external_id IS NOT NULL
        AND facility_name IS NOT NULL 
        AND facility_name != '' 
        AND facility_name != '-'
      ORDER BY facility_name ASC
    `;
    
    const facilityNamesRaw = await query(facilityNamesQuery);
    const facilityNames = facilityNamesRaw.map(f => f.name).filter(Boolean);
    
    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
      clinics: formattedClinics,
      facilityNames: facilityNames,
      // Return the mapping separately for easy lookup
      doctorPoliMapping: doctorPoliMap,
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to fetch filter options",
          doctors: [],
          clinics: [],
          facilityNames: [],
          doctorPoliMapping: {},
        },
        { status: 500 }
      );
  }
}

