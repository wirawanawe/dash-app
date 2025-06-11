import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single treatment
export async function GET(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const treatment = await Treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      return NextResponse.json(
        { message: "Tindakan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data tindakan" },
      { status: 500 }
    );
  }
}

// PUT update treatment
export async function PUT(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const data = await req.json();
    const treatment = await Treatment.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        status: data.status,
      },
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate tindakan" },
      { status: 500 }
    );
  }
}

// DELETE treatment
export async function DELETE(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    await Treatment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tindakan berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus tindakan" },
      { status: 500 }
    );
  }
}
