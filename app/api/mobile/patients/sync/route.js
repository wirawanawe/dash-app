import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mobile/patients/sync
 * Sync patient data for mobile user based on insurance number or KTP number
 * 
 * Body:
 * - insurance_number (optional)
 * - ktp_number (optional)
 */
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.userId;
    const body = await request.json();
    
    // Prioritize KTP number over insurance number
    const ktpNumber = body.ktp_number || body.nik;
    const insuranceNumber = body.insurance_number || body.insurance_card_number;

    // Validate that at least one identifier is provided
    if (!ktpNumber && !insuranceNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "KTP number or insurance number is required",
        },
        { status: 400 }
      );
    }

    let patientData = null;
    let searchMethod = '';
    let foundInTable = '';

    try {
      // Search in visits table first (most reliable - has patient_nik)
      // Then try patients table as fallback
      
      // Priority 1: Search in visits table by patient_nik using KTP (most reliable)
      if (ktpNumber && ktpNumber.trim() !== '') {
        try {
          const [visits] = await query(
            `SELECT DISTINCT 
               patient_name, patient_nik, patient_gender, 
               patient_birth_date,
               insurance_number, insurance_card_number,
               patient_nip, patient_no_peserta, patient_nama_peserta,
               patient_department
             FROM visits 
             WHERE patient_nik = ?
             ORDER BY visit_date DESC
             LIMIT 1`,
            [ktpNumber.trim()]
          );
          
          if (visits && visits.length > 0) {
            patientData = visits[0];
            searchMethod = 'KTP/NIK';
            foundInTable = 'visits';
          }
        } catch (visitsError) {
          console.warn('⚠️ Could not search in visits table:', visitsError.message);
        }
      }

      // If not found in visits, try by insurance number in visits
      // Priority: patient_no_peserta first (main column for insurance card number)
      if (!patientData && insuranceNumber && insuranceNumber.trim() !== '') {
        try {
          const [visits] = await query(
            `SELECT DISTINCT 
               patient_name, patient_nik, patient_gender, 
               patient_birth_date,
               insurance_number, insurance_card_number,
               patient_nip, patient_no_peserta, patient_nama_peserta,
               patient_department
             FROM visits 
             WHERE patient_no_peserta = ? OR insurance_card_number = ?
             ORDER BY visit_date DESC
             LIMIT 1`,
            [insuranceNumber.trim(), insuranceNumber.trim()]
          );
          
          if (visits && visits.length > 0) {
            patientData = visits[0];
            searchMethod = 'Insurance Number';
            foundInTable = 'visits';
          }
        } catch (visitsError) {
          console.warn('⚠️ Could not search by insurance in visits table:', visitsError.message);
        }
      }

      // Fallback: Try patients table if visits didn't work
      if (!patientData) {
        try {
          if (ktpNumber && ktpNumber.trim() !== '') {
            // Try with nik column
            const [patients] = await query(
              `SELECT * FROM patients 
               WHERE nik = ?
               LIMIT 1`,
              [ktpNumber.trim()]
            );
            
            if (patients && patients.length > 0) {
              patientData = patients[0];
              searchMethod = 'KTP/NIK';
              foundInTable = 'patients';
            }
          }
          
          if (!patientData && insuranceNumber && insuranceNumber.trim() !== '') {
            const [patients] = await query(
              `SELECT * FROM patients 
               WHERE insurance_number = ? OR insurance_card_number = ?
               LIMIT 1`,
              [insuranceNumber.trim(), insuranceNumber.trim()]
            );
            
            if (patients && patients.length > 0) {
              patientData = patients[0];
              searchMethod = 'Insurance Number';
              foundInTable = 'patients';
            }
          }
        } catch (patientsError) {
          // If patients table doesn't have the columns, that's okay - we tried visits first
          console.warn('⚠️ Could not search in patients table:', patientsError.message);
        }
      }

      // Final fallback: Use data from mobile_users profile if available
      if (!patientData) {
        try {
          const [mobileUser] = await query(
            `SELECT id, name, ktp_number, insurance_card_number, 
                    date_of_birth, gender, address, phone, email
             FROM mobile_users 
             WHERE id = ?`,
            [userId]
          );
          
          if (mobileUser) {
            // Check if the identifiers match what was requested
            const hasMatchingKTP = !ktpNumber || (mobileUser.ktp_number && mobileUser.ktp_number === ktpNumber.trim());
            const hasMatchingInsurance = !insuranceNumber || (mobileUser.insurance_card_number && mobileUser.insurance_card_number === insuranceNumber.trim());
            
            if (hasMatchingKTP || hasMatchingInsurance) {
              patientData = {
                name: mobileUser.name,
                patient_name: mobileUser.name,
                nik: mobileUser.ktp_number,
                patient_nik: mobileUser.ktp_number,
                ktp_number: mobileUser.ktp_number,
                insurance_card_number: mobileUser.insurance_card_number,
                date_of_birth: mobileUser.date_of_birth,
                birth_date: mobileUser.date_of_birth,
                patient_birth_date: mobileUser.date_of_birth,
                gender: mobileUser.gender,
                patient_gender: mobileUser.gender,
                address: mobileUser.address,
                phone: mobileUser.phone,
                email: mobileUser.email
              };
              searchMethod = 'Mobile User Profile';
              foundInTable = 'mobile_users';
              console.log('✅ Using data from mobile_users profile as fallback');
            }
          }
        } catch (mobileUserError) {
          console.warn('⚠️ Could not fetch from mobile_users:', mobileUserError.message);
        }
      }

      // Update mobile user profile with found data (only if not from mobile_users table)
      if (patientData && foundInTable !== 'mobile_users') {
        const updateFields = [];
        const updateParams = [];

        // Update KTP number if found and not already set
        if (patientData.patient_nik || patientData.nik) {
          const nik = patientData.patient_nik || patientData.nik;
          if (nik) {
            updateFields.push('ktp_number = ?');
            updateParams.push(nik);
          }
        }

        // Update insurance number if found and not already set
        // Priority: patient_no_peserta first (main column for insurance card number in visits table)
        if (patientData.patient_no_peserta || patientData.insurance_card_number || patientData.insurance_number) {
          const insNum = patientData.patient_no_peserta || patientData.insurance_card_number || patientData.insurance_number;
          if (insNum) {
            updateFields.push('insurance_card_number = ?');
            updateParams.push(insNum);
          }
        }

        // Update name if found
        if (patientData.name || patientData.patient_name) {
          const name = patientData.name || patientData.patient_name;
          updateFields.push('name = ?');
          updateParams.push(name);
        }

        // Update date of birth if found
        if (patientData.date_of_birth || patientData.birth_date || patientData.patient_birth_date) {
          const dob = patientData.date_of_birth || patientData.birth_date || patientData.patient_birth_date;
          updateFields.push('date_of_birth = ?');
          updateParams.push(dob);
        }

        // Update gender if found
        if (patientData.gender || patientData.patient_gender) {
          const gender = patientData.gender || patientData.patient_gender;
          updateFields.push('gender = ?');
          updateParams.push(gender);
        }

        // Note: patient_address is not available in visits table
        // Address should be fetched from patients table if needed
        // Skip address update for now

        if (updateFields.length > 0) {
          updateParams.push(userId);
          
          await query(
            `UPDATE mobile_users 
             SET ${updateFields.join(', ')}, updated_at = NOW()
             WHERE id = ?`,
            updateParams
          );
          
          console.log(`✅ Updated mobile user ${userId} profile with patient data from ${foundInTable}`);
        }
      } else if (patientData && foundInTable === 'mobile_users') {
        console.log(`ℹ️ Using existing data from mobile_users profile, no update needed`);
      }

    } catch (queryError) {
      console.error('❌ Error querying patient data:', queryError);
      
      // If table doesn't exist, return message
      if (queryError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({
          success: false,
          message: "Patient or visits table not found in database",
          data: null
        }, { status: 200 });
      }
      
      throw queryError;
    }

    // Format response
    if (patientData) {
      return NextResponse.json({
        success: true,
        message: "Patient data synced successfully",
        data: {
          id: patientData.id || null,
          name: patientData.name || patientData.patient_name || null,
          ktpNumber: patientData.ktp_number || patientData.nik || patientData.patient_nik || null,
          insuranceNumber: patientData.patient_no_peserta || patientData.insurance_card_number || patientData.insurance_number || null,
          gender: patientData.gender || patientData.patient_gender || null,
          dateOfBirth: patientData.date_of_birth || patientData.birth_date || patientData.patient_birth_date || null,
          address: patientData.address || patientData.patient_address || null,
          phone: patientData.phone || null,
          email: patientData.email || null
        },
        searchMethod: searchMethod,
        foundInTable: foundInTable,
        profileUpdated: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Patient data not found. Please check your insurance number or KTP number.",
        data: null,
        searchMethod: ktpNumber ? 'KTP/NIK' : 'Insurance Number'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Error in POST /api/mobile/patients/sync:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync patient data",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

