import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import { getCookieOptions } from "@/lib/auth";

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

    // SECURITY: Hardcoded credentials removed
    // Use environment variables for test credentials if needed in development only
    // For production, create users via database or CLI script
    if (process.env.NODE_ENV === "development" && process.env.ALLOW_TEST_LOGIN === "true") {
      // Only allow in development with explicit env flag
      const testCredentials = {
        "superadmin@phc.com": { password: process.env.TEST_SUPERADMIN_PASSWORD, role: "SUPERADMIN", id: "superadmin-001", name: "Super Administrator" },
        "admin@phc.com": { password: process.env.TEST_ADMIN_PASSWORD, role: "ADMIN", id: "admin-001", name: "Administrator" }
      };
      
      const testUser = testCredentials[email];
      if (testUser && password === testUser.password) {
        const user = {
          id: testUser.id,
          name: testUser.name,
          email: email,
          role: testUser.role,
          clinic_id: null,
          clinic: null,
        };

        const token = await new SignJWT({
          userId: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinic_id: null,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("1h")
          .sign(new TextEncoder().encode(process.env.JWT_SECRET));

        const response = NextResponse.json(
          {
            success: true,
            message: "Login berhasil",
            user: user,
          },
          { status: 200 }
        );

        const cookieOptions = getCookieOptions();
        response.cookies.set("token", token, cookieOptions);
        response.cookies.set(
          "lastActivity",
          Date.now().toString(),
          cookieOptions
        );

        return response;
      }
    }

    // Try database authentication
    try {
      // Cari user di database
      let sql = `
        SELECT u.id, u.name, u.email, u.password, u.role, u.is_active, u.clinic_id
        FROM users u 
        WHERE u.email = ?
      `;
      let [user] = await query(sql, [email]);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Email atau password salah",
          },
          { status: 401 }
        );
      }

      // Cek apakah user aktif
      if (!user.is_active) {
        return NextResponse.json(
          {
            success: false,
            message: "Akun anda tidak aktif. Silahkan hubungi administrator.",
          },
          { status: 401 }
        );
      }

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Email atau password salah",
          },
          { status: 401 }
        );
      }

      // Get clinic info if user has clinic_id
      let clinicInfo = null;
      if (user.clinic_id) {
        const clinicSql = "SELECT id, name, address, city FROM clinics WHERE id = ?";
        const [clinic] = await query(clinicSql, [user.clinic_id]);
        if (clinic) {
          clinicInfo = clinic;
        }
      }

      // Create a JWT token (1 hour expiry)
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        clinic_id: user.clinic_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Format response user
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        clinic_id: user.clinic_id,
        clinic: clinicInfo,
      };

      const response = NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          user: userData,
        },
        { status: 200 }
      );

      const cookieOptions = getCookieOptions();

      response.cookies.set("token", token, cookieOptions);
      response.cookies.set(
        "lastActivity",
        Date.now().toString(),
        cookieOptions
      );

      return response;
    } catch (dbError) {

      return NextResponse.json(
        {
          success: false,
          message: "Database error: " + (dbError.message || "Unknown error"),
        },
        { status: 500 }
      );
    }
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
