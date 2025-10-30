import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Handle both date_of_birth and dateOfBirth field names
    const {
      name,
      email,
      phone,
      password,
      date_of_birth,
      dateOfBirth, // Mobile app sends this
      gender,
      height,
      weight,
      blood_type,
      emergency_contact_name,
      emergency_contact_phone,
      ktp_number,
      address,
      insurance,
      insurance_card_number
    } = body;

    // Use dateOfBirth if date_of_birth is not provided
    const finalDateOfBirth = date_of_birth || dateOfBirth;

    // Convert date_of_birth from ISO string to MySQL DATE format
    let formattedDateOfBirth = null;
    if (finalDateOfBirth !== null && finalDateOfBirth !== undefined) {
      try {
        const date = new Date(finalDateOfBirth);
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

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, phone, dan password wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM mobile_users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email sudah terdaftar",
        },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await query(
      'SELECT id FROM mobile_users WHERE phone = ?',
      [phone]
    );

    if (existingPhone.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor telepon sudah terdaftar",
        },
        { status: 400 }
      );
    }

    // Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate blood_type against ENUM values
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const validatedBloodType = blood_type && validBloodTypes.includes(blood_type) ? blood_type : null;

    // Insert new user with wellness_program_cycles set to 0
    const sql = `
      INSERT INTO mobile_users (
        name, email, phone, password, date_of_birth, gender,
        emergency_contact_name, emergency_contact_phone, ktp_number, address, insurance,
        insurance_card_number, wellness_program_cycles, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())
    `;

    // Ensure all parameters are properly handled (convert undefined to null)
    const params = [
      name || null,
      email || null,
      phone || null,
      hashedPassword || null,
      formattedDateOfBirth || null,
      gender || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      ktp_number || null,
      address || null,
      insurance || null,
      insurance_card_number || null
    ];

    const result = await query(sql, params);

    // Get the created user
    const [newUser] = await query(
      'SELECT id, name, email, phone, date_of_birth, gender, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE id = ?',
      [result.insertId]
    );

    // Create JWT token
    const token = await new SignJWT({
      userId: newUser.id,
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: "MOBILE_USER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Create refresh token
    const refreshToken = await new SignJWT({
      userId: newUser.id,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil",
        data: {
          user: newUser,
          accessToken: token,
          refreshToken: refreshToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 