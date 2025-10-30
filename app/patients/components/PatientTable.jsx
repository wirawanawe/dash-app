"use client";

import { useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaInfoCircle,
  FaUser,
  FaIdCard,
  FaBirthdayCake,
  FaVenusMars,
  FaShieldAlt,
} from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PatientTable({ patients, onDelete, onRefresh, onShowDetail }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pasien ini?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus pasien");
      }

      toast.success("Pasien berhasil dihapus");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Desktop Table View - Enhanced */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. RM
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pasien
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Kelamin
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tgl. Lahir / Umur
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alamat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIP
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaUser className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Pasien</h3>
                      <p className="text-gray-500">Belum ada pasien yang terdaftar dalam sistem</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{patient.mrn || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{patient.name || "-"}</div>
                      {patient.department && (
                        <div className="text-xs text-blue-600">{patient.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {patient.nik || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.gender?.toLowerCase().includes('laki') || patient.gender?.toLowerCase() === 'l'
                            ? 'bg-blue-100 text-blue-800'
                            : patient.gender?.toLowerCase().includes('perempuan') || patient.gender?.toLowerCase() === 'p'
                            ? 'bg-pink-100 text-pink-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.gender && patient.gender !== "-" ? patient.gender : "Tidak Diketahui"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.birthDate && (
                        <div className="text-sm text-gray-900">
                          {formatDate(patient.birthDate)}
                        </div>
                      )}
                      {patient.age && patient.age !== "-" && (
                        <div className="text-xs text-gray-500">
                          {patient.age} tahun
                        </div>
                      )}
                      {!patient.birthDate && !patient.age && "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={patient.address || "-"}>
                        {patient.address || "-"}
                      </div>
                      {(patient.kelurahan || patient.kecamatan || patient.city) && (
                        <div className="text-xs text-gray-500 truncate">
                          {[patient.kelurahan, patient.kecamatan, patient.city].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {patient.nip ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {patient.nip}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onShowDetail(patient)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Detail"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablet Table View - Medium screens with enhanced touch targets */}
      <div className="hidden md:block lg:hidden">
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. RM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pasien
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Kelamin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaUser className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Pasien</h3>
                      <p className="text-gray-500">Belum ada pasien yang terdaftar dalam sistem</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.mrn || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{patient.name || "-"}</div>
                      {patient.department && (
                        <div className="text-xs text-blue-600">{patient.department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {patient.nik || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        patient.gender?.toLowerCase().includes('laki') || patient.gender?.toLowerCase() === 'l'
                          ? 'bg-blue-100 text-blue-800'
                          : patient.gender?.toLowerCase().includes('perempuan') || patient.gender?.toLowerCase() === 'p'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.gender && patient.gender !== "-" ? patient.gender : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {patient.nip ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {patient.nip}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onShowDetail(patient)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                          title="Lihat Detail"
                          aria-label="Lihat detail pasien"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Mobile Card View with better touch targets and layout */}
      <div className="md:hidden space-y-4">
        {patients.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Pasien</h3>
            <p className="text-gray-500">Belum ada pasien yang terdaftar dalam sistem</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    patient.gender?.toLowerCase().includes('laki') || patient.gender?.toLowerCase() === 'l'
                      ? 'bg-blue-100'
                      : patient.gender?.toLowerCase().includes('perempuan') || patient.gender?.toLowerCase() === 'p'
                      ? 'bg-pink-100'
                      : 'bg-gray-100'
                  }`}>
                    <FaUser className={`w-6 h-6 ${
                      patient.gender?.toLowerCase().includes('laki') || patient.gender?.toLowerCase() === 'l'
                        ? 'text-blue-600'
                        : patient.gender?.toLowerCase().includes('perempuan') || patient.gender?.toLowerCase() === 'p'
                        ? 'text-pink-600'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-gray-500">No. RM: {patient.mrn || "-"}</p>
                    {patient.department && (
                      <p className="text-xs text-blue-600 font-medium">{patient.department}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onShowDetail(patient)}
                  className="text-blue-600 hover:text-blue-900 p-3 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center flex-shrink-0"
                  title="Lihat Detail"
                  aria-label="Lihat detail pasien"
                >
                  <FaEye className="h-5 w-5" />
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patient.nik && (
                  <div className="flex items-start space-x-2">
                    <FaIdCard className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-500 block">NIK:</span>
                      <span className="text-sm text-gray-900 font-medium break-all">
                        {patient.nik}
                      </span>
                    </div>
                  </div>
                )}

                {patient.nip && (
                  <div className="flex items-start space-x-2">
                    <FaIdCard className="text-blue-400 w-4 h-4 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-500 block">NIP:</span>
                      <span className="text-sm text-gray-900 font-medium break-all">
                        {patient.nip}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <FaVenusMars className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-500 block">Jenis Kelamin:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      patient.gender?.toLowerCase().includes('laki') || patient.gender?.toLowerCase() === 'l'
                        ? 'bg-blue-100 text-blue-800'
                        : patient.gender?.toLowerCase().includes('perempuan') || patient.gender?.toLowerCase() === 'p'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.gender || "-"}
                    </span>
                  </div>
                </div>

                {patient.age && (
                  <div className="flex items-start space-x-2">
                    <FaBirthdayCake className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-500 block">Umur:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {patient.age} tahun
                      </span>
                    </div>
                  </div>
                )}

                {patient.birthDate && (
                  <div className="flex items-start space-x-2 sm:col-span-2">
                    <FaBirthdayCake className="text-purple-400 w-4 h-4 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-500 block">Tanggal Lahir:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {formatDate(patient.birthDate)}
                      </span>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start space-x-2 sm:col-span-2">
                    <FaInfoCircle className="text-gray-400 w-4 h-4 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-500 block">Alamat:</span>
                      <span className="text-sm text-gray-900 line-clamp-2">
                        {patient.address}
                        {(patient.kelurahan || patient.kecamatan || patient.city) && (
                          <span className="text-gray-500">
                            {", "}
                            {[patient.kelurahan, patient.kecamatan, patient.city].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaShieldAlt className="text-gray-400 w-4 h-4" />
                    <span className="text-xs text-gray-500">Status:</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.nip
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.nip ? 'Karyawan PLN' : 'Umum'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
