import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";

// GET single doctor
export async function GET(request, { params }) {
  try {
    const doctor = await Doctor.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        polyclinic: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Dokter tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data dokter" },
      { status: 500 }
    );
  }
}

// PUT update doctor
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const doctor = await Doctor.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        nip: data.nip,
        name: data.name,
        speciality: data.speciality,
        phone: data.phone,
        email: data.email,
        polyclinicId: parseInt(data.polyclinicId),
        status: data.status,
      },
      include: {
        polyclinic: true,
      },
    });
    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate dokter" },
      { status: 500 }
    );
  }
}

// DELETE doctor
export async function DELETE(request, { params }) {
  try {
    await Doctor.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "Dokter berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Gagal menghapus dokter" },
      { status: 500 }
    );
  }
}
