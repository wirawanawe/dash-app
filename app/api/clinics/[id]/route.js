import { query } from "@/lib/db";
import { NextResponse } from "next/server";
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
    console.error("Error verifying token:", error);
    return null;
  }
}

// GET /api/clinics/[id] - get clinic by id
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await query("SELECT * FROM clinics WHERE id = ?", [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const clinic = result[0];

    // Get polyclinics for this clinic
    const polyclinicsQuery = `
      SELECT 
        p.id, p.name, p.code, p.description, p.status
      FROM polyclinics p
      INNER JOIN clinic_polyclinics cp ON p.id = cp.polyclinic_id
      WHERE cp.clinic_id = ? AND cp.is_active = TRUE
      ORDER BY p.name ASC
    `;
    
    const polyclinics = await query(polyclinicsQuery, [id]);
    
    const clinicWithPolyclinics = {
      ...clinic,
      polyclinics
    };

    return NextResponse.json(clinicWithPolyclinics);
  } catch (error) {
    console.error("Error getting clinic:", error);
    return NextResponse.json({ error: "Failed to get clinic" }, { status: 500 });
  }
}

// PUT /api/clinics/[id] - update clinic
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    // Get user information from token
    const userPayload = await getUserFromToken(request);

    // Allow SUPERADMIN and ADMIN roles
    if (!userPayload || (userPayload.role !== "SUPERADMIN" && userPayload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, address, city, phone, email, rating, total_reviews,
      latitude, longitude, operating_hours, description, image_url, is_active 
    } = body;

    if (!name || !address || !city) {
      return NextResponse.json(
        { error: "Name, address, and city are required" },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const clinicResult = await query("SELECT * FROM clinics WHERE id = ?", [
      id,
    ]);

    if (clinicResult.length === 0) {
      return Response.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Update clinic
    await query(
      `UPDATE clinics SET 
        name = ?, address = ?, city = ?, phone = ?, email = ?, 
        rating = ?, total_reviews = ?, latitude = ?, longitude = ?,
        operating_hours = ?, description = ?, image_url = ?, is_active = ?
        WHERE id = ?`,
      [
        name, address, city, phone, email, rating, total_reviews,
        latitude, longitude, operating_hours ? JSON.stringify(operating_hours) : null,
        description, image_url, is_active, id
      ]
    );

    return NextResponse.json({ message: "Clinic updated successfully" });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}

// DELETE /api/clinics/[id] - delete clinic
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Get user information from token
    const userPayload = await getUserFromToken(request);

    // Allow SUPERADMIN and ADMIN roles
    if (!userPayload || (userPayload.role !== "SUPERADMIN" && userPayload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if clinic exists
    const clinicResult = await query("SELECT * FROM clinics WHERE id = ?", [
      id,
    ]);

    if (clinicResult.length === 0) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Delete clinic
    await query("DELETE FROM clinics WHERE id = ?", [id]);

    return NextResponse.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    return NextResponse.json({ error: "Failed to delete clinic" }, { status: 500 });
  }
}
