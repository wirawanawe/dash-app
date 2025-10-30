import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Debug endpoint to check family data
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nip = searchParams.get("nip") || "5383001L";
  
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      nip: nip,
      checks: {}
    };

    // Check 1: Count total patients with NIP
    const [nipStats] = await query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT nip) as unique_nips FROM patients WHERE nip IS NOT NULL AND nip != ""'
    );
    debug.checks.nipStats = nipStats;

    // Check 2: Find exact match (basic fields only)
    const exactMatch = await query(
      'SELECT id, name, nip, nik, mrn, gender, address, phone, email FROM patients WHERE nip = ?',
      [nip]
    );
    debug.checks.exactMatch = {
      count: exactMatch.length,
      data: exactMatch
    };

    // Check 3: Find with TRIM
    const trimMatch = await query(
      'SELECT id, name, nip, nik, mrn, gender, address, phone, email FROM patients WHERE TRIM(nip) = ?',
      [nip]
    );
    debug.checks.trimMatch = {
      count: trimMatch.length,
      data: trimMatch
    };

    // Check 4: Find similar (LIKE)
    const likeMatch = await query(
      'SELECT id, name, nip, nik, mrn, gender, address, phone, email FROM patients WHERE nip LIKE ?',
      [`%${nip}%`]
    );
    debug.checks.likeMatch = {
      count: likeMatch.length,
      data: likeMatch
    };
    
    // Check 5: Try to get extended fields if available
    try {
      const extendedMatch = await query(
        'SELECT id, name, nip, nik, mrn, no_peserta, nama_peserta, bagian, gender FROM patients WHERE TRIM(nip) = ?',
        [nip]
      );
      debug.checks.extendedFields = {
        count: extendedMatch.length,
        data: extendedMatch,
        note: "Extended fields (no_peserta, nama_peserta, bagian) are available"
      };
    } catch (extError) {
      debug.checks.extendedFields = {
        error: extError.message,
        note: "Extended fields not available - need to run ALTER TABLE script"
      };
    }

    // Check 6: All distinct NIPs
    const allNips = await query(
      'SELECT DISTINCT nip, COUNT(*) as count FROM patients WHERE nip IS NOT NULL AND nip != "" GROUP BY nip ORDER BY count DESC LIMIT 10'
    );
    debug.checks.topNips = allNips;

    // Check 7: Families (NIPs with multiple patients) - basic version
    const familiesBasic = await query(
      `SELECT nip, COUNT(*) as member_count, GROUP_CONCAT(name SEPARATOR ', ') as members
       FROM patients 
       WHERE nip IS NOT NULL AND nip != ''
       GROUP BY nip
       HAVING COUNT(*) > 1
       ORDER BY member_count DESC
       LIMIT 10`
    );
    debug.checks.familiesBasic = familiesBasic;
    
    // Try extended families query if nama_peserta exists
    try {
      const familiesExtended = await query(
        `SELECT nip, nama_peserta, COUNT(*) as member_count, GROUP_CONCAT(name SEPARATOR ', ') as members
         FROM patients 
         WHERE nip IS NOT NULL AND nip != ''
         GROUP BY nip, nama_peserta
         HAVING COUNT(*) > 1
         ORDER BY member_count DESC
         LIMIT 10`
      );
      debug.checks.familiesExtended = familiesExtended;
    } catch (famError) {
      debug.checks.familiesExtended = {
        error: famError.message,
        note: "nama_peserta field not available"
      };
    }

    return NextResponse.json(debug, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to debug family data",
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

