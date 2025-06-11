import { Company } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET single company
export async function GET(request, { params }) {
  try {
    const company = await Company.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT update company
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { name, address, phone, email } = body;

    const company = await Company.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        address,
        phone,
        email,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE company
export async function DELETE(request, { params }) {
  try {
    await Company.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
