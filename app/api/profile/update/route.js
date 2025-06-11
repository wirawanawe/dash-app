import { User } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token diperlukan" }, { status: 401 });
    }

    const decoded = await verifyJwtToken(token);
    const user = await User.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    // Validasi password lama jika ingin mengubah password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Password lama diperlukan untuk mengubah password" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Password lama tidak valid" },
          { status: 400 }
        );
      }
    }

    // Hash password baru jika ada
    const hashedPassword = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : undefined;

    const updatedUser = await User.update({
      where: { id: decoded.userId },
      data: {
        name: name || user.name,
        email: email || user.email,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    // Hapus password dari response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
