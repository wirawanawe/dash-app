import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/mobile/insurances/types
 * Returns list of insurance types for mobile app
 * Used in Personal Information screen for insurance type dropdown
 */
export async function GET(request) {
  try {
    console.log('🔍 GET /api/mobile/insurances/types - Start');
    
    let insurances = [];
    let tableUsed = '';
    
    try {
      // Query from 'insurances' table (plural) - actual table name in database
      // Table structure: id, name, code, contact_person, phone, email, address, created_at, updated_at
      const result = await query(
        `SELECT 
          id,
          name,
          COALESCE(code, LOWER(REPLACE(name, ' ', '_'))) as code,
          created_at,
          updated_at
        FROM insurances 
        WHERE name IS NOT NULL
          AND name != ''
        ORDER BY name ASC`
      );
      insurances = Array.isArray(result) ? result : [];
      tableUsed = 'insurances';
      console.log(`✅ Fetched from 'insurances' table: ${insurances.length} items`);
    } catch (queryError) {
      console.error('❌ Error fetching from insurances table:', queryError);
      
      // If table doesn't exist, return default types
      if (queryError.code === 'ER_NO_SUCH_TABLE' || 
          queryError.message?.includes("doesn't exist")) {
        console.log('⚠️ Table "insurances" not found, returning default insurance types');
        return NextResponse.json(
          {
            success: true,
            data: [
              { id: 'umum', name: 'Umum', code: 'umum', type: 'umum' },
              { id: 'bpjs', name: 'BPJS Kesehatan', code: 'bpjs', type: 'bpjs' },
              { id: 'swasta', name: 'Asuransi Swasta', code: 'swasta', type: 'swasta' }
            ],
            count: 3,
            message: 'Using default insurance types (table not found)'
          },
          { status: 200 }
        );
      }
      
      // For other errors, also return default types (graceful degradation)
      console.log('⚠️ Query error detected, returning default insurance types');
      return NextResponse.json(
        {
          success: true,
          data: [
            { id: 'umum', name: 'Umum', code: 'umum', type: 'umum' },
            { id: 'bpjs', name: 'BPJS Kesehatan', code: 'bpjs', type: 'bpjs' },
            { id: 'swasta', name: 'Asuransi Swasta', code: 'swasta', type: 'swasta' }
          ],
          count: 3,
          message: 'Using default insurance types (query error)'
        },
        { status: 200 }
      );
    }

    // Format response to match mobile app expectations
    // Expected format: { success: true, data: [{ id, name, code }, ...] }
    // Map code to type for backward compatibility
    const formattedData = (insurances || []).map(insurance => {
      // Generate code from name if not provided
      const code = insurance.code || (insurance.name ? insurance.name.toLowerCase().replace(/\s+/g, '_') : `insurance_${insurance.id}`);
      // Determine type based on code or name
      let type = 'umum';
      if (code && (code.toLowerCase().includes('bpjs') || insurance.name?.toLowerCase().includes('bpjs'))) {
        type = 'bpjs';
      } else if (code && (code.toLowerCase().includes('swasta') || insurance.name?.toLowerCase().includes('swasta'))) {
        type = 'swasta';
      }
      
      return {
        id: code || insurance.id,
        name: insurance.name,
        code: code,
        type: type,
        description: null
      };
    });

    console.log(`✅ Insurance types fetched: ${formattedData.length} items from table: ${tableUsed}`);

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      source: tableUsed || 'default'
    });
  } catch (error) {
    console.error('❌ Error in GET /api/mobile/insurances/types:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });

    // Check if table doesn't exist
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
      return NextResponse.json(
        {
          success: true,
          data: [
            { id: 'umum', name: 'Umum', code: 'umum', type: 'umum' },
            { id: 'bpjs', name: 'BPJS Kesehatan', code: 'bpjs', type: 'bpjs' },
            { id: 'swasta', name: 'Asuransi Swasta', code: 'swasta', type: 'swasta' }
          ],
          count: 3,
          message: 'Using default insurance types (table not found)'
        },
        { status: 200 }
      );
    }

    // Return default types on error (mobile app has fallback anyway)
    return NextResponse.json(
      {
        success: true,
        data: [
          { id: 'umum', name: 'Umum', code: 'umum', type: 'umum' },
          { id: 'bpjs', name: 'BPJS Kesehatan', code: 'bpjs', type: 'bpjs' },
          { id: 'swasta', name: 'Asuransi Swasta', code: 'swasta', type: 'swasta' }
        ],
        count: 3,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 200 }
    );
  }
}

