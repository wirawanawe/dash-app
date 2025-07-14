import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single patient
export async function GET(request, { params }) {
  try {
    const [patient] = await query("SELECT * FROM patients WHERE id = ?", [
      parseInt(params.id),
    ]);

    if (!patient) {
      return NextResponse.json(
        { error: "Pasien tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get insurance data if exists
    const [insurance] = await query(
      "SELECT * FROM insurance WHERE patient_id = ?",
      [parseInt(params.id)]
    );

    return NextResponse.json({
      ...patient,
      insurance: insurance || null,
    });
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
    const updateSql = `
      UPDATE patients SET 
        name = ?, nik = ?, birth_date = ?, gender = ?, address = ?, 
        phone = ?, email = ?, province_id = ?, province_name = ?, 
        city_id = ?, city_name = ?, district_id = ?, district_name = ?, 
        village_id = ?, village_name = ?, postal_code = ?, company_id = ?, 
        updated_at = NOW()
      WHERE id = ?
    `;

    const updateParams = [
      data.name.trim(),
      data.nik.trim(),
      data.birthDate,
      data.gender,
      data.address?.trim(),
      data.phone?.trim(),
      data.email?.trim(),
      data.provinceId,
      data.provinceName,
      data.cityId,
      data.cityName,
      data.districtId,
      data.districtName,
      data.villageId,
      data.villageName,
      data.postalCode,
      data.companyId ? parseInt(data.companyId) : null,
      parseInt(params.id),
    ];

    await query(updateSql, updateParams);

    // Handle insurance separately
    if (data.insurance) {
      // Check if insurance exists
      const [existingInsurance] = await query(
        "SELECT id FROM insurance WHERE patient_id = ?",
        [parseInt(params.id)]
      );

      if (existingInsurance) {
        // Update existing insurance
        await query(
          `UPDATE insurance SET 
           provider = ?, number = ?, type = ?, status = ?, updated_at = NOW()
           WHERE patient_id = ?`,
          [
            data.insurance.provider,
            data.insurance.number,
            data.insurance.type,
            data.insurance.status || "Aktif",
            parseInt(params.id),
          ]
        );
      } else {
        // Create new insurance
        await query(
          `INSERT INTO insurance (patient_id, provider, number, type, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            parseInt(params.id),
            data.insurance.provider,
            data.insurance.number,
            data.insurance.type,
            data.insurance.status || "Aktif",
          ]
        );
      }
    }

    // Get updated patient
    const [updatedPatient] = await query(
      "SELECT * FROM patients WHERE id = ?",
      [parseInt(params.id)]
    );

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
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
    const patientId = parseInt(params.id);

    // Delete insurance records first (foreign key constraint)
    await query("DELETE FROM insurance WHERE patient_id = ?", [patientId]);

    // Delete the patient
    await query("DELETE FROM patients WHERE id = ?", [patientId]);

    return NextResponse.json({ message: "Pasien berhasil dihapus" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pasien" },
      { status: 500 }
    );
  }
}
