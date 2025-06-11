"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PatientForm from "../components/PatientForm";

export default function NewPatientPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Tambah Pasien Baru</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <PatientForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
