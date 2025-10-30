import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";

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

// GET user permissions
export async function GET(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);
    
    const { id } = params;

    // Check if target user is superadmin
    const [targetUser] = await query(
      "SELECT role FROM users WHERE id = ?",
      [id]
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Only superadmin can view superadmin permissions
    if (targetUser.role?.toUpperCase() === 'SUPERADMIN') {
      if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: "Hanya Superadmin yang dapat melihat permission Superadmin" },
          { status: 403 }
        );
      }
    }

    // Get user permissions
    const permissions = await query(
      `SELECT menu_key, has_access 
       FROM user_permissions 
       WHERE user_id = ?`,
      [id]
    );

    // Convert to object format { menu_key: true/false }
    const permissionsObj = {};
    permissions.forEach(perm => {
      permissionsObj[perm.menu_key] = Boolean(perm.has_access);
    });

    return NextResponse.json(permissionsObj);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data permission" },
      { status: 500 }
    );
  }
}

// PUT update user permissions
export async function PUT(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);
    
    const { id } = params;
    const permissions = await request.json();

    // Check if target user is superadmin
    const [targetUser] = await query(
      "SELECT role FROM users WHERE id = ?",
      [id]
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Only superadmin can update superadmin permissions
    if (targetUser.role?.toUpperCase() === 'SUPERADMIN') {
      if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: "Hanya Superadmin yang dapat mengubah permission Superadmin" },
          { status: 403 }
        );
      }
    }

    // Delete existing permissions for this user
    await query(
      `DELETE FROM user_permissions WHERE user_id = ?`,
      [id]
    );

    // Insert new permissions
    if (permissions && Object.keys(permissions).length > 0) {
      const values = Object.entries(permissions).map(([menu_key, has_access]) => {
        return [id, menu_key, has_access ? 1 : 0];
      });

      if (values.length > 0) {
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();
        
        await query(
          `INSERT INTO user_permissions (user_id, menu_key, has_access) 
           VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Permission berhasil diperbarui" 
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal memperbarui permission" },
      { status: 500 }
    );
  }
}

