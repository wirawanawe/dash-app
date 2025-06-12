import { NextResponse } from "next/server";
import {
  User,
  Patient,
  Company,
  Doctor,
  Insurance,
  ICD,
  Treatment,
  Polyclinic,
  PostalCode,
  $transaction,
} from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all users
export async function GET() {
  try {
    const users = await User.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
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

    const user = await User.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menambahkan pengguna" },
      { status: 500 }
    );
  }
}
