import { query } from "../lib/db.js";

async function addSampleClinics() {
  try {
    console.log("Adding sample clinics data...");

    // Check existing data first to avoid duplicates
    const existingClinics = await query("SELECT code FROM polyclinics");
    const existingCodes = existingClinics.map((clinic) => clinic.code);

    // Sample clinic data
    const clinics = [
      {
        name: "Klinik Umum",
        code: "KU-01",
        description: "Klinik untuk konsultasi umum",
      },
      {
        name: "Klinik Gigi",
        code: "KG-01",
        description: "Klinik untuk layanan kesehatan gigi",
      },
      {
        name: "Klinik Mata",
        code: "KM-01",
        description: "Klinik untuk layanan kesehatan mata",
      },
      {
        name: "Klinik Anak",
        code: "KA-01",
        description: "Klinik untuk kesehatan anak",
      },
      {
        name: "Klinik Kandungan",
        code: "KK-01",
        description: "Klinik untuk kesehatan ibu dan kandungan",
      },
    ];

    // Insert each clinic if its code doesn't already exist
    for (const clinic of clinics) {
      if (existingCodes.includes(clinic.code)) {
        console.log(
          `Clinic with code ${clinic.code} already exists, skipping...`
        );
        continue;
      }

      await query(
        "INSERT INTO polyclinics (name, code, description) VALUES (?, ?, ?)",
        [clinic.name, clinic.code, clinic.description]
      );
      console.log(`Added clinic: ${clinic.name} (${clinic.code})`);
    }

    console.log("Sample clinics data added successfully");
  } catch (error) {
    console.error("Error adding sample clinics:", error);
  } finally {
    process.exit();
  }
}

// Run the function
addSampleClinics();
