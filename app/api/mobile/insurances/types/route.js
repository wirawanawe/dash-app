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
    
    // Try to fetch from 'insurance' table first, then fallback to 'insurances'
    let insurances = [];
    let tableUsed = '';
    
    try {
      // First try: table 'insurance' (singular) - from database
      try {
        // Try to get distinct insurance types from 'insurance' table
        // This handles case where insurance table has patient_id relation
        try {
          // Try with type column first
          const [result] = await query(
            `SELECT DISTINCT
              id,
              name,
              COALESCE(code, LOWER(REPLACE(name, ' ', '_'))) as code,
              COALESCE(type, 'umum') as type,
              COALESCE(description, '') as description,
              COALESCE(is_active, 1) as is_active,
              created_at,
              updated_at
            FROM insurance 
            WHERE COALESCE(is_active, 1) = 1
              AND name IS NOT NULL
              AND name != ''
            ORDER BY name ASC`
          );
          insurances = result || [];
          tableUsed = 'insurance';
          console.log(`✅ Fetched from 'insurance' table: ${insurances.length} items`);
        } catch (typeError) {
          // If type column doesn't exist, query without it
          if (typeError.code === 'ER_BAD_FIELD_ERROR' || 
              typeError.message?.includes("Unknown column 'type'")) {
            console.log('⚠️ Column "type" not found in "insurance" table, querying without it...');
            const [result] = await query(
              `SELECT DISTINCT
                id,
                name,
                COALESCE(code, LOWER(REPLACE(name, ' ', '_'))) as code,
                COALESCE(description, '') as description,
                COALESCE(is_active, 1) as is_active,
                created_at,
                updated_at
              FROM insurance 
              WHERE COALESCE(is_active, 1) = 1
                AND name IS NOT NULL
                AND name != ''
              ORDER BY name ASC`
            );
            insurances = result || [];
            tableUsed = 'insurance';
            console.log(`✅ Fetched from 'insurance' table (without type column): ${insurances.length} items`);
          } else {
            throw typeError;
          }
        }
      } catch (insuranceError) {
        // If 'insurance' table doesn't exist or has error, try 'insurances' (plural)
        if (insuranceError.code === 'ER_NO_SUCH_TABLE' || 
            insuranceError.message?.includes("doesn't exist") ||
            insuranceError.code === 'ER_BAD_FIELD_ERROR') {
          console.log('⚠️ Table "insurance" not found or incompatible, trying "insurances" table...');
          try {
            // Try with type column first
            const [result] = await query(
              `SELECT 
                id,
                name,
                COALESCE(code, LOWER(REPLACE(name, ' ', '_'))) as code,
                COALESCE(type, 'umum') as type,
                COALESCE(description, '') as description,
                COALESCE(is_active, 1) as is_active,
                created_at,
                updated_at
              FROM insurances 
              WHERE COALESCE(is_active, 1) = 1
                AND name IS NOT NULL
                AND name != ''
              ORDER BY name ASC`
            );
            insurances = result || [];
            tableUsed = 'insurances';
            console.log(`✅ Fetched from 'insurances' table: ${insurances.length} items`);
          } catch (insurancesError) {
            // If type column doesn't exist, query without it
            if (insurancesError.code === 'ER_BAD_FIELD_ERROR' || 
                insurancesError.message?.includes("Unknown column 'type'")) {
              console.log('⚠️ Column "type" not found in "insurances" table, querying without it...');
              const [result] = await query(
                `SELECT 
                  id,
                  name,
                  COALESCE(code, LOWER(REPLACE(name, ' ', '_'))) as code,
                  COALESCE(description, '') as description,
                  COALESCE(is_active, 1) as is_active,
                  created_at,
                  updated_at
                FROM insurances 
                WHERE COALESCE(is_active, 1) = 1
                  AND name IS NOT NULL
                  AND name != ''
                ORDER BY name ASC`
              );
              insurances = result || [];
              tableUsed = 'insurances';
              console.log(`✅ Fetched from 'insurances' table (without type column): ${insurances.length} items`);
            } else {
              throw insurancesError;
            }
          }
        } else {
          throw insuranceError;
        }
      }
    } catch (queryError) {
      console.error('❌ Error fetching from both tables:', queryError);
      // If it's a column error, return default types instead of throwing
      if (queryError.code === 'ER_BAD_FIELD_ERROR' || 
          queryError.message?.includes("Unknown column")) {
        console.log('⚠️ Column error detected, returning default insurance types');
        return NextResponse.json(
          {
            success: true,
            data: [
              { id: 'umum', name: 'Umum', code: 'umum', type: 'umum' },
              { id: 'bpjs', name: 'BPJS Kesehatan', code: 'bpjs', type: 'bpjs' },
              { id: 'swasta', name: 'Asuransi Swasta', code: 'swasta', type: 'swasta' }
            ],
            count: 3,
            message: 'Using default insurance types (column error)'
          },
          { status: 200 }
        );
      }
      throw queryError;
    }

    // Format response to match mobile app expectations
    // Expected format: { success: true, data: [{ id, name, code }, ...] }
    const formattedData = (insurances || []).map(insurance => ({
      id: insurance.code || insurance.id,
      name: insurance.name,
      code: insurance.code || insurance.type || 'umum',
      type: insurance.type || 'umum',
      description: insurance.description || null
    }));

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

