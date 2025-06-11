import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

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
    console.error("Error fetching treatments:", error);
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
        code: data.code,
        name: data.name,
        description: data.description,
        price: data.price,
        status: data.status,
      },
    });
    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error creating treatment:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan tindakan" },
      { status: 500 }
    );
  }
}
