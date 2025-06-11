import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET all companies
export async function GET() {
  try {
    const companies = await Company.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data perusahaan" },
      { status: 500 }
    );
  }
}

// POST new company
export async function POST(request) {
  try {
    const data = await request.json();
    const company = await Company.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        status: data.status,
      },
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan perusahaan" },
      { status: 500 }
    );
  }
}
