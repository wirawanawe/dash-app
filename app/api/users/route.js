import { NextResponse } from "next/server";
import { query, rawQuery } from "@/lib/db";
import { getCachedCount, invalidateTableCache } from "@/lib/cache";

export const dynamic = 'force-dynamic';


// GET all users with search and pagination
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    let limit = parseInt(searchParams.get("limit"), 10);
    
    // Set default limit to 50 if not specified or invalid
    if (!limit || limit < 1) {
      limit = 50; // Increased from 10 to 50
    }
    
    // Cap limit at 200 to prevent excessive data transfer
    if (limit > 200) {
      limit = 200;
    }

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.clinic_id,
        u.is_active,
        u.created_at,
        u.updated_at,
        c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE 1=1
    `;
    
    let params = [];

    // Add search filter
    if (search) {
      sql += " AND (u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add role filter
    if (role) {
      sql += " AND u.role = ?";
      params.push(role);
    }

    sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const users = await rawQuery(sql);

    // Get total count using cached COUNT
    let whereClause = "WHERE 1=1";
    let countParams = [];
    
    if (search) {
      whereClause += " AND (name LIKE ? OR email LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereClause += " AND role = ?";
      countParams.push(role);
    }

    const total = await getCachedCount('users', whereClause, countParams, rawQuery);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil data pengguna",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Add detailed logging for debugging
    console.log("🔍 POST /api/users - Request body:", JSON.stringify(body, null, 2));
    
    // Validate required fields - check for both null/undefined and empty strings
    if (!body.name || !body.email || !body.password || 
        body.name.trim() === '' || body.email.trim() === '' || body.password.trim() === '') {
      console.log("❌ Validation failed - Missing required fields:", {
        hasName: !!(body.name && body.name.trim()),
        hasEmail: !!(body.email && body.email.trim()),
        hasPassword: !!(body.password && body.password.trim())
      });
      return NextResponse.json(
        { success: false, message: "Nama, email, dan password wajib diisi dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      console.log("❌ Validation failed - Invalid email format:", body.email);
      return NextResponse.json(
        { success: false, message: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.trim().length < 6) {
      console.log("❌ Validation failed - Password too short:", body.password.length);
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if name or email already exists
    const existingUser = await query(
      `SELECT id FROM users WHERE name = ? OR email = ?`,
      [body.name.trim(), body.email.trim()]
    );

    if (existingUser.length > 0) {
      console.log("❌ Validation failed - User already exists:", {
        existingUsers: existingUser.length,
        name: body.name.trim(),
        email: body.email.trim()
      });
      return NextResponse.json(
        { success: false, message: "Nama atau email sudah terdaftar" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed - Creating new user");

    // Hash password before storing
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(body.password.trim(), 10);

    const sql = `
      INSERT INTO users (name, email, password, role, clinic_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      body.name.trim(),
      body.email.trim(),
      hashedPassword,
      body.role ? body.role.toLowerCase() : 'staff',
      body.clinic_id || null,
      body.is_active !== undefined ? body.is_active : true
    ]);
    
    // Invalidate cache after adding new user
    invalidateTableCache('users');

    console.log("✅ User created successfully with ID:", result.insertId);

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil ditambahkan",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menambahkan pengguna",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
