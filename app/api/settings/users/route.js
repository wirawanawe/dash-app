import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET all users
export async function GET() {
  try {
    const users = await query(
      "SELECT id, name, email FROM users ORDER BY name ASC"
    );
    return NextResponse.json(users);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// POST new user
export async function POST(request) {
  try {
    const data = await request.json();

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const insertResult = await query(
      "INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [data.name, data.email, hashedPassword]
    );

    // Get the created user (without password)
    const [newUser] = await query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [insertResult.insertId]
    );

    return NextResponse.json(newUser);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menambahkan pengguna" },
      { status: 500 }
    );
  }
}
