"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import ApiDocumentation from "@/components/ApiDocumentation";
import { 
  User, 
  Building2, 
  Shield, 
  Stethoscope, 
  Pill, 
  FileText, 
  Settings, 
  Database,
  ChevronRight,
  Users,
  Hospital,
  Briefcase,
  Activity,
  Clock,
  Info
} from "lucide-react";

export default function SettingsPage() {
  const masterDataItems = [
    {
      title: "Master Dokter",
      description: "Kelola data dokter dan jadwal praktik",
      icon: <Stethoscope className="h-6 w-6" />,
      path: "/settings/doctors",
      color: "bg-blue-100 text-blue-600",
      gradient: "from-blue-500 to-blue-600",
      count: "24 Dokter"
    },
    {
      title: "Master Asuransi",
      description: "Kelola daftar asuransi dan ketentuan",
      icon: <Shield className="h-6 w-6" />,
      path: "/settings/insurance",
      color: "bg-green-100 text-green-600",
      gradient: "from-green-500 to-green-600",
      count: "12 Asuransi"
    },
    {
      title: "Master Perusahaan",
      description: "Kelola data perusahaan rekanan",
      icon: <Briefcase className="h-6 w-6" />,
      path: "/settings/companies",
      color: "bg-purple-100 text-purple-600",
      gradient: "from-purple-500 to-purple-600",
      count: "8 Perusahaan"
    },
    {
      title: "Master User",
      description: "Kelola pengguna dan hak akses",
      icon: <Users className="h-6 w-6" />,
      path: "/settings/users",
      color: "bg-orange-100 text-orange-600",
      gradient: "from-orange-500 to-orange-600",
      count: "156 Users"
    },
    {
      title: "Master Tindakan",
      description: "Kelola jenis tindakan medis",
      icon: <Activity className="h-6 w-6" />,
      path: "/settings/treatments",
      color: "bg-red-100 text-red-600",
      gradient: "from-red-500 to-red-600",
      count: "89 Tindakan"
    },
    {
      title: "Master ICD",
      description: "Kelola kode diagnosis ICD-10",
      icon: <FileText className="h-6 w-6" />,
      path: "/settings/icd",
      color: "bg-indigo-100 text-indigo-600",
      gradient: "from-indigo-500 to-indigo-600",
      count: "1,247 Kode"
    },
    {
      title: "Master Poli",
      description: "Kelola unit pelayanan/poliklinik",
      icon: <Hospital className="h-6 w-6" />,
      path: "/settings/polyclinics",
      color: "bg-teal-100 text-teal-600",
      gradient: "from-teal-500 to-teal-600",
      count: "15 Poli"
    },
  ];

  const systemInfo = [
    {
      label: "Versi Sistem",
      value: "v2.1.0",
      icon: <Info className="h-4 w-4" />
    },
    {
      label: "Terakhir Update",
      value: "15 Desember 2024",
      icon: <Clock className="h-4 w-4" />
    },
    {
      label: "Database",
      value: "MySQL 8.0",
      icon: <Database className="h-4 w-4" />
    },
    {
      label: "Framework",
      value: "Next.js 14",
      icon: <Settings className="h-4 w-4" />
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan Master Data</h1>
              <p className="text-gray-600">Kelola semua data master untuk sistem PHC</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Settings className="h-4 w-4" />
              <span>System Configuration</span>
            </div>
          </div>
        </div>

        {/* Master Data Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Master Data Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {masterDataItems.map((item, index) => (
              <Link
                href={item.path}
                key={index}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                    Kelola
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Information */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Sistem</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemInfo.map((info, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <div className="text-blue-600">
                      {info.icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{info.label}</p>
                    <p className="text-gray-900 font-semibold">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold">Backup Database</p>
                  <p className="text-blue-100 text-sm">Create system backup</p>
                </div>
              </div>
            </button>
            
            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold">System Settings</p>
                  <p className="text-green-100 text-sm">Configure preferences</p>
                </div>
              </div>
            </button>
            
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 shadow-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold">User Management</p>
                  <p className="text-purple-100 text-sm">Manage user access</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="font-semibold text-gray-900">System Online</h3>
                <p className="text-green-600 text-sm">All services running</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-blue-600 text-sm">Connected & Healthy</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Uptime</h3>
                <p className="text-orange-600 text-sm">99.9% (30 days)</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <ApiDocumentation pageType="settings" />
      </div>
    </DashboardLayout>
  );
}
