import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single ICD
export async function GET(request, { params }) {
  try {
    const icd = await ICD.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!icd) {
      return NextResponse.json(
        { message: "ICD tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(icd);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil data ICD" },
      { status: 500 }
    );
  }
}

// PUT update ICD
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const icd = await ICD.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        code: data.code,
        disease: data.disease,
        description: data.description,
        status: data.status,
      },
    });
    return NextResponse.json(icd);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengupdate ICD" },
      { status: 500 }
    );
  }
}

// DELETE ICD
export async function DELETE(request, { params }) {
  try {
    await ICD.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "ICD berhasil dihapus" });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menghapus ICD" },
      { status: 500 }
    );
  }
}
