"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PatientForm from "../../components/PatientForm";
import toast from "react-hot-toast";

export default function EditPatientPage() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal mengambil data pasien");
        }

        setPatient(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Data Pasien</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <PatientForm patient={patient} isEdit={true} />
        </div>
      </div>
    </DashboardLayout>
  );
}
