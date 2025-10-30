import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all ICDs
export async function GET() {
  try {
    const icds = await ICD.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(icds);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengambil data ICD" },
      { status: 500 }
    );
  }
}

// POST new ICD
export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.name || !data.disease) {
      return NextResponse.json(
        { message: "Kode ICD dan nama penyakit harus diisi" },
        { status: 400 }
      );
    }

    const icd = await ICD.create({
      data: {
        name: data.name,
        disease: data.disease,
        description: data.description || null,
        status: data.status || "Aktif",
      },
    });

    return NextResponse.json(icd);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menambahkan ICD" },
      { status: 500 }
    );
  }
}
