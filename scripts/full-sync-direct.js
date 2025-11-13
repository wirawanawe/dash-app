#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { query, closePool } from "../lib/db.js";

const API_URL =
  "https://api-ehr-klinik.doctorphc.id/transaksi/kunjungan?limit=0&page=1";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "tmp");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "visits_dump.json");
const BATCH_SIZE = 200;
const INSERT_COLUMNS = [
  "external_id",
  "visit_number",
  "unique_id",
  "patient_nik",
  "patient_name",
  "patient_nip",
  "patient_no_peserta",
  "patient_nama_peserta",
  "patient_gender",
  "patient_birth_date",
  "patient_department",
  "diagnosis",
  "complaint",
  "treatment",
  "notes",
  "assessment",
  "status",
  "clinic",
  "room",
  "visit_date",
  "doctor_name",
  "facility_code",
  "facility_name",
  "physical_exam",
  "external_created_at",
  "external_updated_at",
  "prescriptions",
  "prescription_count",
];

const COLUMN_DEFINITIONS = {
  external_id:
    "ADD COLUMN external_id VARCHAR(100) UNIQUE COMMENT 'ID from external API'",
  visit_number: "ADD COLUMN visit_number VARCHAR(100) COMMENT 'No_Kunjungan'",
  unique_id: "ADD COLUMN unique_id VARCHAR(100) COMMENT 'Unique ID'",
  patient_nik: "ADD COLUMN patient_nik VARCHAR(100)",
  patient_name: "ADD COLUMN patient_name VARCHAR(255)",
  patient_nip: "ADD COLUMN patient_nip VARCHAR(100)",
  patient_no_peserta: "ADD COLUMN patient_no_peserta VARCHAR(100)",
  patient_nama_peserta: "ADD COLUMN patient_nama_peserta VARCHAR(255)",
  patient_gender: "ADD COLUMN patient_gender VARCHAR(50)",
  patient_birth_date: "ADD COLUMN patient_birth_date DATE",
  patient_department: "ADD COLUMN patient_department VARCHAR(255)",
  diagnosis: "ADD COLUMN diagnosis TEXT",
  complaint: "ADD COLUMN complaint TEXT",
  treatment: "ADD COLUMN treatment TEXT",
  notes: "ADD COLUMN notes TEXT",
  assessment: "ADD COLUMN assessment TEXT",
  status: "ADD COLUMN status VARCHAR(100)",
  clinic: "ADD COLUMN clinic VARCHAR(255)",
  room: "ADD COLUMN room VARCHAR(255)",
  visit_date: "ADD COLUMN visit_date DATETIME",
  doctor_name: "ADD COLUMN doctor_name VARCHAR(255)",
  facility_code: "ADD COLUMN facility_code VARCHAR(100)",
  facility_name: "ADD COLUMN facility_name VARCHAR(255)",
  physical_exam: "ADD COLUMN physical_exam JSON",
  external_created_at: "ADD COLUMN external_created_at TIMESTAMP NULL",
  external_updated_at: "ADD COLUMN external_updated_at TIMESTAMP NULL",
  prescriptions: "ADD COLUMN prescriptions JSON NULL COMMENT 'Resep data'",
  prescription_count: "ADD COLUMN prescription_count INT DEFAULT 0",
  synced_at: "ADD COLUMN synced_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
};

const normalizePrescriptions = (value) => {
  if (!value) return [];

  const result = [];

  const parseSegment = (segment, overrides = {}) => {
    const raw = (segment || "").trim();
    if (!raw) return null;

    let name = raw;
    let quantity = "";
    let unit = "";

    const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      name = raw.slice(0, parenMatch.index).trim();
      const inner = parenMatch[1].trim();
      const tokens = inner.split(/\s+/).filter(Boolean);

      if (tokens.length >= 2) {
        const qtyIndex = tokens.findIndex(
          (token, idx) => /^\d+(\.\d+)?$/.test(token) && idx < tokens.length - 1
        );
        if (qtyIndex !== -1) {
          quantity = tokens[qtyIndex];
          unit = tokens.slice(qtyIndex + 1).join(" ") || "";
        } else if (/^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
          quantity = tokens[tokens.length - 1];
          unit = tokens.slice(0, tokens.length - 1).join(" ");
        } else {
          unit = tokens.join(" ");
        }
      } else if (tokens.length === 1) {
        if (/^\d+(\.\d+)?$/.test(tokens[0])) {
          quantity = tokens[0];
        } else {
          unit = tokens[0];
        }
      }
    }

    return {
      name: overrides.name || name || raw,
      quantity: overrides.quantity || quantity,
      unit: overrides.unit || unit,
      raw: overrides.raw || raw,
    };
  };

  const pushRaw = (raw, overrides = {}) => {
    if (!raw) return;
    raw
      .split(/;/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const parsed = parseSegment(part, { ...overrides, raw: part });
        if (parsed) {
          result.push(parsed);
        }
      });
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        pushRaw(item);
      } else if (typeof item === "object") {
        const rawString = (item.raw || item.name || "").trim();
        if (rawString && rawString.includes(";")) {
          pushRaw(rawString, { ...item, name: undefined });
        } else {
          const parsed = parseSegment(rawString || item.raw || item.name || "", item);
          if (parsed) {
            result.push(parsed);
          }
        }
      }
    });
    return result;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return result;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizePrescriptions(parsed);
      }
    } catch {
      // ignore JSON parse errors
    }
    pushRaw(trimmed);
    return result;
  }

  if (typeof value === "object") {
    pushRaw(Object.values(value).join("; "));
  }

  return result;
};

async function downloadAllVisits() {
  console.log(`⬇️  Downloading visits from ${API_URL}`);
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });

  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to download data: HTTP ${response.status}`);
  }

  const totalBytes = Number(response.headers.get("content-length")) || 0;
  console.log(
    totalBytes
      ? `   Expected download size: ${(totalBytes / (1024 * 1024)).toFixed(
          2
        )} MB`
      : "   Download size unknown (no content-length header)"
  );

  const writeStream = fs.createWriteStream(OUTPUT_FILE);
  await pipeline(response.body, writeStream);

  const finalSize = (await fs.promises.stat(OUTPUT_FILE)).size;
  console.log(
    `✅ Downloaded ${(finalSize / (1024 * 1024)).toFixed(
      2
    )} MB to ${OUTPUT_FILE}`
  );
}

async function loadVisitsFromFile() {
  const raw = await fs.promises.readFile(OUTPUT_FILE, "utf-8");
  const parsed = JSON.parse(raw);

  if (!parsed?.data || !Array.isArray(parsed.data)) {
    throw new Error(
      "Downloaded file does not contain expected 'data' array from API."
    );
  }

  console.log(
    `📦 Loaded ${parsed.data.length} visits from file (total pasien: ${
      parsed["total pasien"] ?? "unknown"
    })`
  );
  return parsed.data;
}

async function ensureVisitColumns() {
  console.log("🛠️  Ensuring required columns exist in visits table...");
  const columns = await query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'visits'`
  );
  const existing = new Set(columns.map((col) => col.COLUMN_NAME));

  for (const [column, clause] of Object.entries(COLUMN_DEFINITIONS)) {
    if (!existing.has(column)) {
      try {
        await query(`ALTER TABLE visits ${clause}`);
        console.log(`   Added column '${column}'`);
      } catch (error) {
        if (error.message.includes("Duplicate column name")) {
          continue;
        }
        throw error;
      }
    }
  }
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function normalizeVisit(visit) {
  const normalizedPrescriptions = normalizePrescriptions(
    visit.Resep || visit.resep || visit.Prescription || visit.prescription
  );

  const externalId = visit.ID || visit.No_Kunjungan;
  if (!externalId) {
    return null;
  }

  return {
    external_id: visit.ID || visit.No_Kunjungan,
    visit_number: visit.No_Kunjungan || null,
    unique_id: visit.ID || null,
    patient_nik: visit.Pasien?.[0]?.NIK || null,
    patient_name: visit.Pasien?.[0]?.Nama_Pasien || null,
    patient_nip: visit.Pasien?.[0]?.NIP || null,
    patient_no_peserta: visit.Pasien?.[0]?.No_Peserta || null,
    patient_nama_peserta: visit.Pasien?.[0]?.Nama_Peserta || null,
    patient_gender: visit.Pasien?.[0]?.Jenis_Kelamin || null,
    patient_birth_date: visit.Pasien?.[0]?.Tgl_Lahir || null,
    patient_department: visit.Pasien?.[0]?.Bagian || null,
    diagnosis: visit.Diagnosa || null,
    complaint: visit.Diagnosa || null,
    treatment: null,
    notes: null,
    assessment: null,
    status: "Selesai",
    clinic: visit.Klinik || null,
    room: visit.Klinik || null,
    visit_date: visit.Tgl_Kunjungan || null,
    doctor_name: visit.Dokter || null,
    facility_code: visit.Fasilitas_Kesehatan?.[0]?.Kode || null,
    facility_name: visit.Fasilitas_Kesehatan?.[0]?.Nama_Faskes || null,
    physical_exam: JSON.stringify({
      weight: "0",
      height: "0",
      waistCircumference: "0",
      temperature: "0",
      spO2: "0",
      bloodPressure: { systolic: "0", diastolic: "0" },
      pulse: "0",
      respirationRate: "0",
      eyes: "",
      ears: "",
    }),
    external_created_at: visit.audittrail?.created_at || null,
    external_updated_at: visit.audittrail?.updated_at || null,
    prescriptions: JSON.stringify(normalizedPrescriptions),
    prescription_count: normalizedPrescriptions.length,
  };
}

async function upsertVisits(visits) {
  console.log("💾 Saving visits to database...");
  const chunks = chunk(visits, BATCH_SIZE);
  let processedCount = 0;

  for (let index = 0; index < chunks.length; index++) {
    const batch = chunks[index]
      .map(normalizeVisit)
      .filter(Boolean);

    if (batch.length === 0) {
      continue;
    }

    processedCount += batch.length;

    const placeholders = batch
      .map(
        () =>
          "(" +
          new Array(INSERT_COLUMNS.length).fill("?").join(", ") +
          ")"
      )
      .join(", ");

    const values = batch.flatMap((visit) => [
      visit.external_id,
      visit.visit_number,
      visit.unique_id,
      visit.patient_nik,
      visit.patient_name,
      visit.patient_nip,
      visit.patient_no_peserta,
      visit.patient_nama_peserta,
      visit.patient_gender,
      visit.patient_birth_date,
      visit.patient_department,
      visit.diagnosis,
      visit.complaint,
      visit.treatment,
      visit.notes,
      visit.assessment,
      visit.status,
      visit.clinic,
      visit.room,
      visit.visit_date,
      visit.doctor_name,
      visit.facility_code,
      visit.facility_name,
      visit.physical_exam,
      visit.external_created_at,
      visit.external_updated_at,
      visit.prescriptions,
      visit.prescription_count,
    ]);

    const sql = `
      INSERT INTO visits (${INSERT_COLUMNS.join(", ")})
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        visit_number = VALUES(visit_number),
        unique_id = VALUES(unique_id),
        patient_nik = VALUES(patient_nik),
        patient_name = VALUES(patient_name),
        patient_nip = VALUES(patient_nip),
        patient_no_peserta = VALUES(patient_no_peserta),
        patient_nama_peserta = VALUES(patient_nama_peserta),
        patient_gender = VALUES(patient_gender),
        patient_birth_date = VALUES(patient_birth_date),
        patient_department = VALUES(patient_department),
        diagnosis = VALUES(diagnosis),
        complaint = VALUES(complaint),
        treatment = VALUES(treatment),
        notes = VALUES(notes),
        assessment = VALUES(assessment),
        status = VALUES(status),
        clinic = VALUES(clinic),
        room = VALUES(room),
        visit_date = VALUES(visit_date),
        doctor_name = VALUES(doctor_name),
        facility_code = VALUES(facility_code),
        facility_name = VALUES(facility_name),
        physical_exam = VALUES(physical_exam),
        external_created_at = VALUES(external_created_at),
        external_updated_at = VALUES(external_updated_at),
        prescriptions = VALUES(prescriptions),
        prescription_count = VALUES(prescription_count),
        synced_at = NOW()
    `;

    await query(sql, values);

    if ((index + 1) % 5 === 0 || index === chunks.length - 1) {
      console.log(
        `   Processed batch ${index + 1}/${chunks.length} (records so far: ${processedCount})`
      );
    }
  }

  console.log(`✅ Upsert complete (${processedCount} records processed)`);
}

async function main() {
  console.time("total-sync-time");
  try {
    await downloadAllVisits();
    const visits = await loadVisitsFromFile();
    await ensureVisitColumns();
    await upsertVisits(visits);
  } catch (error) {
    console.error("❌ Full sync failed:", error);
  } finally {
    await closePool();
    console.timeEnd("total-sync-time");
  }
}

main();

