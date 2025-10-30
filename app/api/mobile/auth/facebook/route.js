import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const {
      facebook_user_id,
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
    if (!facebook_user_id || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Facebook user ID, name, dan email wajib diisi",
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
      'SELECT id, name, email, phone, date_of_birth, gender, ktp_number, address, insurance, insurance_card_number FROM mobile_users WHERE email = ?',
      [email]
    );

    let user;
    let isNewUser = false;

    if (existingUser) {
      // Update existing user if needed
      user = existingUser;
    } else {
      // Create new user
      const insertResult = await query(
        `INSERT INTO mobile_users (
          name, email, phone, date_of_birth, gender, 
          height, weight, blood_type, emergency_contact_name, emergency_contact_phone,
          ktp_number, address, insurance, insurance_card_number, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, email, phone || '', formattedDateOfBirth, gender,
          height, weight, blood_type, emergency_contact_name, emergency_contact_phone,
          ktp_number, address, insurance, insurance_card_number, facebook_user_id
        ]
      );

      user = {
        id: insertResult.insertId,
        name,
        email,
        phone,
        date_of_birth: formattedDateOfBirth,
        gender,
        ktp_number,
        address,
        insurance,
        insurance_card_number
      };
      isNewUser = true;
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
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
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    return NextResponse.json(
      {
        success: true,
        message: isNewUser ? "Registrasi Facebook berhasil" : "Login berhasil",
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
          isNewUser: isNewUser
        },
      },
      { status: 200 }
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
