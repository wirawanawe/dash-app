import { NextResponse } from "next/server";
import { User, Patient, Company, Doctor, Insurance, ICD, Treatment, Polyclinic, PostalCode, $transaction } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET single user
export async function GET(request, { params }) {
  try {
    const user = await User.findUnique({
      where: {
        id: parseInt(params.id),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const updateData = {
      name: data.name,
      email: data.email,
    };

    // Update password hanya jika ada password baru
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await User.update({
      where: {
        id: parseInt(params.id),
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengupdate pengguna" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    await User.delete({
      where: {
        id: parseInt(params.id),
      },
    });
    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
