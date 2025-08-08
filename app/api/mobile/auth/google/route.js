import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const {
      google_user_id,
      name,
      email,
      phone,
      date_of_birth = null,
      gender = null,
      height = null,
      weight = null,
      blood_type = null,
      emergency_contact_name = null,
      emergency_contact_phone = null,
      ktp_number = null,
      address = null,
      insurance = null,
      insurance_card_number = null
    } = await request.json();

    // Validate required fields
    if (!google_user_id || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Google user ID, name, dan email wajib diisi",
        },
        { status: 400 }
      );
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

    // Check if user already exists
    const [existingUser] = await query(
      'SELECT id, name, email, phone, date_of_birth, gender, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    let user;
    let isNewUser = false;

    if (existingUser) {
      // Update existing user if needed
      user = existingUser;
      const updateFields = [];
      const updateValues = [];

      if (!user.name && name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }

      if (!user.phone && phone) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }

      if (!user.date_of_birth && formattedDateOfBirth) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(formattedDateOfBirth);
      }

      if (!user.gender && gender) {
        updateFields.push('gender = ?');
        updateValues.push(gender);
      }

      if (!user.ktp_number && ktp_number) {
        updateFields.push('ktp_number = ?');
        updateValues.push(ktp_number);
      }

      if (!user.address && address) {
        updateFields.push('address = ?');
        updateValues.push(address);
      }

      if (!user.insurance && insurance) {
        updateFields.push('insurance = ?');
        updateValues.push(insurance);
      }

      if (!user.insurance_card_number && insurance_card_number) {
        updateFields.push('insurance_card_number = ?');
        updateValues.push(insurance_card_number);
      }

      if (updateFields.length > 0) {
        updateValues.push(user.id);
        await query(
          `UPDATE mobile_users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          updateValues
        );
        
        // Get updated user data
        const [updatedUser] = await query(
          'SELECT id, name, email, phone, date_of_birth, gender, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE id = ?',
          [user.id]
        );
        user = updatedUser;
      }
    } else {
      // Create new user
      isNewUser = true;
      
      // Validate blood_type against ENUM values
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;

      // Insert new user
      const sql = `
        INSERT INTO mobile_users (
          name, email, phone, password, date_of_birth, gender,
          emergency_contact_name, emergency_contact_phone, ktp_number, address, insurance,
          insurance_card_number, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `;

      const result = await query(sql, [
        name, email, phone, `google_${google_user_id}`, formattedDateOfBirth, gender,
        emergency_contact_name, emergency_contact_phone, ktp_number, address, insurance, insurance_card_number
      ]);

      // Get the created user
      const [newUser] = await query(
        'SELECT id, name, email, phone, date_of_birth, gender, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE id = ?',
        [result.insertId]
      );
      user = newUser;
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      googleUserId: google_user_id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "MOBILE_USER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Create refresh token
    const refreshToken = await new SignJWT({
      userId: user.id,
      googleUserId: google_user_id,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    return NextResponse.json(
      {
        success: true,
        message: isNewUser ? "User berhasil dibuat" : "Login berhasil",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            date_of_birth: user.date_of_birth,
            gender: user.gender,
            ktp_number: user.ktp_number,
            address: user.address,
            insurance: user.insurance,
            insurance_card_number: user.insurance_card_number,
            role: "MOBILE_USER",
          },
          accessToken: token,
          refreshToken: refreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 