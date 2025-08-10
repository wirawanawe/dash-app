"use client";

import { useState, useEffect } from "react";
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
  FaHistory,
  FaUserMd,
  FaGraduationCap,
  FaHeart,
  FaVenusMars,
  FaTint,
  FaUser as FaUserIcon,
  FaHeart as FaHeartIcon,
  FaHome,
  FaExclamationTriangle,
  FaStethoscope,
  FaCapsules,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaPlus,
  FaFileAlt,
  FaEye,
  FaNotesMedical,
  FaWeight,
  FaRuler,
  FaThermometerHalf,
  FaEyeDropper,
  FaLungs,
  FaTachometerAlt,
} from "react-icons/fa";
import PatientVisitHistory from "./PatientVisitHistory";

export default function PatientDetailModal({ patient, onClose }) {
  const [activeTab, setActiveTab] = useState("patient-info");
  const [visitHistory, setVisitHistory] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "Aktif":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Inactive":
      case "Tidak Aktif":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const fetchVisitHistory = async () => {
    if (!patient.mrNumber && !patient.mrn && !patient.id) return;
    
    setLoadingVisits(true);
    try {
      const mrNumber = patient.mrNumber || patient.mrn || patient.id;
      const patientId = patient.id;
      
      // Try to fetch from external API first (for legacy data)
      let visits = [];
      
      try {
        // Use the new fetchAll parameter to get all visits in one request
        const externalResponse = await fetch(`/api/patients/visits?mrNumber=${mrNumber}&fetchAll=true`);
        if (externalResponse.ok) {
          const externalData = await externalResponse.json();
          
          // Handle different response formats from external API
          if (Array.isArray(externalData)) {
            visits = externalData;
          } else if (externalData.data && Array.isArray(externalData.data)) {
            visits = externalData.data;
          } else if (externalData.visits && Array.isArray(externalData.visits)) {
            visits = externalData.visits;
          } else if (externalData.result && Array.isArray(externalData.result)) {
            visits = externalData.result;
          } else if (externalData.kunjungan && Array.isArray(externalData.kunjungan)) {
            visits = externalData.kunjungan;
          } else if (typeof externalData === 'object' && externalData !== null && !Array.isArray(externalData)) {
            visits = [externalData];
          }
        }
      } catch (externalError) {
        console.error('External API error:', externalError);
      }
      
      // If no visits from external API or patient has ID, try internal API
      if (visits.length === 0 && patientId) {
        try {
          // Fetch all visits without pagination limit
          const internalResponse = await fetch(`/api/patients/${patientId}/visits?limit=1000&page=1`);
          if (internalResponse.ok) {
            const internalData = await internalResponse.json();
            if (internalData.data && Array.isArray(internalData.data)) {
              visits = internalData.data;
            }
          }
        } catch (internalError) {
          console.error('Internal API error:', internalError);
        }
      }
      setVisitHistory(visits);
    } catch (error) {
      console.error('Error fetching visit history:', error);
      setVisitHistory([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    if (activeTab === "visit-history") {
      fetchVisitHistory();
    }
  }, [activeTab, patient.mrNumber, patient.mrn]);

  // Filter visits based on date range
  useEffect(() => {
    if (visitHistory.length > 0) {
      let filtered = visitHistory;
      
      if (dateFilter.startDate || dateFilter.endDate) {
        filtered = visitHistory.filter(visit => {
          const visitDate = new Date(visit.Tgl_Kunjungan);
          const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
          const endDate = dateFilter.endDate ? new Date(dateFilter.endDate + 'T23:59:59') : null;
          
          if (startDate && endDate) {
            return visitDate >= startDate && visitDate <= endDate;
          } else if (startDate) {
            return visitDate >= startDate;
          } else if (endDate) {
            return visitDate <= endDate;
          }
          
          return true;
        });
      }
      
      setFilteredVisits(filtered);
    } else {
      setFilteredVisits([]);
    }
  }, [visitHistory, dateFilter]);

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-t-xl transition-all duration-200 ${
        isActive
          ? "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="mr-2 text-lg" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaUser className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detail Pasien</h2>
              <p className="text-sm text-gray-600">
                {patient.mrNumber || patient.mrn || patient.id} • {patient.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <FaTimes className="text-gray-500 text-xl" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50 flex-shrink-0">
          <TabButton
            id="patient-info"
            icon={FaUser}
            label="Informasi Pasien"
            isActive={activeTab === "patient-info"}
            onClick={() => setActiveTab("patient-info")}
          />
          <TabButton
            id="visit-history"
            icon={FaHistory}
            label="Riwayat Kunjungan"
            isActive={activeTab === "visit-history"}
            onClick={() => setActiveTab("visit-history")}
          />
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "patient-info" && (
            <div className="p-6 space-y-6">
              {/* Patient Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(patient.status)}`}>
                  {patient.status || "Aktif"}
                </span>
              </div>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Personal Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-4">
                    <FaUser className="text-blue-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaIdCard className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">No. RM</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 font-mono">
                        {patient.mrNumber || patient.mrn || patient.id || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUser className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Nama Lengkap</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {patient.name || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaIdCard className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">NIK</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {patient.nik || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <FaCalendarAlt className="text-green-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Demografi</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-1">
                        <FaVenusMars className="text-pink-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-600">Gender</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{patient.gender || "-"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-1">
                        <FaTint className="text-red-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-600">Gol. Darah</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{patient.bloodType || "-"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-1">
                        <FaUserIcon className="text-blue-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-600">Agama</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{patient.religion || "-"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-1">
                        <FaHeartIcon className="text-purple-500 mr-1 text-sm" />
                        <span className="text-xs font-medium text-gray-600">Status</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{patient.maritalStatus || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Birth Information */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center mb-4">
                    <FaCalendarAlt className="text-purple-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Kelahiran</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaCalendarAlt className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Tanggal Lahir</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(patient.birthDate)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaHeart className="text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Umur</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {calculateAge(patient.birthDate)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaMapMarkerAlt className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Tempat Lahir</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.birthPlace || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Address Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center mb-4">
                    <FaPhone className="text-orange-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Kontak</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaPhone className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Telepon</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {patient.phoneNumber || patient.phone || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaEnvelope className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Email</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.email || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Kontak Darurat</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.emergencyContact || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                  <div className="flex items-center mb-4">
                    <FaMapMarkerAlt className="text-indigo-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Alamat</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaHome className="text-indigo-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Alamat Lengkap</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {patient.address || "-"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">RT/RW</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.rtRw || "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">Kode Pos</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.postalCode || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">Provinsi</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.province || patient.provinceName || "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">Kota/Kabupaten</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.city || patient.cityName || "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">Kecamatan</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.district || patient.districtName || "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">Desa/Kelurahan</span>
                        <p className="text-sm font-semibold text-gray-900">{patient.village || patient.villageName || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment & Education Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employment Information */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
                  <div className="flex items-center mb-4">
                    <FaBriefcase className="text-teal-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Pekerjaan</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaIdCard className="text-teal-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">NIP</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {patient.nip || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUser className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Nama Karyawan</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.employeeName || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaBriefcase className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Pekerjaan</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.occupation || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education & Company Information */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                  <div className="flex items-center mb-4">
                    <FaGraduationCap className="text-cyan-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Pendidikan & Perusahaan</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaGraduationCap className="text-cyan-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Pendidikan</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.education || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaBuilding className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Perusahaan</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.company || patient.companyName || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaBuilding className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Departemen</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.department || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUserMd className="text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Posisi</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.position || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center mb-6">
                  <FaShieldAlt className="text-yellow-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Asuransi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaShieldAlt className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Provider</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {patient.insuranceProvider || patient.insurance?.provider || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaIdCard className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Nomor Asuransi</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {patient.insuranceNumber || patient.insurance?.number || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaShieldAlt className="text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Jenis</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {patient.insuranceType || patient.insurance?.type || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Status</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      (patient.insuranceStatus || patient.insurance?.status) === "Aktif" ||
                      (patient.insuranceStatus || patient.insurance?.status) === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {patient.insuranceStatus || patient.insurance?.status || (patient.nip ? "Aktif" : "Tidak Ada")}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Berlaku Hingga</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(patient.insuranceExpiry || patient.insurance?.expiryDate) || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                <div className="flex items-center mb-6">
                  <FaHeartbeat className="text-red-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Medis</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        <span className="font-semibold text-gray-900">Alergi</span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[80px]">
                        <p className="text-gray-800 leading-relaxed">
                          {patient.allergies || "Tidak ada alergi yang diketahui"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <FaStethoscope className="text-blue-500 mr-2" />
                        <span className="font-semibold text-gray-900">Riwayat Penyakit</span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[80px]">
                        <p className="text-gray-800 leading-relaxed">
                          {patient.medicalHistory || "Tidak ada riwayat penyakit"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <FaCapsules className="text-purple-500 mr-2" />
                        <span className="font-semibold text-gray-900">Obat yang Sedang Dikonsumsi</span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[80px]">
                        <p className="text-gray-800 leading-relaxed">
                          {patient.currentMedications || "Tidak ada obat yang dikonsumsi"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <FaClipboardList className="text-green-500 mr-2" />
                        <span className="font-semibold text-gray-900">Catatan Khusus</span>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[80px]">
                        <p className="text-gray-800 leading-relaxed">
                          {patient.notes || "Tidak ada catatan khusus"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center mb-6">
                  <FaClipboardList className="text-gray-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Registrasi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Tanggal Registrasi</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(patient.createdAt || patient.created_at)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Terakhir Diupdate</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(patient.updatedAt || patient.updated_at)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaCheckCircle className="text-emerald-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Status</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(patient.status)}`}>
                      {patient.status || "Aktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "visit-history" && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FaHistory className="mr-3 text-blue-500 text-xl" />
                  Riwayat Kunjungan Berobat
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Daftar kunjungan berobat pasien {patient.name || "-"} (MR: {patient.mrNumber || patient.mrn || "-"})
                </p>
                
                {/* Date Filter */}
                {visitHistory.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-3">
                      <FaCalendarAlt className="mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Filter Pertanggal</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Dari Tanggal
                        </label>
                        <input
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Sampai Tanggal
                        </label>
                        <input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                          Reset Filter
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                            setDateFilter({
                              startDate: lastMonth.toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                            });
                          }}
                          className="px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                          Bulan Ini
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const startOfYear = new Date(today.getFullYear(), 0, 1);
                            setDateFilter({
                              startDate: startOfYear.toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                            });
                          }}
                          className="px-3 py-2 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                        >
                          Tahun Ini
                        </button>
                      </div>
                    </div>
                    {(dateFilter.startDate || dateFilter.endDate) && (
                      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Filter Aktif:</span>
                          <span className="text-blue-600">
                            {filteredVisits.length} dari {visitHistory.length} kunjungan
                          </span>
                        </div>
                        <div className="mt-1">
                          {dateFilter.startDate && `Dari: ${formatDate(dateFilter.startDate)}`}
                          {dateFilter.startDate && dateFilter.endDate && " - "}
                          {dateFilter.endDate && `Sampai: ${formatDate(dateFilter.endDate)}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {visitHistory.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-800 font-medium">
                        📊 Total {filteredVisits.length} kunjungan ditemukan
                      </p>
                      <div className="flex items-center text-xs text-blue-600">
                        <FaCalendarAlt className="mr-1" />
                        Diurutkan: Terbaru → Terlama
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {loadingVisits ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <FaHistory className="w-8 h-8 text-white" />
                  </div>
                  <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                  <p className="text-xl font-medium text-gray-700 mb-2">Memuat Riwayat Kunjungan</p>
                  <p className="text-gray-500">Mengambil data kunjungan terkini...</p>
                </div>
              ) : visitHistory.length > 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No. Kunjungan
                          </th>
                                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 text-blue-500" />
                            Tanggal Kunjungan
                            <span className="ml-1 text-blue-600">↓</span>
                          </div>
                        </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Rawat
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dokter
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Penjamin
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Keluhan
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diagnosa
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVisits.map((visit, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                #{visit.No_Kunjungan || index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(visit.Tgl_Kunjungan)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {visit.Unit_Rawat?.[0]?.Nama_Unit || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {visit.Dokter?.[0]?.Nama_Dokter || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {visit.Penjamin?.[0]?.Nama_Penjamin || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={visit.Rekam_Medis?.[0]?.Subject || "-"}>
                                {visit.Rekam_Medis?.[0]?.Subject || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={visit.Rekam_Medis?.[0]?.Assesment || "-"}>
                                {visit.Rekam_Medis?.[0]?.Assesment || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                                visit.Keluar?.[0]?.Status ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}>
                                {visit.Keluar?.[0]?.Status ? "Selesai" : "Aktif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaHistory className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {visitHistory.length > 0 ? "Tidak Ada Kunjungan dalam Rentang Tanggal" : "Tidak Ada Riwayat Kunjungan"}
                  </h4>
                  <p className="text-gray-500">
                    {visitHistory.length > 0 
                      ? "Coba ubah filter tanggal untuk melihat kunjungan lainnya" 
                      : "Pasien belum memiliki riwayat kunjungan berobat"
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Always Visible */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Tutup
          </button>
          <button
            onClick={() => window.open(`/patients/${patient.id}/edit`, "_blank")}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium flex items-center"
          >
            <FaEdit className="mr-2" />
            Edit Pasien
          </button>
          <button
            onClick={() => window.open(`/visits?patientId=${patient.id}`, "_blank")}
            className="px-6 py-3 bg-[#E22345] text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium flex items-center"
          >
            <FaPlus className="mr-2" />
            Tambah Kunjungan
          </button>
        </div>
      </div>
    </div>
  );
}
