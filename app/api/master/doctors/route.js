import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all doctors
export async function GET() {
  try {
    const doctors = await Doctor.findMany({
      include: {
        polyclinic: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(doctors);
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal mengambil data dokter" },
      { status: 500 }
    );
  }
}

// POST new doctor
export async function POST(request) {
  try {
    const data = await request.json();
    const doctor = await Doctor.create({
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

    return NextResponse.json(
      { error: "Gagal menambahkan dokter" },
      { status: 500 }
    );
  }
}
