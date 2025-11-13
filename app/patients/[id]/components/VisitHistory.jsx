"use client";

import { useState, useEffect } from "react";
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaStethoscope, 
  FaClock, 
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle
} from "react-icons/fa";
import toast from "react-hot-toast";

export default function VisitHistory({ mrNumber, patientId }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    const fetchVisitHistory = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use useNik=true to fetch visits based on NIK (No.KTP) from the visits table
        const response = await fetch(`/api/patients/${patientId}/visits?page=${currentPage}&limit=50&useNik=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setRawData(data);
        
        if (data.data && Array.isArray(data.data)) {
          setVisits(data.data);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalVisits(data.pagination?.totalVisits || 0);
        } else {
          setVisits([]);
          setTotalPages(1);
          setTotalVisits(0);
        }
      } catch (error) {

        setError("Gagal mengambil riwayat kunjungan");
        toast.error("Gagal mengambil riwayat kunjungan");
      } finally {
        setLoading(false);
      }
    };

    fetchVisitHistory();
  }, [patientId, currentPage]);

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

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  const expandDiagnoses = (value) => {
    if (!value) return [];
    const rows = [];

    const push = (raw) => {
      if (!raw) return;
      const cleaned = raw.replace(/^\(|\)$/g, "");
      cleaned
        .split(/;/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const match = part.match(/^\(?\s*([A-Za-z0-9\.\-]+)\s*-\s*(.+?)\)?$/);
          if (match) {
            rows.push({
              icd: match[1].trim(),
              description: match[2].trim(),
              raw: part.replace(/^\(|\)$/g, "").trim(),
            });
          } else {
            rows.push({
              icd: "",
              description: part.replace(/^\(|\)$/g, "").trim(),
              raw: part.replace(/^\(|\)$/g, "").trim(),
            });
          }
        });
    };

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (!item) return;
        if (typeof item === "string") {
          push(item);
        } else if (typeof item === "object") {
          push(item.raw || item.description || item.icd || "");
        }
      });
    } else if (typeof value === "string") {
      push(value);
    } else if (typeof value === "object") {
      push(Object.values(value).join("; "));
    }

    return rows;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "selesai":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
      case "menunggu":
        return "bg-yellow-100 text-yellow-800";
      case "batal":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          Riwayat Kunjungan
        </h3>
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin h-6 w-6 text-blue-500" />
          <span className="ml-2 text-gray-600">Memuat riwayat kunjungan...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          Riwayat Kunjungan
        </h3>
        <div className="text-center py-8">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Gagal memuat riwayat kunjungan</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          {mrNumber && (
            <p className="text-xs text-gray-400 mb-2">
              MR Number: {mrNumber}
            </p>
          )}
          <button
            onClick={() => {
              setCurrentPage(1);
              setError(null);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          Riwayat Kunjungan
          {visits.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {visits.length} kunjungan
            </span>
          )}
          {mrNumber && (
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              MR: {mrNumber}
            </span>
          )}
        </h3>
        
        {totalPages > 1 && (
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
        )}
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-8">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada riwayat kunjungan</p>
          {mrNumber && (
            <p className="text-xs text-gray-400 mt-2">
              MR Number: {mrNumber}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit, index) => (
            <div
              key={visit.id || index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <FaClock className="text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {formatDate(visit.tanggal_kunjungan || visit.visit_date || visit.tanggal)} - {formatTime(visit.jam_kunjungan || visit.visit_time || visit.jam)}
                  </span>
                </div>
                {visit.status && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visit.status)}`}>
                    {visit.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 flex items-center">
                    <FaUserMd className="mr-1 text-gray-500" />
                    Dokter:
                  </span>
                  <p className="text-gray-900">
                    {visit.nama_dokter || visit.doctor_name || visit.dokter || "-"}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700 flex items-center">
                    <FaStethoscope className="mr-1 text-gray-500" />
                    Poli:
                  </span>
                  <p className="text-gray-900">
                    {visit.nama_poli || visit.poly_name || visit.poli || visit.nama_poliklinik || "-"}
                  </p>
                </div>

                {(visit.diagnosis || visit.diagnosa) && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Diagnosis:</span>
                    <div className="text-gray-900 mt-1 bg-gray-50 p-2 rounded space-y-2">
                      <p>{visit.diagnosis || visit.diagnosa}</p>
                      {(() => {
                        const rows = expandDiagnoses(
                          visit.diagnoses || visit.diagnosis || visit.diagnosa
                        );
                        if (!rows.length) return null;
                        return (
                          <table className="min-w-full text-xs border border-gray-200 rounded">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left font-semibold text-gray-600">No</th>
                                <th className="px-2 py-1 text-left font-semibold text-gray-600">ICD</th>
                                <th className="px-2 py-1 text-left font-semibold text-gray-600">Diagnosa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((item, idx) => (
                                <tr key={`${item.raw}-${idx}`} className="border-t border-gray-200">
                                  <td className="px-2 py-1 text-gray-600">{idx + 1}</td>
                                  <td className="px-2 py-1 text-gray-900">{item.icd || "-"}</td>
                                  <td className="px-2 py-1 text-gray-900">{item.description || item.raw}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {(visit.catatan || visit.notes || visit.catatan_pemeriksaan) && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Catatan:</span>
                    <p className="text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                      {visit.catatan || visit.notes || visit.catatan_pemeriksaan}
                    </p>
                  </div>
                )}

                {(() => {
                  const raw =
                    visit.prescriptions ||
                    visit.resep ||
                    visit.prescription ||
                    visit.obat;

                  const normalize = (input) => {
                    if (Array.isArray(input)) {
                      return input
                        .map((item) =>
                          typeof item === "string"
                            ? item
                            : item && typeof item === "object"
                            ? [item.name, item.quantity, item.unit]
                                .filter(Boolean)
                                .join(" ")
                            : ""
                        )
                        .filter(Boolean)
                        .join("; ");
                    }
                    if (typeof input === "string") {
                      return input;
                    }
                    if (input && typeof input === "object") {
                      return Object.values(input)
                        .map((val) =>
                          typeof val === "string" ? val : String(val ?? "")
                        )
                        .filter(Boolean)
                        .join("; ");
                    }
                    return "";
                  };

                  const prescriptionText = normalize(raw);

                  return prescriptionText ? (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Resep:</span>
                    <p className="text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                      {prescriptionText}
                    </p>
                  </div>
                  ) : null;
                })()}
              </div>

              {/* Vital Signs */}
              {(visit.tinggi_badan || visit.berat_badan || visit.tekanan_darah || visit.nadi || visit.suhu || visit.respirasi) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-700 mb-2 block">Tanda Vital:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {visit.tinggi_badan && (
                      <div>
                        <span className="text-gray-500">Tinggi Badan:</span>
                        <span className="ml-1 text-gray-900">{visit.tinggi_badan} cm</span>
                      </div>
                    )}
                    {visit.berat_badan && (
                      <div>
                        <span className="text-gray-500">Berat Badan:</span>
                        <span className="ml-1 text-gray-900">{visit.berat_badan} kg</span>
                      </div>
                    )}
                    {visit.tekanan_darah && (
                      <div>
                        <span className="text-gray-500">Tekanan Darah:</span>
                        <span className="ml-1 text-gray-900">{visit.tekanan_darah} mmHg</span>
                      </div>
                    )}
                    {visit.nadi && (
                      <div>
                        <span className="text-gray-500">Nadi:</span>
                        <span className="ml-1 text-gray-900">{visit.nadi} bpm</span>
                      </div>
                    )}
                    {visit.suhu && (
                      <div>
                        <span className="text-gray-500">Suhu:</span>
                        <span className="ml-1 text-gray-900">{visit.suhu} °C</span>
                      </div>
                    )}
                    {visit.respirasi && (
                      <div>
                        <span className="text-gray-500">Respirasi:</span>
                        <span className="ml-1 text-gray-900">{visit.respirasi} /menit</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(visit.nomor_antrian || visit.queue_number || visit.antrian) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    No. Antrian: {visit.nomor_antrian || visit.queue_number || visit.antrian}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 pagination-safe-area">
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