import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET family members by NIP (Nomor Induk Pegawai)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nip = searchParams.get("nip");
  
  if (!nip) {
    return NextResponse.json(
      { error: "NIP parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Trim NIP to remove any whitespace
    const cleanNip = nip.trim();
    
    // Query to get all patients with the same NIP
    // Using TRIM to handle any whitespace in database
    // Only selecting columns that exist in base patients table
    const sql = `
      SELECT 
        p.id,
        p.external_id,
        p.mrn,
        p.nip,
        p.name,
        p.nik,
        p.birthdate as birthDate,
        p.gender,
        p.address,
        p.phone,
        p.email,
        p.insurance_number as insurance,
        p.created_at,
        p.updated_at
      FROM patients p
      WHERE TRIM(p.nip) = ? AND p.nip IS NOT NULL AND p.nip != ''
      ORDER BY p.name ASC
    `;
    
    let familyMembers = await query(sql, [cleanNip]);
    
    // Try to get extended fields if they exist
    if (familyMembers.length > 0) {
      try {
        // Query with optional columns - using COALESCE to handle missing columns
        // This approach is safer and works even if some columns don't exist
        const extendedSql = `
          SELECT 
            p.id,
            p.external_id,
            p.mrn,
            p.nip,
            p.name,
            p.nik,
            p.birthdate as birthDate,
            p.gender,
            p.address,
            p.phone,
            p.email,
            p.insurance_number as insurance,
            COALESCE(p.no_peserta, NULL) as noPeserta,
            COALESCE(p.nama_peserta, NULL) as namaPeserta,
            COALESCE(p.bagian, NULL) as bagian,
            COALESCE(p.religion, NULL) as religion,
            COALESCE(p.marital_status, NULL) as maritalStatus,
            COALESCE(p.occupation, NULL) as occupation,
            COALESCE(p.status, 'Aktif') as status,
            p.clinic_id,
            p.created_at,
            p.updated_at,
            COALESCE(p.synced_at, NULL) as synced_at
          FROM patients p
          WHERE TRIM(p.nip) = ? AND p.nip IS NOT NULL AND p.nip != ''
          ORDER BY 
            CASE 
              WHEN p.nama_peserta IS NOT NULL AND p.name = p.nama_peserta THEN 0 
              ELSE 1 
            END,
            p.name ASC
        `;
        familyMembers = await query(extendedSql, [cleanNip]);
      } catch (extError) {
        // If extended query fails (e.g., column doesn't exist), use basic query
        // The error is logged but we continue with basic results
        // This is expected if some columns don't exist in the database
        if (extError.message && extError.message.includes('blood_type')) {
          // Silently ignore - blood_type column doesn't exist, use basic query
        } else {
          console.error('Extended query error (using basic query):', extError.message);
        }
        // Continue with basic query results - familyMembers already has data from first query
      }
    }
    
    // Transform data to match expected format
    const transformedData = familyMembers.map((member) => ({
      id: member.external_id || member.id,
      mrn: member.mrn || member.nip,
      name: member.name,
      nik: member.nik,
      nip: member.nip,
      birthDate: member.birthDate,
      gender: member.gender,
      address: member.address,
      phone: member.phone,
      email: member.email,
      bloodType: member.bloodType || null,
      religion: member.religion || null,
      maritalStatus: member.maritalStatus || null,
      occupation: member.occupation || null,
      insurance: member.insurance,
      noPeserta: member.noPeserta || null,
      namaPeserta: member.namaPeserta || null,
      bagian: member.bagian || null,
      status: member.status || "Aktif",
      clinic_id: member.clinic_id,
      created_at: member.created_at,
      updated_at: member.updated_at,
      synced_at: member.synced_at || null,
      isMainParticipant: member.namaPeserta && member.name === member.namaPeserta, // Flag to indicate if this is the main participant (kepala keluarga)
    }));
    
    // Get nama peserta (should be the same for all members)
    const namaPeserta = familyMembers.length > 0 ? familyMembers[0].namaPeserta : null;
    
    return NextResponse.json({
      success: true,
      nip: nip,
      namaPeserta: namaPeserta, // Nama kepala keluarga (pemilik NIP)
      totalMembers: transformedData.length,
      data: transformedData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch family members",
        message: error.message
      },
      { status: 500 }
    );
  }
}

