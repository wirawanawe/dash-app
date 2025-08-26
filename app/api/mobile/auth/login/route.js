import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email dan password harus diisi",
        },
        { status: 400 }
      );
    }

    // Hardcoded test user for mobile app testing (fallback)
    if (email === "test@mobile.com" && password === "password123") {
      // Try to get the user from database first with health data
      try {
        const [user] = await query(
          `SELECT mu.id, mu.name, mu.email, mu.phone, mu.date_of_birth, mu.gender, 
                  mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
                  MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
                  MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
           FROM mobile_users mu
           LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
           WHERE mu.email = ?
           GROUP BY mu.id`,
          [email]
        );
        
        if (user) {
          // Create a JWT token with database user ID
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
            .setExpirationTime("7d") // Longer expiration for mobile
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
              message: "Login berhasil",
              data: {
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  date_of_birth: user.date_of_birth,
                  gender: user.gender,
                  height: user.height,
                  weight: user.weight,
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
        }
      } catch (dbError) {
        console.error("Database error during test user login:", dbError);
      }
    }

    // Try database authentication for mobile users
    try {
      // Cari user di database mobile_users with health data
      let sql = `
        SELECT mu.id, mu.name, mu.email, mu.password, mu.phone, mu.date_of_birth, mu.gender, 
               mu.is_active, mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
               MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
               MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
        FROM mobile_users mu
        LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
        WHERE mu.email = ?
        GROUP BY mu.id
      `;
      let [user] = await query(sql, [email]);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Email tidak terdaftar. Silakan daftar terlebih dahulu.",
            errorType: "user_not_found"
          },
          { status: 401 }
        );
      }

      // Cek apakah user aktif
      if (!user.is_active) {
        return NextResponse.json(
          {
            success: false,
            message: "Akun Anda telah dinonaktifkan. Hubungi admin untuk bantuan.",
            errorType: "account_deactivated"
          },
          { status: 403 }
        );
      }

      // Verifikasi password menggunakan bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Password salah. Silakan periksa kembali password Anda.",
            errorType: "invalid_password"
          },
          { status: 401 }
        );
      }

      // Create a JWT token
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
        .setExpirationTime("7d") // Longer expiration for mobile
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

      // Format response user
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        ktp_number: user.ktp_number,
        address: user.address,
        insurance: user.insurance,
        insurance_card_number: user.insurance_card_number,
        role: "MOBILE_USER",
      };

      return NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          data: {
            user: userData,
            accessToken: token,
            refreshToken: refreshToken,
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error during mobile login:", dbError);

      return NextResponse.json(
        {
          success: false,
          message: "Database error: " + (dbError.message || "Unknown error"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
} 