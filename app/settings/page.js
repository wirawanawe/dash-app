"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

export default function SettingsPage() {
  const masterDataItems = [
    {
      title: "Master Dokter",
      description: "Kelola data dokter dan jadwal praktik",
      icon: "👨‍⚕️",
      path: "/settings/doctors",
    },
    {
      title: "Master Asuransi",
      description: "Kelola daftar asuransi dan ketentuan",
      icon: "🏥",
      path: "/settings/insurance",
    },
    {
      title: "Master Perusahaan",
      description: "Kelola data perusahaan rekanan",
      icon: "🏢",
      path: "/settings/companies",
    },
    {
      title: "Master User",
      description: "Kelola pengguna dan hak akses",
      icon: "👥",
      path: "/settings/users",
    },
    {
      title: "Master Tindakan",
      description: "Kelola jenis tindakan medis",
      icon: "💉",
      path: "/settings/treatments",
    },
    {
      title: "Master ICD",
      description: "Kelola kode diagnosis ICD-10",
      icon: "🏥",
      path: "/settings/icd",
    },
    {
      title: "Master Poli",
      description: "Kelola unit pelayanan/poliklinik",
      icon: "🏥",
      path: "/settings/polyclinics",
    },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl text-black font-bold">
            Pengaturan Master Data
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola semua data master untuk sistem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masterDataItems.map((item, index) => (
            <Link
              href={item.path}
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <span className="text-3xl mr-4">{item.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-[#E22345] text-sm">Kelola →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* System Info */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl text-black font-semibold mb-4">
            Informasi Sistem
          </h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600">Versi Sistem</p>
                <p className="text-black font-medium">v1.0.0</p>
              </div>
              <div>
                <p className="text-gray-600">Terakhir Update</p>
                <p className="text-black font-medium">20 Feb 2024</p>
              </div>
              <div>
                <p className="text-gray-600">Status Server</p>
                <p className="text-green-600 font-medium">● Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
