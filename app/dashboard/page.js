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
        <h1 className="text-2xl text-black font-bold mb-6">Dashboard</h1>

        {/* Statistik Kunjungan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Kunjungan Hari Ini</p>
                <h3 className="text-2xl font-bold text-black mt-1">
                  {stats.dailyVisits}
                </h3>
              </div>
              <span className="text-3xl">👥</span>
            </div>
            <div className="mt-4">
              <p className="text-[#E22345] text-sm">+5 dari jam sebelumnya</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Kunjungan Bulan Ini</p>
                <h3 className="text-2xl font-bold text-black mt-1">
                  {stats.monthlyVisits}
                </h3>
              </div>
              <span className="text-3xl">📊</span>
            </div>
            <div className="mt-4">
              <p className="text-green-600 text-sm">+12% dari bulan lalu</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Nomor Antrian Saat Ini</p>
                <h3 className="text-2xl font-bold text-[#2d4acc] mt-1">
                  {stats.currentQueue}
                </h3>
              </div>
              <span className="text-3xl">🎫</span>
            </div>
            <div className="mt-4">
              <p className="text-black text-sm">
                Total: {stats.totalQueueToday} antrian
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Estimasi Waktu Tunggu</p>
                <h3 className="text-2xl font-bold text-black mt-1">~25</h3>
              </div>
              <span className="text-3xl">⏱️</span>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">menit</p>
            </div>
          </div>
        </div>

        {/* Status Ruang Dokter */}
        <h2 className="text-xl text-black font-bold mb-4">
          Status Ruang Dokter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {doctorRooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-black">
                  {room.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    room.status === "Terisi"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {room.status}
                </span>
              </div>

              {room.status === "Terisi" ? (
                <>
                  <div className="mb-4">
                    <p className="text-gray-600">Dokter</p>
                    <p className="text-black font-medium">{room.doctor}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600">Pasien Saat Ini</p>
                    <p className="text-black font-medium">
                      {room.currentPatient}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estimasi Waktu</p>
                    <p className="text-black font-medium">
                      {room.estimatedTime}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">
                  Ruangan tersedia untuk digunakan
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Grafik atau Informasi Tambahan bisa ditambahkan di sini */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl text-black font-bold mb-4">
            Antrian Berikutnya
          </h2>
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
      </div>
    </DashboardLayout>
  );
}
