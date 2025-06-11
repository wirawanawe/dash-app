import { Company } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all companies
export async function GET() {
  try {
    const companies = await Company.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST new company
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, address, phone, email } = body;

    const company = await Company.create({
      data: {
        name,
        address,
        phone,
        email,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
