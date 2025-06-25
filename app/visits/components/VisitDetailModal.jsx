"use client";

import {
  FaTimes,
  FaUser,
  FaUserMd,
  FaBuilding,
  FaStethoscope,
  FaHeartbeat,
  FaThermometerHalf,
  FaEye,
  FaCalendarAlt,
} from "react-icons/fa";

export default function VisitDetailModal({ visit, onClose }) {
  if (!visit) return null;

  const formatDate = (dateString) => {
    if (!dateString || dateString === "1900-01-01 00:00:00") return "-";
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Detail Kunjungan</h2>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" />
                Informasi Kunjungan
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-black">No. Kunjungan:</span>{" "}
                  <p className="text-black">{visit.id}</p>
                </div>
                <div>
                  <span className="font-medium text-black">
                    Tanggal Kunjungan:
                  </span>{" "}
                  <p className="text-black">{formatDate(visit.visitDate)}</p>
                </div>
                <div>
                  <span className="font-medium text-black">Unit Rawat:</span>{" "}
                  <p className="text-black">{visit.room}</p>
                </div>
                <div>
                  <span className="font-medium text-black">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      visit.status === "Selesai"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {visit.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaUser className="mr-2 text-green-500" />
                Informasi Pasien
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-black">Nama:</span>{" "}
                  <p className="text-black">{visit.patient?.name || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-black">No. MR:</span>{" "}
                  <p className="text-black">{visit.patient?.mrNumber || "-"}</p>
                </div>
                {visit.patient?.nip && (
                  <div>
                    <span className="font-medium text-black">NIP:</span>{" "}
                    <p className="text-black">{visit.patient.nip}</p>
                  </div>
                )}
                {visit.patient?.employeeName && (
                  <div>
                    <span className="font-medium text-black">
                      Nama Karyawan:
                    </span>{" "}
                    <p className="text-black">{visit.patient.employeeName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaUserMd className="mr-2 text-purple-500" />
                Informasi Dokter
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-black">Dokter:</span>{" "}
                  <p className="text-black">{visit.doctor?.name || "-"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaBuilding className="mr-2 text-orange-500" />
                Informasi Perusahaan
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-black">Penjamin:</span>{" "}
                  <p className="text-black">{visit.insurance?.name || "-"}</p>
                </div>
                <div>
                  <span className="font-medium text-black">Perusahaan:</span>{" "}
                  <p className="text-black">{visit.company?.name || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FaStethoscope className="mr-2 text-blue-500" />
              Rekam Medis (SOAP)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  <span className="font-medium text-black">
                    Subject (Keluhan):
                  </span>
                </div>
                <div className="bg-white p-2 rounded border min-h-[60px]">
                  <p className="text-black">{visit.complaint || "-"}</p>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  <span className="font-medium text-black">
                    Object (Pemeriksaan):
                  </span>
                </div>
                <div className="bg-white p-2 rounded border min-h-[60px]">
                  <p className="text-black">{visit.notes || "-"}</p>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  <span className="font-medium text-black">
                    Assessment (Diagnosa):
                  </span>
                </div>
                <div className="bg-white p-2 rounded border min-h-[60px]">
                  <p className="text-black">{visit.assessment || "-"}</p>{" "}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  <span className="font-medium text-black">
                    Planning (Rencana):
                  </span>
                </div>
                <div className="bg-white p-2 rounded border min-h-[60px]">
                  <p className="text-black">{visit.treatment || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Examination */}
          {visit.physicalExam && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FaHeartbeat className="mr-2 text-red-500" />
                Pemeriksaan Fisik
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Berat Badan:</div>
                  <div className="text-black">
                    {visit.physicalExam.weight || "0"} kg
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Tinggi Badan:</div>
                  <div className="text-black">
                    {visit.physicalExam.height || "0"} cm
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">
                    Lingkar Pinggang:
                  </div>
                  <div className="text-black">
                    {visit.physicalExam.waistCircumference || "0"} cm
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Suhu:</div>
                  <div className="text-black">
                    {visit.physicalExam.temperature || "0"}°C
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">SpO2:</div>
                  <div className="text-black">
                    {visit.physicalExam.spO2 || "0"}%
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">
                    Tekanan Darah:
                  </div>
                  <div>
                    <p className="text-black">
                      {visit.physicalExam.bloodPressure?.systolic || "0"}/
                      {visit.physicalExam.bloodPressure?.diastolic || "0"} mmHg
                    </p>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Nadi:</div>
                  <div className="text-black">
                    {visit.physicalExam.pulse || "0"} bpm
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">
                    Respiratory Rate:
                  </div>
                  <div className="text-black">
                    {visit.physicalExam.respirationRate || "0"} rpm
                  </div>
                </div>
              </div>

              {(visit.physicalExam.eyes || visit.physicalExam.ears) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-700">Mata:</div>
                    <div className="bg-white p-2 rounded border">
                      <p className="text-black">
                        {visit.physicalExam.eyes || "-"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Telinga:</div>
                    <div className="bg-white p-2 rounded border">
                      <p className="text-black">
                        {visit.physicalExam.ears || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Referral Information */}
          {(visit.referral?.source?.type !== "-" ||
            visit.referral?.destination?.notes) && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Informasi Rujukan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Rujukan Asal:</div>
                  <div>
                    <div>Jenis: {visit.referral.source?.type || "-"}</div>
                    <div>Perujuk: {visit.referral.source?.referrer || "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">
                    Rujukan Tujuan:
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="text-black">
                      {visit.referral.destination?.notes || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sick Leave & Health Certificate */}
          {(visit.sickLeave?.status || visit.healthCertificate) && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Surat Keterangan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Surat Sakit:</div>
                  <div>
                    <div>
                      Status: {visit.sickLeave?.status ? "Ya" : "Tidak"}
                    </div>
                    {visit.sickLeave?.status && (
                      <>
                        <div>Durasi: {visit.sickLeave.days || "-"} hari</div>
                        <div>
                          Mulai: {formatDate(visit.sickLeave.startDate)}
                        </div>
                        <div>
                          Selesai: {formatDate(visit.sickLeave.endDate)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Surat Sehat:</div>
                  <div>{visit.healthCertificate ? "Ya" : "Tidak"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Audit Trail</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Dibuat:</div>
                <div>
                  <p className="text-black">{formatDate(visit.createdAt)}</p>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Diubah:</div>
                <div>
                  <p className="text-black">{formatDate(visit.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
