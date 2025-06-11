import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single insurance
export async function GET(request, { params }) {
  try {
    const insurance = await Insurance.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!insurance) {
      return NextResponse.json(
        { error: "Asuransi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error fetching insurance:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data asuransi" },
      { status: 500 }
    );
  }
}

// PUT update insurance
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const insurance = await Insurance.update({
      where: {
        id: parseInt(params.id),
      },
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
    console.error("Error updating insurance:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate asuransi" },
      { status: 500 }
    );
  }
}

// DELETE insurance
export async function DELETE(request, { params }) {
  try {
    await Insurance.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "Asuransi berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting insurance:", error);
    return NextResponse.json(
      { error: "Gagal menghapus asuransi" },
      { status: 500 }
    );
  }
}
