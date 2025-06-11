import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single polyclinic
export async function GET(request, { params }) {
  try {
    const polyclinic = await Polyclinic.findFirst({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!polyclinic) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(polyclinic);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

// PUT update polyclinic
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const polyclinic = await Polyclinic.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
      },
    });
    return NextResponse.json(polyclinic);
  } catch (error) {
    return NextResponse.json(null, { status: 500 });
  }
}

// DELETE polyclinic (soft delete)
export async function DELETE(request, { params }) {
  try {
    await Polyclinic.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
