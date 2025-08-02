import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// Role hierarchy: Superadmin > Admin > Doctor > Staff
const roleHierarchy = {
  SUPERADMIN: 4,
  ADMIN: 3,
  DOCTOR: 2,
  STAFF: 1
};

const getUserRoleLevel = (role) => {
  return roleHierarchy[role?.toUpperCase()] || 0;
};

const canManageRole = (userRole, targetRole) => {
  const userLevel = getUserRoleLevel(userRole);
  const targetLevel = getUserRoleLevel(targetRole);
  return userLevel > targetLevel; // Can only manage roles below their own level
};

// GET all users with role-based filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Ensure page and limit are valid integers
    let page = parseInt(searchParams.get('page'), 10);
    let limit = parseInt(searchParams.get('limit'), 10);
    
    // Fallback to defaults if parsing fails
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }
    
    const role = searchParams.get('role') || '';

    // Build WHERE clause and parameters
    let whereConditions = [];
    const params = [];
    
    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const [countResult] = await query(countQuery, params);
    const total = countResult.total;

    // Get paginated users - ensure offset is a valid integer
    const offset = (page - 1) * limit;
    const usersQuery = `
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
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Use raw query without parameters for LIMIT/OFFSET
    const users = await query(usersQuery, params);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request) {
  try {
    const { name, email, password, role, clinic_id, is_active } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role wajib diisi" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = Object.keys(roleHierarchy);
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: "Role tidak valid" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingUser] = await query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await query(
      `INSERT INTO users (name, email, password, role, clinic_id, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hashedPassword, role.toUpperCase(), clinic_id || null, is_active !== undefined ? is_active : true]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      role: role.toUpperCase(),
      clinic_id,
      is_active: is_active !== undefined ? is_active : true,
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal membuat pengguna" },
      { status: 500 }
    );
  }
}
