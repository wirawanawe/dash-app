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
  FaPills,
} from "react-icons/fa";
import toast from "react-hot-toast";

const parsePrescriptionSegment = (segment, overrides = {}) => {
  const raw = (segment || "").trim();
  if (!raw) return null;

  let name = raw;
  let quantity = "";
  let unit = "";

  const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
  if (parenMatch) {
    name = raw.slice(0, parenMatch.index).trim();
    const inner = parenMatch[1].trim();
    const tokens = inner.split(/\s+/).filter(Boolean);

    if (tokens.length >= 2) {
      const qtyIndex = tokens.findIndex(
        (token, idx) => /^\d+(\.\d+)?$/.test(token) && idx < tokens.length - 1
      );
      if (qtyIndex !== -1) {
        quantity = tokens[qtyIndex];
        unit = tokens.slice(qtyIndex + 1).join(" ") || "";
      } else if (/^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        quantity = tokens[tokens.length - 1];
        unit = tokens.slice(0, tokens.length - 1).join(" ");
      } else {
        unit = tokens.join(" ");
      }
    } else if (tokens.length === 1) {
      if (/^\d+(\.\d+)?$/.test(tokens[0])) {
        quantity = tokens[0];
      } else {
        unit = tokens[0];
      }
    }
  } else {
    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const last = tokens[tokens.length - 1];
      const secondLast = tokens[tokens.length - 2];
      if (/^\d+(\.\d+)?$/.test(secondLast)) {
        quantity = secondLast;
        unit = last.replace(/[()]/g, "");
        name = tokens.slice(0, tokens.length - 2).join(" ");
      } else if (/^\d+(\.\d+)?$/.test(last)) {
        quantity = last;
        name = tokens.slice(0, tokens.length - 1).join(" ");
      }
    }
  }

  return {
    name: overrides.name || name || raw,
    quantity: overrides.quantity || quantity,
    unit: overrides.unit || unit,
    raw: overrides.raw || raw,
  };
};

const expandPrescriptions = (prescriptions = []) => {
  const rows = [];
  prescriptions.forEach((item) => {
    if (!item) return;

    if (typeof item === "string") {
      item
        .split(/;/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const parsed = parsePrescriptionSegment(part);
          if (parsed) rows.push(parsed);
        });
      return;
    }

    if (Array.isArray(item)) {
      rows.push(...expandPrescriptions(item));
      return;
    }

    if (typeof item === "object") {
      const raw = (item.raw || item.name || "").trim();
      if (raw && raw.includes(";")) {
        raw
          .split(/;/)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => {
            const parsed = parsePrescriptionSegment(part, {
              ...item,
              raw: part,
              name: undefined,
            });
            if (parsed) rows.push(parsed);
          });
      } else {
        const parsed = parsePrescriptionSegment(raw || item.raw || item.name || "", item);
        if (parsed) rows.push(parsed);
      }
    }
  });
  return rows;
};

const expandDiagnoses = (diagnosesSource) => {
  if (!diagnosesSource) return [];

  const rows = [];
  const pushFromString = (raw) => {
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

  if (Array.isArray(diagnosesSource)) {
    diagnosesSource.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        pushFromString(item);
      } else if (typeof item === "object") {
        pushFromString(item.raw || item.description || item.icd || "");
      }
    });
  } else if (typeof diagnosesSource === "string") {
    pushFromString(diagnosesSource);
  } else if (typeof diagnosesSource === "object") {
    pushFromString(Object.values(diagnosesSource).join("; "));
  }

  return rows;
};

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

  const prescriptionRows = expandPrescriptions(visit.prescriptions);
  const diagnosisRows = expandDiagnoses(visit.diagnoses || visit.diagnosis);

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
                alert("Fitur export akan segera tersedia");
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
                  {visit.patient?.nik && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">NIK:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.nik}</span>
                    </div>
                  )}
                  {visit.patient?.nip && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">NIP:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.nip}</span>
                    </div>
                  )}
                  {visit.patient?.noPeserta && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">No. Peserta:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.noPeserta}</span>
                    </div>
                  )}
                  {visit.patient?.gender && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Jenis Kelamin:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.gender}</span>
                    </div>
                  )}
                  {visit.patient?.department && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Bagian:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.patient.department}</span>
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

            {/* Facility & Clinic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaBuilding className="text-orange-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Fasilitas Kesehatan</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Nama Faskes:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.facility?.name || "-"}</span>
                  </div>
                  {visit.facility?.code && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Kode:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.facility.code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FaStethoscope className="text-indigo-600 mr-3 text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Klinik</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Unit/Poli:</span>
                    <span className="text-sm font-semibold text-gray-900">{visit.clinic || "-"}</span>
                  </div>
                  {visit.visitNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">No. Kunjungan:</span>
                      <span className="text-sm font-semibold text-gray-900">{visit.visitNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Records (Diagnosis) */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <FaNotesMedical className="text-blue-600 mr-3 text-xl" />
                <h3 className="text-xl font-semibold text-gray-900">Diagnosa Medis</h3>
              </div>
              {diagnosisRows.length > 0 && (
                <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wide">No</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wide">ICD</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700 uppercase tracking-wide">Diagnosa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {diagnosisRows.map((item, idx) => (
                        <tr key={`${item.raw || item.description}-${idx}`} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-3 py-2 text-xs font-medium text-gray-600">{idx + 1}</td>
                          <td className="px-3 py-2 text-sm text-gray-800">{item.icd || "-"}</td>
                          <td className="px-3 py-2 text-sm text-gray-800">{item.description || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {prescriptionRows.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaPills className="text-purple-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Resep Obat ({prescriptionRows.length})
                  </h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          Nama Obat
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          Satuan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {prescriptionRows.map((item, idx) => {
                        const name = item.name || item.raw || "-";
                        const qty = item.quantity || "-";
                        const unit = item.unit || "-";
                        return (
                          <tr key={`${item.raw || name}-${idx}`} className="hover:bg-purple-50 transition-colors duration-150">
                            <td className="px-3 py-2 text-xs font-medium text-gray-600">{idx + 1}</td>
                            <td className="px-3 py-2 text-sm text-gray-800">{name}</td>
                            <td className="px-3 py-2 text-sm text-gray-800">{qty || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-800">{unit || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Physical Examination */}
            {/* {visit.physicalExam && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <FaHeartbeat className="text-green-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Pemeriksaan Fisik</h3>
                </div> */}
                
                {/* BMI Calculation */}
                {/* {bmi && (
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
                )} */}
                
                {/* Vital Signs Grid */}
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                </div> */}

                {/* Eyes and Ears */}
                {/* {(visit.physicalExam.eyes || visit.physicalExam.ears) && (
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
            )} */}

            {/* Referral Information */}
            {/* {(visit.referral?.source?.type !== "-" || visit.referral?.destination?.notes) && (
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
            )} */}

            {/* Sick Leave & Health Certificate */}
            {/* {(visit.sickLeave?.status || visit.healthCertificate) && (
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
            )} */}

            {/* Cancellation Information */}
            {/* {visit.cancellation?.reason && (
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
            )} */}

            {/* Audit Trail */}
            {/* <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
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
            </div> */}
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
                alert("Fitur berbagi akan segera tersedia");
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
