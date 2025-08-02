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
                  Nama
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIP
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Lahir
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Kelamin
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asuransi
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.mrn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.nip || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.nik}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(patient.birthDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        patient.nip
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {patient.nip ? "Karyawan PLN" : "Umum"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
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
              ))}
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
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.mrn}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {patient.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {patient.nik}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        patient.nip
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {patient.nip ? "Karyawan PLN" : "Umum"}
                    </span>
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
                      <Link
                        href={`/patients/${patient.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                        title="Edit Pasien"
                        aria-label="Edit pasien"
                      >
                        <FaEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                        title="Hapus Pasien"
                        aria-label="Hapus pasien"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Mobile Card View with better touch targets and layout */}
      <div className="md:hidden space-y-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-blue-600 w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">No. RM: {patient.mrn}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => onShowDetail(patient)}
                  className="text-blue-600 hover:text-blue-900 p-3 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                  title="Lihat Detail"
                  aria-label="Lihat detail pasien"
                >
                  <FaEye className="h-5 w-5" />
                </button>
                <Link
                  href={`/patients/${patient.id}/edit`}
                  className="text-yellow-600 hover:text-yellow-900 p-3 rounded-lg hover:bg-yellow-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                  title="Edit Pasien"
                  aria-label="Edit pasien"
                >
                  <FaEdit className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => handleDelete(patient.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-900 p-3 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                  title="Hapus Pasien"
                  aria-label="Hapus pasien"
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patient.nip && (
                <div className="flex items-center space-x-2">
                  <FaIdCard className="text-gray-400 w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-gray-500">NIP:</span>
                    <span className="ml-1 text-sm text-gray-900 font-medium truncate block">
                      {patient.nip}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <FaIdCard className="text-gray-400 w-4 h-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-500">NIK:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium truncate block">
                    {patient.nik}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaBirthdayCake className="text-gray-400 w-4 h-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-500">Tanggal Lahir:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium truncate block">
                    {formatDate(patient.birthDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaVenusMars className="text-gray-400 w-4 h-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-500">Jenis Kelamin:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium truncate block">
                    {patient.gender}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaShieldAlt className="text-gray-400 w-4 h-4" />
                  <span className="text-xs text-gray-500">Status Asuransi:</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    patient.nip
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {patient.nip ? "Karyawan PLN" : "Umum"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
