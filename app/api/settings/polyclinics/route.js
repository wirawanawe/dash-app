import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET all polyclinics
export async function GET() {
  try {
    const polyclinics = await Polyclinic.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        doctors: true,
      },
    });
    return NextResponse.json(polyclinics);
  } catch (error) {
    console.error("Error fetching polyclinics:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// POST new polyclinic
export async function POST(request) {
  try {
    const data = await request.json();
    const polyclinic = await Polyclinic.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || "Aktif",
      },
    });
    return NextResponse.json(polyclinic);
  } catch (error) {
    console.error("Error creating polyclinic:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan poli" },
      { status: 500 }
    );
  }
}
