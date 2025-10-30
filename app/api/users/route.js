import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

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

// Function to get user from token
async function getUserFromToken(request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET all users with role-based filtering
export async function GET(request) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);

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

    // Add clinic filtering based on current user's clinic_id
    // If user has clinic_id, they can only see users from the same clinic
    // If user has no clinic_id (null), they can see all users
    if (userPayload && userPayload.clinic_id) {
      whereConditions.push('u.clinic_id = ?');
      params.push(userPayload.clinic_id);
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
      [name, email, hashedPassword, role.toLowerCase(), clinic_id || null, is_active !== undefined ? is_active : true]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      role: role.toLowerCase(),
      clinic_id,
      is_active: is_active !== undefined ? is_active : true,
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {

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
