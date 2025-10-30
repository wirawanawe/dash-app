import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET all companies
export async function GET() {
  try {
    const companies = await query("SELECT * FROM companies ORDER BY name ASC");

    return NextResponse.json(companies);
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST new company
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, address, phone, email } = body;

    const insertResult = await query(
      "INSERT INTO companies (name, address, phone, email, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, address, phone, email]
    );

    // Get the created company
    const [company] = await query("SELECT * FROM companies WHERE id = ?", [
      insertResult.insertId,
    ]);

    return NextResponse.json(company, { status: 201 });
  } catch (error) {

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
