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

    // Superadmin fallback untuk testing
    if (email === "superadmin@phc.com" && password === "superadmin123") {
      const superadminUser = {
        id: "superadmin-001",
        name: "Super Administrator",
        email: "superadmin@phc.com",
        role: "SUPERADMIN",
        clinic_id: null,
        clinic: null,
      };

      // Create a JWT token
      const token = await new SignJWT({
        userId: superadminUser.id,
        id: superadminUser.id,
        name: superadminUser.name,
        email: superadminUser.email,
        role: superadminUser.role,
        clinic_id: null, // Superadmin can see all clinics
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      const response = NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          user: superadminUser,
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

    // Admin fallback untuk testing saat database belum siap
    if (email === "admin@phc.com" && password === "admin123") {
      const adminUser = {
        id: "admin-001",
        name: "Administrator",
        email: "admin@phc.com",
        role: "ADMIN",
        clinic_id: null,
        clinic: null,
      };

      // Create a JWT token
      const token = await new SignJWT({
        userId: adminUser.id,
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        clinic_id: null, // Admin can see all clinics
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      const response = NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          user: adminUser,
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

      // Create a JWT token
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
        .setExpirationTime("1d")
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
      console.error("Database error during login:", dbError);

      return NextResponse.json(
        {
          success: false,
          message: "Database error: " + (dbError.message || "Unknown error"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
