import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single patient
export async function GET(request, { params }) {
  try {
    const patientId = params.id;
    
    // Support both INT and UUID/VARCHAR for patient ID
    // Also check external_id since frontend uses external_id as patient ID
    const patientQuery = `
      SELECT * FROM patients 
      WHERE id = ? 
         OR CAST(id AS CHAR) = ? 
         OR external_id = ?
         OR CAST(external_id AS CHAR) = ?
         OR BINARY external_id = ?
      LIMIT 1
    `;
    
    const patientResult = await query(patientQuery, [
      patientId, 
      String(patientId), 
      patientId, 
      String(patientId),
      patientId
    ]);

    if (patientResult.length === 0) {
      console.log(`[Patient API] Patient not found with ID: ${patientId}`);
      return NextResponse.json(
        { error: "Pasien tidak ditemukan" },
        { status: 404 }
      );
    }

    const patient = patientResult[0];
    console.log(`[Patient API] Found patient: ${patient.id}, external_id: ${patient.external_id}, nik: ${patient.nik}`);

    // Get insurance data if exists - use patient.id from result
    const [insurance] = await query(
      "SELECT * FROM insurance WHERE patient_id = ?",
      [patient.id]
    );

    return NextResponse.json({
      ...patient,
      insurance: insurance || null,
    });
  } catch (error) {
    console.error(`[Patient API] Error fetching patient ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: "Gagal mengambil data pasien",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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

    return NextResponse.json(
      { error: "Gagal menghapus pasien" },
      { status: 500 }
    );
  }
}
