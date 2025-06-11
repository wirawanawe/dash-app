"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { FaEdit, FaTrash } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus pasien ini?")) return;

    try {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus pasien");
      }

      toast.success("Pasien berhasil dihapus");
      router.push("/patients");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Pasien tidak ditemukan
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Detail Pasien</h1>
          <div className="flex space-x-4">
            <Link
              href={`/patients/${patient.id}/edit`}
              className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              <FaEdit className="mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <FaTrash className="mr-2" />
              Hapus
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Data Pribadi</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">No. RM</dt>
                  <dd className="text-sm text-gray-900">{patient.mrNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nama</dt>
                  <dd className="text-sm text-gray-900">{patient.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">NIK</dt>
                  <dd className="text-sm text-gray-900">{patient.nik}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Tanggal Lahir
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(patient.birthDate).toLocaleDateString("id-ID")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Jenis Kelamin
                  </dt>
                  <dd className="text-sm text-gray-900">{patient.gender}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Data Kontak</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Alamat</dt>
                  <dd className="text-sm text-gray-900">{patient.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telepon</dt>
                  <dd className="text-sm text-gray-900">{patient.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{patient.email}</dd>
                </div>
              </dl>
            </div>

            {patient.insurance && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Asuransi</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Provider
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {patient.insurance.provider}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Nomor Asuransi
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {patient.insurance.number}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Tipe Asuransi
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {patient.insurance.type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {patient.insurance.status}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
