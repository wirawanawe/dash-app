import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // console.log("JWT_SECRET in login API:", !!process.env.JWT_SECRET);

    if (!process.env.JWT_SECRET) {
      // console.error("JWT_SECRET is not defined in environment variables");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: JWT_SECRET missing",
        },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();
    // console.log("Login attempt for email:", email);

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

    // Admin fallback untuk testing saat database belum siap
    if (email === "admin@phc.com" && password === "admin123") {
      // console.log("Admin login detected");

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

      // console.log("Admin token generated successfully");

      const response = NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          user: adminUser,
        },
        { status: 200 }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 86400, // 1 day
        path: "/",
        domain: process.env.NODE_ENV === "production" ? undefined : undefined,
      };

      response.cookies.set("token", token, cookieOptions);
      response.cookies.set(
        "lastActivity",
        Date.now().toString(),
        cookieOptions
      );

      return response;
    }

    try {
      // Cari user di database dengan informasi klinik
      // Pertama coba tanpa JOIN untuk mengecek apakah tabel users ada
      let sql = `
        SELECT u.id, u.name, u.email, u.password, u.role, u.is_active, u.clinic_id
        FROM users u 
        WHERE u.email = ?
      `;
      let [user] = await query(sql, [email]);

      // Jika user ditemukan, coba ambil data klinik jika tabel polyclinics ada
      if (user) {
        try {
          const clinicSql = `
            SELECT c.name as clinic_name, c.code as clinic_code 
            FROM polyclinics c 
            WHERE c.id = ?
          `;
          const [clinic] = await query(clinicSql, [user.clinic_id]);
          if (clinic) {
            user.clinic_name = clinic.clinic_name;
            user.clinic_code = clinic.clinic_code;
          }
        } catch (clinicError) {
          // Tabel polyclinics tidak ada, lanjutkan tanpa data klinik
          console.log(
            "Polyclinics table not found, continuing without clinic data"
          );
          user.clinic_name = null;
          user.clinic_code = null;
        }
      }

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

      // Create a JWT token
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        clinic_id: user.clinic_id, // Include clinic_id in the token
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
        clinic:
          user.clinic_id && user.clinic_name
            ? {
                id: user.clinic_id,
                name: user.clinic_name,
                code: user.clinic_code,
              }
            : null,
      };

      const response = NextResponse.json(
        {
          success: true,
          message: "Login berhasil",
          user: userData,
        },
        { status: 200 }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400, // 1 day
        path: "/",
      };

      response.cookies.set("token", token, cookieOptions);
      response.cookies.set(
        "lastActivity",
        Date.now().toString(),
        cookieOptions
      );

      return response;
    } catch (dbError) {
      console.error("Database error during login:", dbError);

      // Fallback to hardcoded admin if database error
      if (email === "admin@phc.com" && password === "admin123") {
        console.log("Fallback to admin login after database error");

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

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          maxAge: 86400, // 1 day
          path: "/",
          domain: process.env.NODE_ENV === "production" ? undefined : undefined,
        };

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
