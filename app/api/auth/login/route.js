import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: JWT_SECRET missing",
        },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email dan password harus diisi",
        },
        { status: 400 }
      );
    }

    // Helper function for cookie options
    const getCookieOptions = () => {
      const isProduction = process.env.NODE_ENV === "production";

      // Check if running on HTTPS - be more strict about HTTPS detection
      const protocol =
        request.headers.get("x-forwarded-proto") ||
        request.headers.get("x-forwarded-protocol") ||
        (request.url?.startsWith("https://") ? "https" : "http");

      // Only set secure flag if actually using HTTPS
      const isHttps = protocol === "https";

      return {
        httpOnly: true,
        secure: isHttps, // Only secure when actually using HTTPS
        sameSite: isProduction ? "strict" : "lax", // Use 'lax' for development
        maxAge: 86400, // 1 day
        path: "/",
      };
    };

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
        SELECT u.id, u.name, u.email, u.password, u.role, u.is_active
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

      // Set clinic info to null since clinic_id column doesn't exist
      user.clinic_id = null;
      user.clinic_name = null;
      user.clinic_code = null;

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

      // Create a JWT token
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        clinic_id: null, // No clinic_id in current schema
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
        clinic_id: null,
        clinic: null,
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

      // Fallback to hardcoded admin if database error and admin credentials
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
          clinic_id: null,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("1d")
          .sign(new TextEncoder().encode(process.env.JWT_SECRET));

        const response = NextResponse.json(
          {
            success: true,
            message: "Login berhasil (fallback mode)",
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
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
