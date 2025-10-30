import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all treatments
export async function GET() {
  try {
    const treatments = await Treatment.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(treatments);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data tindakan" },
      { status: 500 }
    );
  }
}

// POST new treatment
export async function POST(request) {
  try {
    const data = await request.json();
    const treatment = await Treatment.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        status: data.status,
      },
    });
    return NextResponse.json(treatment);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal menambahkan tindakan" },
      { status: 500 }
    );
  }
}
