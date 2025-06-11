import { Patient } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const patients = await Patient.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { nik: { contains: query } },
          { mrNumber: { contains: query } },
        ],
      },
      take: 10, // Limit to 10 results
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error searching patients:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
