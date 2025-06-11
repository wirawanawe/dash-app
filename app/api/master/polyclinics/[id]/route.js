import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single polyclinic
export async function GET(request, { params }) {
  try {
    const polyclinic = await Polyclinic.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        doctors: true,
      },
    });

    if (!polyclinic) {
      return NextResponse.json(
        { error: "Poli tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(polyclinic);
  } catch (error) {
    console.error("Error fetching polyclinic:", error);
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
        code: data.code,
        name: data.name,
        description: data.description,
        status: data.status,
      },
    });
    return NextResponse.json(polyclinic);
  } catch (error) {
    console.error("Error updating polyclinic:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate poli" },
      { status: 500 }
    );
  }
}

// DELETE polyclinic
export async function DELETE(request, { params }) {
  try {
    await Polyclinic.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "Poli berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting polyclinic:", error);
    return NextResponse.json(
      { error: "Gagal menghapus poli" },
      { status: 500 }
    );
  }
}
