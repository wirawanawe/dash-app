"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Crown, 
  ShieldCheck, 
  User, 
  GraduationCap,
  CheckCircle,
  XCircle,
  Info,
  Users,
  Settings,
  Building,
  Smartphone,
  MessageSquare,
  FileText,
  Database,
  FlaskConical
} from "lucide-react";

export default function RoleInfoPage() {
  const [selectedRole, setSelectedRole] = useState("SUPERADMIN");

  const roles = [
    {
      value: "SUPERADMIN",
      label: "Superadmin",
      icon: Crown,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100",
      description: "Akses penuh ke semua fitur sistem",
      permissions: {
        dashboard: true,
        visits: true,
        examinations: true,
        chat: true,
        patients: true,
        doctors: true,
        clinics: true,
        mobile: true,
        users: true,
        settings: true,
        roleManagement: true,
        laboratory: true,
        pharmacy: false
      },
      features: [
        "Membuat Superadmin lain",
        "Memberikan akses untuk semua role",
        "Akses ke semua klinik",
        "Mengelola role dan permissions",
        "Akses penuh ke semua fitur"
      ]
    },
    {
      value: "ADMIN",
      label: "Admin",
      icon: ShieldCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      description: "Admin untuk klinik tertentu",
      permissions: {
        dashboard: true,
        visits: true,
        examinations: false,
        chat: false,
        patients: true,
        doctors: true,
        clinics: true,
        mobile: true,
        users: true,
        settings: true,
        roleManagement: false,
        laboratory: true,
        pharmacy: false
      },
      features: [
        "Hanya melihat user dengan role admin ke bawah",
        "Hanya dapat menambah user admin ke bawah",
        "Tidak bisa memberikan akses untuk role yang lain",
        "Hanya berlaku untuk admin di klinik tertentu"
      ]
    },
    {
      value: "DOCTOR",
      label: "Dokter",
      icon: User,
      color: "text-green-500",
      bgColor: "bg-green-100",
      description: "Dokter dengan akses terbatas",
      permissions: {
        dashboard: true,
        visits: true,
        examinations: true,
        chat: true,
        patients: false,
        doctors: false,
        clinics: false,
        mobile: false,
        users: false,
        settings: false,
        roleManagement: false,
        laboratory: true,
        pharmacy: false
      },
      features: [
        "Hanya melihat data riwayat kunjungan pasien yang berobat ke dokter itu saja",
        "Hanya dapat mengakses fitur chat untuk membalas konsultasi",
        "Akses ke pemeriksaan dan hasil laboratorium",
        "Tidak dapat mengelola user atau settings"
      ]
    },
    {
      value: "STAFF",
      label: "Staff",
      icon: GraduationCap,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      description: "Staff dengan akses minimal",
      permissions: {
        dashboard: true,
        visits: true,
        examinations: false,
        chat: false,
        patients: true,
        doctors: false,
        clinics: false,
        mobile: false,
        users: false,
        settings: false,
        roleManagement: false,
        laboratory: false,
        pharmacy: false
      },
      features: [
        "Hanya dapat melihat informasi riwayat kunjungan data pasien",
        "Akses terbatas untuk klinik tertentu sesuai login",
        "Tidak dapat mengelola user, settings, atau fitur medis"
      ]
    }
  ];

  const features = [
    { name: "Dashboard", icon: Database },
    { name: "Kunjungan", icon: FileText },
    { name: "Pemeriksaan", icon: User },
    { name: "Chat Konsultasi", icon: MessageSquare },
    { name: "Pasien", icon: Users },
    { name: "Dokter", icon: User },
    { name: "Klinik", icon: Building },
    { name: "Mobile App", icon: Smartphone },
    { name: "Pengguna", icon: Users },
    { name: "Settings", icon: Settings },
    { name: "Role Management", icon: ShieldCheck },
    { name: "Laboratorium", icon: FlaskConical }
  ];

  const selectedRoleData = roles.find(role => role.value === selectedRole);

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-center mb-4">
            <ShieldCheck className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">Role & Permissions</h1>
          </div>
          <p className="text-lg opacity-90">
            Hierarki role dan akses pengguna sistem PHC
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedRole === role.value
                  ? `${role.bgColor} border-${role.color.replace('text-', '')} shadow-lg`
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center mb-3">
                <role.icon className={`w-6 h-6 mr-3 ${role.color}`} />
                <h3 className="font-semibold text-gray-900">{role.label}</h3>
              </div>
              <p className="text-sm text-gray-600">{role.description}</p>
            </button>
          ))}
        </div>

        {/* Role Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Permissions Matrix */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Matrix Permissions
            </h2>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <feature.icon className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                  </div>
                  <div className="flex items-center">
                    {selectedRoleData.permissions[feature.name.toLowerCase().replace(/\s+/g, '')] ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Features */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" />
              Fitur & Kemampuan
            </h2>
            <div className="space-y-4">
              {selectedRoleData.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Hierarchy */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Hierarki Role</h2>
          <div className="flex items-center justify-center space-x-8">
            {roles.map((role, index) => (
              <div key={role.value} className="flex flex-col items-center">
                <div className={`w-16 h-16 ${role.bgColor} rounded-full flex items-center justify-center mb-3`}>
                  <role.icon className={`w-8 h-8 ${role.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{role.label}</h3>
                <p className="text-xs text-gray-500 text-center mt-1">{role.description}</p>
                {index < roles.length - 1 && (
                  <div className="w-16 h-0.5 bg-gray-300 mt-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Access Control Rules */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Aturan Akses Kontrol</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Superadmin</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Bisa membuka semua page</li>
                <li>• Bisa membuat Superadmin lain</li>
                <li>• Bisa memberikan akses untuk role2 yang lainnya</li>
                <li>• Bisa akses untuk semua klinik</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Admin</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Hanya bisa melihat user dengan role admin ke bawah</li>
                <li>• Hanya dapat menambah user admin ke bawah</li>
                <li>• Tidak bisa memberikan akses untuk role yg lain</li>
                <li>• Hanya berlaku untuk admin di klinik tertentu saja</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Dokter</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Hanya melihat data riwayat kunjungan Pasien yang berobat ke dokter itu saja</li>
                <li>• Hanya dapat mengakses fitur chat untuk membalas konsultasi</li>
                <li>• Selebihnya tidak bisa</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Staff</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Hanya dapat melihat informasi Riwayat Kunjungan data Pasien</li>
                <li>• Untuk klinik tertentu sesuai loginnya</li>
                <li>• Akses minimal dan terbatas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 