"use client";

import {
  FaTimes,
  FaUser,
  FaUserMd,
  FaStethoscope,
  FaHeartbeat,
  FaThermometerHalf,
  FaEye,
  FaCalendarAlt,
  FaFileMedical,
  FaClipboardList,
  FaNotesMedical,
  FaShieldAlt,
  FaBriefcase,
  FaExchangeAlt,
  FaCertificate,
  FaHistory,
  FaWeight,
  FaRuler,
  FaTachometerAlt,
  FaEyeDropper,
  FaLungs,
  FaEye as FaEyeIcon,
  FaPrint,
  FaDownload,
  FaShare,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaUserTie,
  FaBuilding,
  FaCreditCard,
  FaCalendarCheck,
  FaClock,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaMinusCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

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

  const formatTime = (dateString) => {
    if (!dateString || dateString === "1900-01-01 00:00:00") return "-";
    try {
      return new Date(dateString).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Aktif":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Batal":
        return "bg-red-100 text-red-800 border-red-200";
      case "Menunggu":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Selesai":
        return <FaCheckCircle className="text-emerald-600" />;
      case "Aktif":
        return <FaClock className="text-blue-600" />;
      case "Batal":
        return <FaExclamationTriangle className="text-red-600" />;
      case "Menunggu":
        return <FaMinusCircle className="text-yellow-600" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  const calculateBMI = () => {
    if (!visit.physicalExam?.weight || !visit.physicalExam?.height) return null;
    const weight = parseFloat(visit.physicalExam.weight);
    const height = parseFloat(visit.physicalExam.height) / 100; // Convert cm to m
    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: "Kurus", color: "text-blue-600", bg: "bg-blue-100" };
    if (bmi < 25) return { category: "Normal", color: "text-green-600", bg: "bg-green-100" };
    if (bmi < 30) return { category: "Gemuk", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { category: "Obesitas", color: "text-red-600", bg: "bg-red-100" };
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col animate-modal-fade-in">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <FaFileMedical className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detail Kunjungan</h2>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">ID: #{visit.id}</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(visit.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(visit.status)} animate-status-glow`}>
                    {visit.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
              title="Print"
            >
              <FaPrint className="text-lg" />
            </button>
            <button
              onClick={() => {
                // Export functionality could be added here
                toast.info("Fitur export akan segera tersedia");
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
              title="Export"
            >
              <FaDownload className="text-lg" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
              title="Tutup"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6 modal-content-stagger">
            {/* Main Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Visit Information */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaCalendarAlt className="text-blue-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Kunjungan</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Tanggal:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatDate(visit.visitDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Waktu:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatTime(visit.visitDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Unit Rawat:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.room || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaUser className="text-green-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Pasien</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Nama:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.patient?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">No. MR:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.patient?.mrNumber || "-"}</span>
                  </div>
                  {visit.patient?.nip && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">NIP:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.nip}</span>
                    </div>
                  )}
                  {visit.patient?.employeeName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Karyawan:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.employeeName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Information */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaUserMd className="text-purple-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Dokter</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Dokter:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.doctor?.name || "-"}</span>
                  </div>
                  {visit.doctor?.specialization && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Spesialisasi:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.doctor.specialization}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance & Company Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaShieldAlt className="text-orange-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Penjamin</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Penjamin:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.insurance?.name || "-"}</span>
                  </div>
                  {visit.insurance?.number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">No. Kartu:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.insurance.number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaBriefcase className="text-indigo-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Perusahaan</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Perusahaan:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.company?.name || "-"}</span>
                  </div>
                  {visit.company?.address && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Alamat:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.company.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Records (SOAP) */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <FaStethoscope className="text-blue-600 mr-3 text-xl" />
                <h3 className="text-xl font-semibold text-gray-900">Rekam Medis (SOAP)</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <FaClipboardList className="text-blue-500 mr-2" />
                      <span className="font-semibold text-gray-900">Subject (Keluhan)</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px] shadow-sm">
                      <p className="text-gray-800 leading-relaxed">{visit.complaint || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <FaEye className="text-green-500 mr-2" />
                      <span className="font-semibold text-gray-900">Object (Pemeriksaan)</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px] shadow-sm">
                      <p className="text-gray-800 leading-relaxed">{visit.notes || "-"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <FaNotesMedical className="text-purple-500 mr-2" />
                      <span className="font-semibold text-gray-900">Assessment (Diagnosa)</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px] shadow-sm">
                      <p className="text-gray-800 leading-relaxed">{visit.assessment || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <FaStethoscope className="text-orange-500 mr-2" />
                      <span className="font-semibold text-gray-900">Planning (Rencana)</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px] shadow-sm">
                      <p className="text-gray-800 leading-relaxed">{visit.treatment || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Examination */}
            {visit.physicalExam && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaHeartbeat className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Pemeriksaan Fisik</h3>
                </div>
                
                {/* BMI Calculation */}
                {bmi && (
                  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm animate-bmi-pulse">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Indeks Massa Tubuh (BMI)</h4>
                        <p className="text-sm text-gray-600">Berat badan ideal berdasarkan tinggi badan</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{bmi}</div>
                        <div className={`text-sm font-medium ${bmiCategory.color}`}>
                          {bmiCategory.category}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Vital Signs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaWeight className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Berat Badan</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.weight || "0"} kg</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaRuler className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Tinggi Badan</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.height || "0"} cm</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaRuler className="text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Lingkar Pinggang</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.waistCircumference || "0"} cm</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaThermometerHalf className="text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Suhu</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.temperature || "0"}°C</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaEyeDropper className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">SpO2</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.spO2 || "0"}%</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaHeartbeat className="text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Tekanan Darah</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {visit.physicalExam.bloodPressure?.systolic || "0"}/{visit.physicalExam.bloodPressure?.diastolic || "0"} mmHg
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaTachometerAlt className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Nadi</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.pulse || "0"} bpm</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <FaLungs className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Respiratory Rate</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{visit.physicalExam.respirationRate || "0"} rpm</div>
                  </div>
                </div>

                {/* Eyes and Ears */}
                {(visit.physicalExam.eyes || visit.physicalExam.ears) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visit.physicalExam.eyes && (
                      <div>
                        <div className="flex items-center mb-2">
                          <FaEyeIcon className="text-blue-500 mr-2" />
                          <span className="font-semibold text-gray-900">Mata</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-gray-800">{visit.physicalExam.eyes}</p>
                        </div>
                      </div>
                    )}
                    {visit.physicalExam.ears && (
                      <div>
                        <div className="flex items-center mb-2">
                          <FaEar className="text-green-500 mr-2" />
                          <span className="font-semibold text-gray-900">Telinga</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-gray-800">{visit.physicalExam.ears}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Referral Information */}
            {(visit.referral?.source?.type !== "-" || visit.referral?.destination?.notes) && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaExchangeAlt className="text-yellow-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Rujukan</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Rujukan Asal</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jenis:</span>
                        <span className="text-sm font-medium text-gray-900">{visit.referral.source?.type || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Perujuk:</span>
                        <span className="text-sm font-medium text-gray-900">{visit.referral.source?.referrer || "-"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Rujukan Tujuan</h4>
                    <p className="text-gray-800">{visit.referral.destination?.notes || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sick Leave & Health Certificate */}
            {(visit.sickLeave?.status || visit.healthCertificate) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaCertificate className="text-purple-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Surat Keterangan</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Surat Sakit</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${visit.sickLeave?.status ? 'text-green-600' : 'text-red-600'}`}>
                          {visit.sickLeave?.status ? "Ya" : "Tidak"}
                        </span>
                      </div>
                      {visit.sickLeave?.status && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Durasi:</span>
                            <span className="text-sm font-medium text-gray-900">{visit.sickLeave.days || "-"} hari</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Mulai:</span>
                            <span className="text-sm font-medium text-gray-900">{formatDate(visit.sickLeave.startDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Selesai:</span>
                            <span className="text-sm font-medium text-gray-900">{formatDate(visit.sickLeave.endDate)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Surat Sehat</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium ${visit.healthCertificate ? 'text-green-600' : 'text-red-600'}`}>
                        {visit.healthCertificate ? "Ya" : "Tidak"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Information */}
            {visit.cancellation?.reason && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaExclamationTriangle className="text-red-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Pembatalan</h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tanggal Pembatalan:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(visit.cancellation.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Alasan:</span>
                      <span className="text-sm font-medium text-gray-900">{visit.cancellation.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <FaHistory className="text-gray-600 mr-3 text-xl" />
                <h3 className="text-xl font-semibold text-gray-900">Audit Trail</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Dibuat</h4>
                  <p className="text-gray-800">{formatDate(visit.createdAt)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Diubah</h4>
                  <p className="text-gray-800">{formatDate(visit.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer - Always Visible */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            Terakhir diperbarui: {formatDate(visit.updatedAt)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Share functionality could be added here
                toast.info("Fitur berbagi akan segera tersedia");
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <FaShare className="mr-2" />
              Bagikan
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
