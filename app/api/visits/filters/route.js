import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET unique doctors and clinics from visits table for filtering
export async function GET(request) {
  try {
    console.log('📋 Fetching filter options from visits table...');
    
    // Get unique doctors from visits
    const doctorsQuery = `
      SELECT DISTINCT doctor_name as name
      FROM visits 
      WHERE doctor_name IS NOT NULL 
        AND doctor_name != '' 
        AND doctor_name != '-'
      ORDER BY doctor_name ASC
    `;
    
    const doctors = await query(doctorsQuery);
    console.log(`👨‍⚕️ Found ${doctors.length} unique doctors`);
    
    // Get unique clinics from visits (both clinic and room columns)
    const clinicsQuery = `
      SELECT DISTINCT name 
      FROM (
        SELECT DISTINCT clinic as name FROM visits WHERE clinic IS NOT NULL AND clinic != '' AND clinic != '-'
        UNION
        SELECT DISTINCT room as name FROM visits WHERE room IS NOT NULL AND room != '' AND room != '-'
      ) AS combined_clinics
      ORDER BY name ASC
    `;
    
    const clinics = await query(clinicsQuery);
    console.log(`🏥 Found ${clinics.length} unique clinics`);
    
    // Format the response to include id and name for compatibility with existing code
    const formattedDoctors = doctors.map((doc, index) => ({
      id: index + 1,
      name: doc.name,
    }));
    
    const formattedClinics = clinics.map((clinic, index) => ({
      id: index + 1,
      name: clinic.name,
    }));
    
    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
      clinics: formattedClinics,
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch filter options",
        doctors: [],
        clinics: [],
      },
      { status: 500 }
    );
  }
}

