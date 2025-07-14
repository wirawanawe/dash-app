import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";

    if (!searchQuery.trim()) {
      return NextResponse.json([]);
    }

    const sql = `
      SELECT * FROM patients 
      WHERE name LIKE ? 
         OR nik LIKE ? 
         OR mr_number LIKE ? 
      LIMIT 10
    `;

    const searchPattern = `%${searchQuery}%`;
    const patients = await query(sql, [
      searchPattern,
      searchPattern,
      searchPattern,
    ]);

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error searching patients:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
