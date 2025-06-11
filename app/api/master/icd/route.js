import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET all ICDs
export async function GET() {
  try {
    const icds = await ICD.findMany({
      orderBy: {
        code: "asc",
      },
    });
    return NextResponse.json(icds);
  } catch (error) {
    console.error("Error fetching ICDs:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ICD" },
      { status: 500 }
    );
  }
}

// POST new ICD
export async function POST(request) {
  try {
    const data = await request.json();
    const icd = await ICD.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
      },
    });
    return NextResponse.json(icd);
  } catch (error) {
    console.error("Error creating ICD:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan ICD" },
      { status: 500 }
    );
  }
}
