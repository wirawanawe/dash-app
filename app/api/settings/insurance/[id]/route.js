import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single insurance
export async function GET(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const insurance = await Insurance.findUnique({
      where: { id },
    });

    if (!insurance) {
      return NextResponse.json(
        { message: "Asuransi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data asuransi" },
      { status: 500 }
    );
  }
}

// PUT update insurance
export async function PUT(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const data = await req.json();
    const insurance = await Insurance.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: data.status,
      },
    });

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal mengupdate asuransi" },
      { status: 500 }
    );
  }
}

// DELETE insurance
export async function DELETE(req) {
  try {
    const id = parseInt(req.url.split("/").pop());
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    await Insurance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Asuransi berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus asuransi" },
      { status: 500 }
    );
  }
}
