import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single treatment
export async function GET(request, { params }) {
  try {
    const treatment = await Treatment.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: "Tindakan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error fetching treatment:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tindakan" },
      { status: 500 }
    );
  }
}

// PUT update treatment
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const treatment = await Treatment.update({
      where: {
        id: parseInt(params.id),
      },
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
    console.error("Error updating treatment:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate tindakan" },
      { status: 500 }
    );
  }
}

// DELETE treatment
export async function DELETE(request, { params }) {
  try {
    await Treatment.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "Tindakan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return NextResponse.json(
      { error: "Gagal menghapus tindakan" },
      { status: 500 }
    );
  }
}
