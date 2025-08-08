import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [user] = await query(
      'SELECT id, name, email, phone, date_of_birth, gender, height, weight, blood_type, emergency_contact_name, emergency_contact_phone, is_active, created_at, updated_at, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE id = ?',
      [id]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile user' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const {
      name,
      email,
      phone,
      date_of_birth,
      gender,
      height,
      weight,
      blood_type,
      emergency_contact_name,
      emergency_contact_phone,
      is_active,
      ktp_number,
      address,
      insurance,
      insurance_card_number
    } = await request.json();

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    // Check if email already exists for other users
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM mobile_users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Convert date_of_birth from ISO string to MySQL DATE format
    let formattedDateOfBirth = null;
    if (date_of_birth !== null && date_of_birth !== undefined) {
      try {
        const date = new Date(date_of_birth);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for MySQL DATE column
          formattedDateOfBirth = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error("Error parsing date_of_birth:", error);
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

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (phone !== undefined) {
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

    if (blood_type !== undefined) {
      // Validate blood_type against ENUM values
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;
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

    if (is_active !== undefined) {
      // Ensure is_active is properly converted to boolean
      const validatedIsActive = is_active === true || is_active === 1 || is_active === 'true' || is_active === '1';
      updateFields.push('is_active = ?');
      updateValues.push(validatedIsActive);
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

    if (insurance !== undefined) {
      updateFields.push('insurance = ?');
      updateValues.push(insurance);
    }

    if (insurance_card_number !== undefined) {
      updateFields.push('insurance_card_number = ?');
      updateValues.push(insurance_card_number);
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
    updateValues.push(id);

    // Update user
    await query(
      `UPDATE mobile_users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'Mobile user updated successfully'
    });
  } catch (error) {
    console.error('Error updating mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to update mobile user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Mobile user not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await query(
      'UPDATE mobile_users SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Mobile user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to delete mobile user' },
      { status: 500 }
    );
  }
} 