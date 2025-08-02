"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FaEdit,
  FaTrash,
  FaUser,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaBriefcase,
  FaHeartbeat,
  FaClipboardList,
  FaArrowLeft,
} from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import VisitHistory from "./components/VisitHistory";

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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "-";
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      return `${age} tahun`;
    } catch {
      return "-";
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
          <div className="flex items-center">
            <Link
              href="/patients"
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Detail Pasien</h1>
          </div>
          <div className="flex space-x-3">
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

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Informasi Pribadi
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">No. RM:</span>
                  <p className="text-gray-900 font-mono text-lg">
                    {patient.mrNumber || "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Nama Lengkap:
                  </span>
                  <p className="text-gray-900 text-lg font-medium">
                    {patient.name || "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">NIK:</span>
                  <p className="text-gray-900 font-mono">
                    {patient.nik || "-"}
                  </p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium text-gray-700">
                      Jenis Kelamin:
                    </span>
                    <p className="text-gray-900">{patient.gender || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Golongan Darah:
                    </span>
                    <p className="text-gray-900">{patient.bloodType || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FaCalendarAlt className="mr-2 text-green-500" />
                Informasi Kelahiran
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Tanggal Lahir:
                  </span>
                  <p className="text-gray-900">
                    {formatDate(patient.birthDate)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Umur:</span>
                  <p className="text-gray-900 text-lg font-medium">
                    {calculateAge(patient.birthDate)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Tempat Lahir:
                  </span>
                  <p className="text-gray-900">{patient.birthPlace || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Agama:</span>
                  <p className="text-gray-900">{patient.religion || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FaPhone className="mr-2 text-purple-500" />
                Informasi Kontak
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Nomor Telepon:
                  </span>
                  <p className="text-gray-900">{patient.phone || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{patient.email || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Kontak Darurat:
                  </span>
                  <p className="text-gray-900">
                    {patient.emergencyContact || "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Status Pernikahan:
                  </span>
                  <p className="text-gray-900">
                    {patient.maritalStatus || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-orange-500" />
                Alamat
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Alamat Lengkap:
                  </span>
                  <p className="text-gray-900">{patient.address || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Kota:</span>
                    <p className="text-gray-900">{patient.city || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Provinsi:</span>
                    <p className="text-gray-900">{patient.province || "-"}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Kode Pos:</span>
                  <p className="text-gray-900">{patient.postalCode || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          {(patient.nip ||
            patient.employeeName ||
            patient.jobTitle ||
            patient.department) && (
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FaBriefcase className="mr-2 text-indigo-500" />
                Informasi Kepegawaian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">NIP:</span>
                  <p className="text-gray-900 font-mono">
                    {patient.nip || "-"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Nama Karyawan:
                  </span>
                  <p className="text-gray-900">{patient.employeeName || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Jabatan:</span>
                  <p className="text-gray-900">{patient.jobTitle || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Departemen:</span>
                  <p className="text-gray-900">{patient.department || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Information */}
          <div className="bg-emerald-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FaShieldAlt className="mr-2 text-emerald-500" />
              Informasi Asuransi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  Jenis Asuransi:
                </span>
                <p className="text-gray-900">
                  {patient.nip
                    ? "Karyawan PLN"
                    : patient.insuranceProvider || "Umum"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Nomor Asuransi:
                </span>
                <p className="text-gray-900 font-mono">
                  {patient.insuranceNumber || "-"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Status Asuransi:
                </span>
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    patient.insuranceStatus === "Active" || patient.nip
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {patient.insuranceStatus ||
                    (patient.nip ? "Aktif" : "Tidak Ada")}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Berlaku Hingga:
                </span>
                <p className="text-gray-900">
                  {formatDate(patient.insuranceExpiry) || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FaHeartbeat className="mr-2 text-red-500" />
              Informasi Medis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Alergi:</span>
                <div className="bg-white p-3 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.allergies || "Tidak ada alergi yang diketahui"}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Riwayat Penyakit:
                </span>
                <div className="bg-white p-3 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.medicalHistory || "Tidak ada riwayat penyakit"}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Obat yang Sedang Dikonsumsi:
                </span>
                <div className="bg-white p-3 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.currentMedications ||
                      "Tidak ada obat yang dikonsumsi"}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Catatan Khusus:
                </span>
                <div className="bg-white p-3 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.notes || "Tidak ada catatan khusus"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FaClipboardList className="mr-2 text-gray-500" />
              Informasi Registrasi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  Tanggal Registrasi:
                </span>
                <p className="text-gray-900">
                  {formatDateTime(patient.createdAt)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Terakhir Diupdate:
                </span>
                <p className="text-gray-900">
                  {formatDateTime(patient.updatedAt)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    patient.status === "Active" || !patient.status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {patient.status || "Aktif"}
                </span>
              </div>
            </div>
          </div>

          {/* Visit History */}
          <VisitHistory mrNumber={patient.mrNumber || patient.mrn || patient.id} patientId={patient.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
