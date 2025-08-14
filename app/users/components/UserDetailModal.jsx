"use client";

import { useState } from "react";
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
  FaUserCheck,
  FaUserTimes,
  FaKey,
  FaLock,
  FaUnlock,
  FaCog,
  FaServer,
  FaDatabase,
  FaNetworkWired,
  FaUserShield,
  FaUserTie,
  FaUserCog,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
  FaUserClock,
  FaUserGraduate,
  FaUserInjured,
  FaUserNurse,
  FaUserSecret,
  FaUserAstronaut,
  FaUserNinja,
} from "react-icons/fa";

export default function UserDetailModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState("user-info");

  if (!user) return null;

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

  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getRoleBadge = (role) => {
    const colors = {
      SUPERADMIN: "bg-yellow-100 text-yellow-800",
      ADMIN: "bg-red-100 text-red-800",
      DOCTOR: "bg-blue-100 text-blue-800",
      STAFF: "bg-green-100 text-green-800"
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FaUserCheck className="h-3 w-3 mr-1" />
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <FaUserTimes className="h-3 w-3 mr-1" />
        Tidak Aktif
      </span>
    );
  };

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaUser className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detail Pengguna</h2>
              <p className="text-sm text-gray-600">
                {user.id} • {user.name}
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
            id="user-info"
            icon={FaUser}
            label="Informasi Pengguna"
            isActive={activeTab === "user-info"}
            onClick={() => setActiveTab("user-info")}
          />
          <TabButton
            id="system-info"
            icon={FaServer}
            label="Informasi Sistem"
            isActive={activeTab === "system-info"}
            onClick={() => setActiveTab("system-info")}
          />
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "user-info" && (
            <div className="p-6 space-y-6">
              {/* User Status Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(user.is_active)}`}>
                  {user.is_active ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <span className="text-sm font-medium text-gray-600">ID Pengguna</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 font-mono">
                        {user.id || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUser className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Nama Lengkap</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {user.name || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaEnvelope className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Email</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {user.email || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <FaPhone className="text-green-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Kontak</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaPhone className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Telepon</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {user.phone || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaEnvelope className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Email</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.email || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Kontak Darurat</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.emergency_contact || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role & Status Information */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center mb-4">
                    <FaShieldAlt className="text-purple-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Role & Status</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUserShield className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Role</span>
                      </div>
                      <div className="flex items-center">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUserCheck className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Status</span>
                      </div>
                      <div className="flex items-center">
                        {getStatusBadge(user.is_active)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaCalendarAlt className="text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Bergabung Sejak</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinic & Work Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clinic Information */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center mb-4">
                    <FaBuilding className="text-orange-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Klinik</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaBuilding className="text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Nama Klinik</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.clinic_name || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaMapMarkerAlt className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Lokasi</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.clinic_address || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaPhone className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Telepon Klinik</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.clinic_phone || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
                  <div className="flex items-center mb-4">
                    <FaBriefcase className="text-teal-600 mr-3 text-xl" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Pekerjaan</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaUserTie className="text-teal-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Jabatan</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.position || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaBriefcase className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Departemen</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.department || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaGraduationCap className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Pendidikan</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.education || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                <div className="flex items-center mb-6">
                  <FaClipboardList className="text-cyan-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Tambahan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaCalendarAlt className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Tanggal Lahir</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(user.birth_date) || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaVenusMars className="text-pink-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Jenis Kelamin</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.gender || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaMapMarkerAlt className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Alamat</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {user.address || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaIdCard className="text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">NIK</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {user.nik || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaPhone className="text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">No. HP</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {user.phone || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaUserClock className="text-indigo-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Terakhir Login</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(user.last_login) || "-"}
                    </p>
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
                      {formatDateTime(user.created_at)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Terakhir Diupdate</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(user.updated_at)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaCheckCircle className="text-emerald-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Status</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(user.is_active)}`}>
                      {user.is_active ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "system-info" && (
            <div className="p-6 space-y-6">
              {/* System Information */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                <div className="flex items-center mb-6">
                  <FaServer className="text-indigo-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Informasi Sistem</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaDatabase className="text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">User ID</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      {user.id || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaKey className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Role</span>
                    </div>
                    <div className="flex items-center">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaUserCheck className="text-emerald-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Status</span>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(user.is_active)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Terakhir Login</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(user.last_login) || "Belum pernah login"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaNetworkWired className="text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">IP Address</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">
                      {user.last_ip || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaServer className="text-indigo-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">User Agent</span>
                    </div>
                    <p className="text-xs text-gray-600 font-mono truncate">
                      {user.user_agent || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions Information */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center mb-6">
                  <FaShieldAlt className="text-yellow-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Hak Akses & Permissions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Permissions Berdasarkan Role</h4>
                    <div className="space-y-3">
                      {user.role === 'SUPERADMIN' && (
                        <>
                          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <FaUserShield className="text-green-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Full System Access</span>
                          </div>
                          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <FaUserCog className="text-green-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">User Management</span>
                          </div>
                          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <FaServer className="text-green-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">System Configuration</span>
                          </div>
                        </>
                      )}
                      {user.role === 'ADMIN' && (
                        <>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <FaUserEdit className="text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">User Management</span>
                          </div>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <FaDatabase className="text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Data Management</span>
                          </div>
                        </>
                      )}
                      {user.role === 'DOCTOR' && (
                        <>
                          <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <FaUserMd className="text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Patient Management</span>
                          </div>
                          <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <FaStethoscope className="text-purple-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Medical Records</span>
                          </div>
                        </>
                      )}
                      {user.role === 'STAFF' && (
                        <>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <FaUserNurse className="text-gray-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Basic Operations</span>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <FaClipboardList className="text-gray-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Data Entry</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Status Aktivitas</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Status Akun</span>
                        {getStatusBadge(user.is_active)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Email Verified</span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          user.email_verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.email_verified ? "Verified" : "Not Verified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Two Factor Auth</span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          user.two_factor_enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.two_factor_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center mb-6">
                  <FaHistory className="text-gray-600 mr-3 text-xl" />
                  <h3 className="text-xl font-semibold text-gray-900">Aktivitas Terakhir</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaClock className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Login Terakhir</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(user.last_login)}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {user.last_login ? "Pengguna terakhir login ke sistem" : "Belum ada aktivitas login"}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaEdit className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Update Terakhir</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(user.updated_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Profil terakhir diperbarui
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaUserPlus className="text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Registrasi</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(user.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Akun pertama kali dibuat dalam sistem
                    </p>
                  </div>
                </div>
              </div>
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
            onClick={() => {
              // Handle edit user
              onClose();
              // You can add edit functionality here
            }}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium flex items-center"
          >
            <FaEdit className="mr-2" />
            Edit Pengguna
          </button>
          <button
            onClick={() => {
              // Handle reset password
              onClose();
              // You can add reset password functionality here
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center"
          >
            <FaKey className="mr-2" />
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
} 