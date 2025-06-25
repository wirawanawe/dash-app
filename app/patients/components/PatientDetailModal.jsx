"use client";

import {
  FaTimes,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaBuilding,
  FaBriefcase,
  FaHeartbeat,
  FaClipboardList,
} from "react-icons/fa";

export default function PatientDetailModal({ patient, onClose }) {
  if (!patient) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Detail Pasien</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Informasi Pribadi
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">No. RM:</span>
                  <p className="text-gray-900 font-mono text-lg">
                    {patient.mrNumber || patient.mrn || "-"}
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

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FaHeartbeat className="mr-2 text-red-500" />
              Informasi Medis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Alergi:</span>
                <div className="bg-white p-2 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.allergies || "Tidak ada alergi yang diketahui"}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Riwayat Penyakit:
                </span>
                <div className="bg-white p-2 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.medicalHistory || "Tidak ada riwayat penyakit"}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Obat yang Sedang Dikonsumsi:
                </span>
                <div className="bg-white p-2 rounded border min-h-[60px] mt-1">
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
                <div className="bg-white p-2 rounded border min-h-[60px] mt-1">
                  <p className="text-gray-900">
                    {patient.notes || "Tidak ada catatan khusus"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            onClick={() =>
              window.open(`/patients/${patient.id}/edit`, "_blank")
            }
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Edit Pasien
          </button>
          <button
            onClick={() =>
              window.open(`/visits?patientId=${patient.id}`, "_blank")
            }
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Lihat Riwayat Kunjungan
          </button>
        </div>
      </div>
    </div>
  );
}
