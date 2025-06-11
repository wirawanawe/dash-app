import { NextResponse } from "next/server";
import { Patient, Insurance, $transaction } from "@/lib/prisma";

// GET single patient
export async function GET(request, { params }) {
  try {
    const patient = await Patient.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Pasien tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get insurance data separately for now
    // TODO: Implement JOIN query if needed
    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pasien" },
      { status: 500 }
    );
  }
}

// PUT/UPDATE patient
export async function PUT(request, { params }) {
  try {
    const data = await request.json();

    // Validasi data
    if (!data.name || !data.nik || !data.birthDate) {
      return NextResponse.json(
        { error: "Nama, NIK, dan Tanggal Lahir wajib diisi" },
        { status: 400 }
      );
    }

    // Update patient
    const patient = await Patient.update({
      where: { id: parseInt(params.id) },
      data: {
        name: data.name.trim(),
        nik: data.nik.trim(),
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        address: data.address?.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        provinceId: data.provinceId,
        provinceName: data.provinceName,
        cityId: data.cityId,
        cityName: data.cityName,
        districtId: data.districtId,
        districtName: data.districtName,
        villageId: data.villageId,
        villageName: data.villageName,
        postalCode: data.postalCode,
        companyId: data.companyId ? parseInt(data.companyId) : null,
      },
    });

    // Handle insurance separately
    if (data.insurance) {
      // Try to update existing insurance first
      const existingInsurance = await Insurance.findUnique({
        where: { patientId: parseInt(params.id) },
      });

      if (existingInsurance) {
        await Insurance.update({
          where: { id: existingInsurance.id },
          data: {
            provider: data.insurance.provider,
            number: data.insurance.number,
            type: data.insurance.type,
            status: data.insurance.status || "Aktif",
          },
        });
      } else {
        await Insurance.create({
          data: {
            patientId: parseInt(params.id),
            provider: data.insurance.provider,
            number: data.insurance.number,
            type: data.insurance.type,
            status: data.insurance.status || "Aktif",
          },
        });
      }
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error:", error);
    if (error.code === "P2002" || error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "NIK sudah terdaftar" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal mengupdate pasien" },
      { status: 500 }
    );
  }
}

// DELETE patient
export async function DELETE(request, { params }) {
  try {
    await $transaction([
      // Delete related insurance records first
      () =>
        Insurance.deleteMany({
          where: { patientId: parseInt(params.id) },
        }),
      // Then delete the patient
      () =>
        Patient.delete({
          where: { id: parseInt(params.id) },
        }),
    ]);

    return NextResponse.json({ message: "Pasien berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pasien" },
      { status: 500 }
    );
  }
}
