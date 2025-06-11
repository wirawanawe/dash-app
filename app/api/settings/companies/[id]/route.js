import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single company
export async function GET(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const company = await Company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { message: "Perusahaan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data perusahaan" },
      { status: 500 }
    );
  }
}

// PUT update company
export async function PUT(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const data = await req.json();
    const company = await Company.update({
      where: { id },
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
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate perusahaan" },
      { status: 500 }
    );
  }
}

// DELETE company
export async function DELETE(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    await Company.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Perusahaan berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus perusahaan" },
      { status: 500 }
    );
  }
}
