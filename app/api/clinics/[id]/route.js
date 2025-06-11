import { query } from "@/lib/db";
import { verifyJwtToken } from "@/lib/auth";

// GET /api/clinics/[id] - get clinic by id
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await query("SELECT * FROM clinics WHERE id = ?", [id]);

    if (result.length === 0) {
      return Response.json({ error: "Clinic not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error getting clinic:", error);
    return Response.json({ error: "Failed to get clinic" }, { status: 500 });
  }
}

// PUT /api/clinics/[id] - update clinic
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    // Verify admin authorization
    const token = request.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyJwtToken(token);

    if (payload?.role !== "ADMIN" && payload?.role !== "admin") {
      return Response.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return Response.json(
        { error: "Name and code are required" },
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

    // Check if code is already used by another clinic
    const existingClinic = await query(
      "SELECT * FROM clinics WHERE code = ? AND id != ?",
      [code, id]
    );

    if (existingClinic.length > 0) {
      return Response.json(
        { error: "Clinic with this code already exists" },
        { status: 409 }
      );
    }

    // Update clinic
    await query(
      "UPDATE clinics SET name = ?, code = ?, description = ? WHERE id = ?",
      [name, code, description || "", id]
    );

    return Response.json({ message: "Clinic updated successfully" });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return Response.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}

// DELETE /api/clinics/[id] - delete clinic
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Verify admin authorization
    const token = request.headers.get("authorization")?.split(" ")[1];
    const payload = await verifyJwtToken(token);

    if (payload?.role !== "ADMIN" && payload?.role !== "admin") {
      return Response.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Check if clinic exists
    const clinicResult = await query("SELECT * FROM clinics WHERE id = ?", [
      id,
    ]);

    if (clinicResult.length === 0) {
      return Response.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Delete clinic
    await query("DELETE FROM clinics WHERE id = ?", [id]);

    return Response.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    return Response.json({ error: "Failed to delete clinic" }, { status: 500 });
  }
}
