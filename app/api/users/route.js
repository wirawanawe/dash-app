import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE 1=1
    `;
    
    let params = [];

    // Add search filter
    if (search) {
      sql += " AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add role filter
    if (role) {
      sql += " AND u.role = ?";
      params.push(role);
    }

    sql += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

    // Get total count using cached COUNT
    let whereClause = "WHERE 1=1";
    let countParams = [];
    
    if (search) {
      whereClause += " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereClause += " AND role = ?";
      countParams.push(role);
    }

    const total = await getCachedCount('users', whereClause, countParams, query);

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
    
    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: "Username, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [body.username, body.email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "Username atau email sudah terdaftar" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO users (username, email, password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      body.username,
      body.email,
      body.password, // Note: Should be hashed in production
      body.full_name || body.username,
      body.role || 'USER',
      body.is_active !== undefined ? body.is_active : true
    ];

    const result = await query(sql, params);
    
    // Invalidate cache after adding new user
    invalidateTableCache('users');

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil ditambahkan",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("Error creating user:", error);
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
