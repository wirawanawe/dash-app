"use client";

import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaUserMd,
  FaMapMarkerAlt,
  FaClipboardCheck,
  FaStethoscope,
  FaNotesMedical,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaWeight,
  FaRuler,
  FaThermometerHalf,
  FaHeartbeat,
  FaLungs,
  FaTint,
} from "react-icons/fa";

export default function PatientVisitHistory({ patientId }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, [patientId, currentPage]);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/patients/${patientId}/visits?page=${currentPage}&limit=5`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error("Gagal mengambil data kunjungan");
      }

      const data = await response.json();
      setVisits(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching visits:", error);
      setError(error.message || "Gagal mengambil data kunjungan");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "selesai":
        return "bg-green-100 text-green-800";
      case "active":
      case "aktif":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "dibatalkan":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderVitalSigns = (vitalSigns) => {
    if (!vitalSigns) return <span className="text-gray-500">-</span>;

    const vitals = [
      {
        label: "TB",
        value: vitalSigns.tinggi_badan,
        unit: "cm",
        icon: FaRuler,
      },
      {
        label: "BB",
        value: vitalSigns.berat_badan,
        unit: "kg",
        icon: FaWeight,
      },
      {
        label: "TD",
        value: vitalSigns.tekanan_darah,
        unit: "mmHg",
        icon: FaHeartbeat,
      },
      {
        label: "Nadi",
        value: vitalSigns.nadi,
        unit: "/mnt",
        icon: FaHeartbeat,
      },
      {
        label: "Suhu",
        value: vitalSigns.suhu,
        unit: "°C",
        icon: FaThermometerHalf,
      },
      { label: "RR", value: vitalSigns.respirasi, unit: "/mnt", icon: FaLungs },
    ];

    return (
      <div className="grid grid-cols-2 gap-2">
        {vitals.map((vital, index) => {
          const Icon = vital.icon;
          return (
            <div key={index} className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {vital.label}: {vital.value || "-"} {vital.value && vital.unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-[#E22345]" />
        <span className="ml-2">Memuat riwayat kunjungan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Gagal memuat riwayat kunjungan</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchVisits}
            className="bg-[#E22345] text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FaClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Belum ada riwayat kunjungan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-900">
          Riwayat Kunjungan
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <FaChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
          </button>
          <span className="text-xs lg:text-sm text-gray-600 px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <FaChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visits.map((visit, index) => (
          <div
            key={visit.id || index}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#E22345] bg-opacity-10 p-2 rounded-full">
                    <FaStethoscope className="h-5 w-5 text-[#E22345]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {formatDate(visit.visit_date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(visit.visit_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <FaUserMd className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {visit.doctor_name || "Dokter tidak diketahui"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      visit.status
                    )}`}
                  >
                    {visit.status || "Selesai"}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedVisit(
                        selectedVisit === visit.id ? null : visit.id
                      )
                    }
                    className="p-1 text-gray-500 hover:text-[#E22345] transition-colors"
                  >
                    <FaEye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {visit.clinic_name || "Klinik tidak diketahui"}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Keluhan:</span>
                    <p className="text-gray-600 mt-1">
                      {visit.complaint || "Tidak ada keluhan"}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">
                      Diagnosis:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {visit.diagnosis || "Tidak ada diagnosis"}
                    </p>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Tindakan:</span>
                    <p className="text-gray-600 mt-1">
                      {visit.treatment || "Tidak ada tindakan"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedVisit === visit.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Tanda Vital
                      </h4>
                      {renderVitalSigns(visit.vital_signs)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Catatan
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {visit.notes || "Tidak ada catatan"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
              title="Halaman sebelumnya"
            >
              Sebelumnya
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-r border-gray-200">
              {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Halaman selanjutnya"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
