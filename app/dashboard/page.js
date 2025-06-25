"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  // Data dummy untuk statistik
  const stats = {
    dailyVisits: 24,
    monthlyVisits: 543,
    currentQueue: 12,
    totalQueueToday: 30,
  };

  // Data dummy untuk ruang dokter
  const doctorRooms = [
    {
      id: 1,
      name: "Ruang Dokter 1",
      doctor: "Dr. Surya Atmaja",
      status: "Terisi", // Terisi atau Kosong
      currentPatient: "Ahmad Yani",
      estimatedTime: "10:30 - 10:45",
    },
    {
      id: 2,
      name: "Ruang Dokter 2",
      doctor: null,
      status: "Kosong",
      currentPatient: null,
      estimatedTime: null,
    },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <h1 className="text-xl lg:text-2xl text-black font-bold mb-4 lg:mb-6">
          Dashboard
        </h1>

        {/* Statistik Kunjungan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-md p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs lg:text-sm">
                  Kunjungan Hari Ini
                </p>
                <h3 className="text-lg lg:text-2xl font-bold text-black mt-1">
                  {stats.dailyVisits}
                </h3>
              </div>
              <span className="text-xl lg:text-3xl">👥</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-[#E22345] text-xs lg:text-sm">
                +5 dari jam sebelumnya
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs lg:text-sm">
                  Kunjungan Bulan Ini
                </p>
                <h3 className="text-lg lg:text-2xl font-bold text-black mt-1">
                  {stats.monthlyVisits}
                </h3>
              </div>
              <span className="text-xl lg:text-3xl">📊</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-green-600 text-xs lg:text-sm">
                +12% dari bulan lalu
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs lg:text-sm">
                  Nomor Antrian Saat Ini
                </p>
                <h3 className="text-lg lg:text-2xl font-bold text-[#2d4acc] mt-1">
                  {stats.currentQueue}
                </h3>
              </div>
              <span className="text-xl lg:text-3xl">🎫</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-black text-xs lg:text-sm">
                Total: {stats.totalQueueToday} antrian
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs lg:text-sm">
                  Estimasi Waktu Tunggu
                </p>
                <h3 className="text-lg lg:text-2xl font-bold text-black mt-1">
                  ~25
                </h3>
              </div>
              <span className="text-xl lg:text-3xl">⏱️</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-gray-600 text-xs lg:text-sm">menit</p>
            </div>
          </div>
        </div>

        {/* Status Ruang Dokter */}
        <h2 className="text-lg lg:text-xl text-black font-bold mb-3 lg:mb-4">
          Status Ruang Dokter
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {doctorRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md p-4 lg:p-6"
            >
              <div className="flex justify-between items-start mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-black">
                  {room.name}
                </h3>
                <span
                  className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm ${
                    room.status === "Terisi"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {room.status}
                </span>
              </div>

              {room.status === "Terisi" ? (
                <div className="space-y-2 lg:space-y-3">
                  <div>
                    <p className="text-gray-600 text-xs lg:text-sm">Dokter</p>
                    <p className="text-black font-medium text-sm lg:text-base">
                      {room.doctor}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs lg:text-sm">
                      Pasien Saat Ini
                    </p>
                    <p className="text-black font-medium text-sm lg:text-base">
                      {room.currentPatient}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs lg:text-sm">
                      Estimasi Waktu
                    </p>
                    <p className="text-black font-medium text-sm lg:text-base">
                      {room.estimatedTime}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm lg:text-base">
                  Ruangan tersedia untuk digunakan
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Antrian Berikutnya */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl text-black font-bold mb-3 lg:mb-4">
            Antrian Berikutnya
          </h2>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      No. Antrian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Nama Pasien
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Estimasi Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-black">13</td>
                    <td className="px-6 py-4 text-black">Budi Santoso</td>
                    <td className="px-6 py-4 text-black">10:45 - 11:00</td>
                    <td className="px-6 py-4">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Menunggu
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-black">14</td>
                    <td className="px-6 py-4 text-black">Siti Aminah</td>
                    <td className="px-6 py-4 text-black">11:00 - 11:15</td>
                    <td className="px-6 py-4">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Dalam Antrian
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-black">13</span>
                  <span className="text-sm font-medium text-black">
                    Budi Santoso
                  </span>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Menunggu
                </span>
              </div>
              <p className="text-xs text-gray-600">Estimasi: 10:45 - 11:00</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-black">14</span>
                  <span className="text-sm font-medium text-black">
                    Siti Aminah
                  </span>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Dalam Antrian
                </span>
              </div>
              <p className="text-xs text-gray-600">Estimasi: 11:00 - 11:15</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
