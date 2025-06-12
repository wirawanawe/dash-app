import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

// Helper function to verify user is admin
async function verifyAdmin(request) {
  const token = request.cookies.get("token");
  if (!token) return false;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token.value, secretKey);
    return payload.role === "ADMIN";
  } catch (error) {
    return false;
  }
}

// GET users (admin only)
export async function GET(request) {
  try {
    // Verify admin permissions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users
      WHERE 
        LOWER(name) LIKE LOWER(?) OR
        LOWER(email) LIKE LOWER(?)
    `;
    const countResult = await query(countQuery, [`%${search}%`, `%${search}%`]);
    const totalResults = parseInt(countResult[0].total);

    // Get paginated users with clinic info
    const usersQuery = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.clinic_id,
        c.name as clinic_name, c.code as clinic_code
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE 
        LOWER(u.name) LIKE LOWER(?) OR
        LOWER(u.email) LIKE LOWER(?)
      ORDER BY u.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const users = await query(usersQuery, [`%${search}%`, `%${search}%`]);

    // Format users to include clinic info
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      clinic: user.clinic_id
        ? {
            id: user.clinic_id,
            name: user.clinic_name,
            code: user.clinic_code,
          }
        : null,
    }));

    return NextResponse.json({
      data: formattedUsers,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// POST create a new user (admin only)
export async function POST(request) {
  try {
    // Verify admin permissions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, role, is_active, clinic_id } =
      await request.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role harus diisi" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await query(
      `INSERT INTO users (name, email, password, role, is_active, clinic_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, is_active || true, clinic_id || null]
    );

    return NextResponse.json(
      {
        message: "Pengguna berhasil dibuat",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal membuat pengguna" },
      { status: 500 }
    );
  }
}
