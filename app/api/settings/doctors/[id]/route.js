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
    // console.log("Received data:", data); // Log untuk debugging

    const doctor = await Doctor.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        nip: data.nip?.trim(),
        nik: data.nik?.trim() || null,
        name: data.name?.trim(),
        speciality: data.speciality?.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        polyclinicId: data.polyclinicId ? parseInt(data.polyclinicId) : null,
        status: data.status,
      },
      include: {
        polyclinic: true,
      },
    });

    // console.log("Updated doctor:", doctor); // Log untuk debugging
    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Detailed error:", error); // Log error lengkap
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
