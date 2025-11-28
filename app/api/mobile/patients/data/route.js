import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/patients/data
 * Returns patient data synced from database based on mobile user's NIK/Insurance number
 */
export async function GET(request) {
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

    // Get mobile user profile to find KTP/Insurance number
    let patientNik = null;
    let patientInsuranceNumber = null;
    
    try {
      const [userProfile] = await query(
        `SELECT ktp_number, insurance_card_number, name, email, phone
         FROM mobile_users 
         WHERE id = ?`,
        [userId]
      );
      
      if (userProfile) {
        patientNik = userProfile.ktp_number;
        patientInsuranceNumber = userProfile.insurance_card_number;
      }
    } catch (userError) {
      console.warn('⚠️ Could not fetch user profile:', userError.message);
      return NextResponse.json({
        success: false,
        message: "Could not fetch user profile",
        error: process.env.NODE_ENV === 'development' ? userError.message : undefined
      }, { status: 500 });
    }

    // If no identifiers found, return message
    if (!patientNik && !patientInsuranceNumber) {
      return NextResponse.json({
        success: false,
        message: "No patient identifier found. Please add KTP number or insurance number in Personal Information.",
        data: null
      }, { status: 200 });
    }

    // Try to find patient data - search in visits table first (most reliable)
    let patient = null;
    let searchMethod = '';

    try {
      // Priority 1: Search in visits table (has patient_nik which is reliable)
      if (patientNik && patientNik.trim() !== '') {
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
            [patientNik.trim()]
          );
          
          if (visits && visits.length > 0) {
            patient = visits[0];
            searchMethod = 'NIK from visits';
          }
        } catch (visitsError) {
          console.warn('⚠️ Could not search in visits table:', visitsError.message);
        }
      }

      // If not found by NIK in visits, try by insurance number in visits
      // Priority: patient_no_peserta first (main column for insurance card number)
      if (!patient && patientInsuranceNumber && patientInsuranceNumber.trim() !== '') {
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
            [patientInsuranceNumber.trim(), patientInsuranceNumber.trim()]
          );
          
          if (visits && visits.length > 0) {
            patient = visits[0];
            searchMethod = 'Insurance Number from visits';
          }
        } catch (visitsError) {
          console.warn('⚠️ Could not search by insurance in visits table:', visitsError.message);
        }
      }

      // Fallback: Try patients table if visits didn't work
      if (!patient) {
        try {
          if (patientNik && patientNik.trim() !== '') {
            // Try with nik column (not ktp_number)
            const [patients] = await query(
              `SELECT * FROM patients 
               WHERE nik = ?
               LIMIT 1`,
              [patientNik.trim()]
            );
            
            if (patients && patients.length > 0) {
              patient = patients[0];
              searchMethod = 'NIK from patients';
            }
          }

          // If not found by NIK, try by insurance number in patients
          if (!patient && patientInsuranceNumber && patientInsuranceNumber.trim() !== '') {
            const [patients] = await query(
              `SELECT * FROM patients 
               WHERE insurance_number = ? OR insurance_card_number = ?
               LIMIT 1`,
              [patientInsuranceNumber.trim(), patientInsuranceNumber.trim()]
            );
            
            if (patients && patients.length > 0) {
              patient = patients[0];
              searchMethod = 'Insurance Number from patients';
            }
          }
        } catch (patientsError) {
          // If patients table doesn't have the columns, that's okay - we tried visits first
          console.warn('⚠️ Could not search in patients table:', patientsError.message);
        }
      }

      // Final fallback: Use data from mobile_users profile if available
      if (!patient) {
        try {
          const [mobileUser] = await query(
            `SELECT id, name, ktp_number, insurance_card_number, 
                    date_of_birth, gender, address, phone, email
             FROM mobile_users 
             WHERE id = ?`,
            [userId]
          );
          
          if (mobileUser && (mobileUser.ktp_number || mobileUser.insurance_card_number)) {
            patient = {
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
            console.log('✅ Using data from mobile_users profile as fallback');
          }
        } catch (mobileUserError) {
          console.warn('⚠️ Could not fetch from mobile_users:', mobileUserError.message);
        }
      }

    } catch (queryError) {
      console.error('❌ Error querying patient data:', queryError);
      
      // If table doesn't exist, return empty
      if (queryError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({
          success: true,
          data: null,
          message: "Patient table not found in database"
        }, { status: 200 });
      }
      
      throw queryError;
    }

    // Format response
    if (patient) {
      return NextResponse.json({
        success: true,
        data: {
          id: patient.id || null,
          name: patient.name || patient.patient_name || null,
          ktpNumber: patient.ktp_number || patient.nik || patient.patient_nik || null,
          insuranceNumber: patient.patient_no_peserta || patient.insurance_card_number || patient.insurance_number || null,
          gender: patient.gender || patient.patient_gender || null,
          dateOfBirth: patient.date_of_birth || patient.birth_date || patient.patient_birth_date || null,
          address: patient.address || patient.patient_address || null,
          phone: patient.phone || null,
          email: patient.email || null
        },
        searchMethod: searchMethod,
        found: true
      });
    } else {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Patient data not found. Please sync your patient data first.",
        searchMethod: patientNik ? 'NIK' : 'Insurance Number',
        found: false
      }, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Error in GET /api/mobile/patients/data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch patient data",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

