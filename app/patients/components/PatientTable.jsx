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
import PatientDetailModal from "./PatientDetailModal";

export default function PatientTable({ patients, onDelete, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const handleShowDetail = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedPatient(null);
    setShowDetailModal(false);
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
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowDetail(patient)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Lihat Detail"
                      >
                        <FaEye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-400" />
                <h3 className="font-semibold text-gray-900 text-lg">
                  {patient.name}
                </h3>
              </div>
              <button
                onClick={() => handleShowDetail(patient)}
                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                title="Lihat Detail"
              >
                <FaEye className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <FaIdCard className="text-gray-400 w-4 h-4" />
                <div>
                  <span className="text-xs text-gray-500">No. RM:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium">
                    {patient.mrn}
                  </span>
                </div>
              </div>

              {patient.nip && (
                <div className="flex items-center space-x-2">
                  <FaIdCard className="text-gray-400 w-4 h-4" />
                  <div>
                    <span className="text-xs text-gray-500">NIP:</span>
                    <span className="ml-1 text-sm text-gray-900 font-medium">
                      {patient.nip}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <FaIdCard className="text-gray-400 w-4 h-4" />
                <div>
                  <span className="text-xs text-gray-500">NIK:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium">
                    {patient.nik}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaBirthdayCake className="text-gray-400 w-4 h-4" />
                <div>
                  <span className="text-xs text-gray-500">Tanggal Lahir:</span>
                  <span className="ml-1 text-sm text-gray-900 font-medium">
                    {formatDate(patient.birthDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaVenusMars className="text-gray-400 w-4 h-4" />
                  <div>
                    <span className="text-xs text-gray-500">
                      Jenis Kelamin:
                    </span>
                    <span className="ml-1 text-sm text-gray-900 font-medium">
                      {patient.gender}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FaShieldAlt className="text-gray-400 w-4 h-4" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
          </div>
        ))}
      </div>

      {/* Patient Detail Modal */}
      {showDetailModal && selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
}
