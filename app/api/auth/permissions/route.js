import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// GET current user permissions
export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "your-secret-key");
    const userId = decoded.id;

    // Get user permissions
    const permissions = await query(
      `SELECT menu_key, has_access 
       FROM user_permissions 
       WHERE user_id = ?`,
      [userId]
    );

    // Convert to object format { menu_key: true/false }
    const permissionsObj = {};
    permissions.forEach(perm => {
      permissionsObj[perm.menu_key] = Boolean(perm.has_access);
    });

    return NextResponse.json(permissionsObj);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data permission" },
      { status: 500 }
    );
  }
}

