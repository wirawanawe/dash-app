import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(request) {
  try {
    const {
      user_id,
      name,
      phone,
      date_of_birth,
      gender,
      height,
      weight,
      blood_type,
      emergency_contact_name,
      emergency_contact_phone,
      activity_level,
      fitness_goal,
      wellness_program_joined,
      wellness_join_date,
      ktp_number,
      address,
      insurance,
      insurance_card_number,
      insurance_type,
      // Mobile app field names
      insurance_provider,
      insurance_number
    } = await request.json();

    // Validate required fields
    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Find the actual mobile_users ID from Google user ID or direct ID
    let actualUserId = user_id;
    
    // If it's a Google user ID (starts with 'google_'), find the corresponding mobile_users record
    if (typeof user_id === 'string' && user_id.startsWith('google_')) {
      const userCheck = await query(
        'SELECT id FROM mobile_users WHERE password = ?',
        [user_id]
      );
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }
      actualUserId = userCheck[0].id;
    } else {
      // Check if it's a direct mobile_users ID
      const userCheck = await query(
        'SELECT id FROM mobile_users WHERE id = ?',
        [user_id]
      );
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User tidak ditemukan",
          },
          { status: 404 }
        );
      }
    }

    // Validate blood_type against ENUM values
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;

    // Convert date_of_birth from ISO string to MySQL DATE format
    let formattedDateOfBirth = null;
    if (date_of_birth !== undefined && date_of_birth !== null) {
      try {
        const date = new Date(date_of_birth);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for MySQL DATE column
          formattedDateOfBirth = date.toISOString().split('T')[0];
        }
      } catch (error) {

        return NextResponse.json(
          {
            success: false,
            message: "Format tanggal lahir tidak valid",
          },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phone !== undefined) {
      // Check if phone is already taken by another user
      const existingPhone = await query(
        'SELECT id FROM mobile_users WHERE phone = ? AND id != ?',
        [phone, actualUserId]
      );

      if (existingPhone.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Nomor telepon sudah digunakan oleh user lain",
          },
          { status: 400 }
        );
      }
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (formattedDateOfBirth !== null) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(formattedDateOfBirth);
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }

    if (height !== undefined) {
      updateFields.push('height = ?');
      updateValues.push(height);
    }

    if (weight !== undefined) {
      updateFields.push('weight = ?');
      updateValues.push(weight);
    }

    if (validatedBloodType !== undefined) {
      updateFields.push('blood_type = ?');
      updateValues.push(validatedBloodType);
    }

    if (emergency_contact_name !== undefined) {
      updateFields.push('emergency_contact_name = ?');
      updateValues.push(emergency_contact_name);
    }

    if (emergency_contact_phone !== undefined) {
      updateFields.push('emergency_contact_phone = ?');
      updateValues.push(emergency_contact_phone);
    }

    if (activity_level !== undefined) {
      updateFields.push('activity_level = ?');
      updateValues.push(activity_level);
    }

    if (fitness_goal !== undefined) {
      updateFields.push('fitness_goal = ?');
      updateValues.push(fitness_goal);
    }

    if (wellness_program_joined !== undefined) {
      updateFields.push('wellness_program_joined = ?');
      updateValues.push(wellness_program_joined);
    }

    if (wellness_join_date !== undefined) {
      updateFields.push('wellness_join_date = ?');
      updateValues.push(wellness_join_date);
    }

    // New fields
    if (ktp_number !== undefined) {
      updateFields.push('ktp_number = ?');
      updateValues.push(ktp_number);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    // Handle insurance fields - support both formats
    const finalInsurance = insurance !== undefined ? insurance : insurance_provider;
    if (finalInsurance !== undefined) {
      updateFields.push('insurance = ?');
      updateValues.push(finalInsurance);
    }

    const finalInsuranceCardNumber = insurance_card_number !== undefined ? insurance_card_number : insurance_number;
    if (finalInsuranceCardNumber !== undefined) {
      updateFields.push('insurance_card_number = ?');
      updateValues.push(finalInsuranceCardNumber);
    }

    // Handle insurance_type field and auto-update insurance field
    if (insurance_type !== undefined) {
      updateFields.push('insurance_type = ?');
      updateValues.push(insurance_type);
      
      // Auto-update insurance field based on insurance_type
      let insuranceValue = '';
      switch (insurance_type) {
        case 'umum':
          insuranceValue = 'Umum';
          break;
        case 'bpjs':
          insuranceValue = 'BPJS Kesehatan';
          break;
        case 'swasta':
          insuranceValue = 'Asuransi Swasta';
          break;
        default:
          insuranceValue = insurance_type;
      }
      
      updateFields.push('insurance = ?');
      updateValues.push(insuranceValue);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data yang diupdate",
        },
        { status: 400 }
      );
    }

    // Add updated_at and user ID to the query
    updateFields.push('updated_at = NOW()');
    updateValues.push(actualUserId);

    // Update user profile
    await query(
      `UPDATE mobile_users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user data
    const [updatedUser] = await query(
      'SELECT id, name, email, phone, date_of_birth, gender, height, weight, blood_type, emergency_contact_name, emergency_contact_phone, wellness_program_joined, wellness_join_date, activity_level, fitness_goal, ktp_number, address, insurance, insurance_card_number, insurance_type FROM mobile_users WHERE id = ?',
      [actualUserId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile berhasil diupdate",
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 