import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

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
    console.error("Error fetching insurances:", error);
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
    const insurance = await Insurance.create({
      data: {
        code: data.code,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        status: data.status,
      },
    });
    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error creating insurance:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan asuransi" },
      { status: 500 }
    );
  }
}
