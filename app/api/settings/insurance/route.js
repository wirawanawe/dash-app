import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all insurance
export async function GET() {
  try {
    const insurances = await Insurance.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(insurances);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data asuransi" },
      { status: 500 }
    );
  }
}

// POST new insurance
export async function POST(request) {
  try {
    const data = await request.json();

    if (!data || !data.name) {
      return NextResponse.json(
        { message: "Nama asuransi harus diisi" },
        { status: 400 }
      );
    }

    const insurance = await Insurance.create({
      data: {
        name: data.name.trim(),
        phone: data.phone ? data.phone.trim() : null,
        email: data.email ? data.email.trim() : null,
        address: data.address ? data.address.trim() : null,
        status: data.status || "Aktif",
      },
    });

    return NextResponse.json(insurance);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal menambahkan asuransi" },
      { status: 500 }
    );
  }
}
