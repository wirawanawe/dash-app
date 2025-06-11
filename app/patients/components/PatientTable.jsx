"use client";

import { useState } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PatientTable({ patients, onDelete, onRefresh }) {
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
    <div className="overflow-x-auto ">
      <table className="min-w-full bg-white rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No. RM
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIK
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal Lahir
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jenis Kelamin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asuransi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {patients.map((patient) => (
            <tr key={patient.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.mrn}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.nip}
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {patient.nip ? "Karyawan PLN" : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex space-x-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FaEye className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    <FaEdit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(patient.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
