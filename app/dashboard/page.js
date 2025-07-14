"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const [stats, setStats] = useState({
    dailyVisits: 0,
    monthlyVisits: 0,
    activeVisits: 0,
    totalVisitsToday: 0,
    avgWaitTime: 0,
  });
  const [doctorRooms, setDoctorRooms] = useState([]);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      // Get this month's date range
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStart = startOfMonth.toISOString().split("T")[0];
      const monthEnd = endOfMonth.toISOString().split("T")[0];

      // Fetch visits data for different time periods
      const [todayVisits, monthlyVisits, activeVisits] = await Promise.all([
        fetchVisits({ searchDate: todayString, limit: 100 }),
        fetchVisits({ tglawal: monthStart, tglakhir: monthEnd, limit: 1000 }),
        fetchVisits({ status: "Aktif", limit: 100 }),
      ]);

      // Calculate statistics
      const dailyVisitsCount = todayVisits.data?.length || 0;
      const monthlyVisitsCount = monthlyVisits.data?.length || 0;
      const activeVisitsCount = activeVisits.data?.length || 0;

      // Get total visits today (including completed)
      const totalVisitsToday = todayVisits.data?.length || 0;

      // Calculate average wait time (estimated based on active visits)
      const avgWaitTime =
        activeVisitsCount > 0 ? Math.ceil(activeVisitsCount * 15) : 0;

      setStats({
        dailyVisits: dailyVisitsCount,
        monthlyVisits: monthlyVisitsCount,
        activeVisits: activeVisitsCount,
        totalVisitsToday,
        avgWaitTime,
      });

      // Process doctor rooms from active visits
      const rooms = processDoctorRooms(activeVisits.data || []);
      setDoctorRooms(rooms);

      // Process upcoming queue from active visits
      const queue = processUpcomingQueue(activeVisits.data || []);
      setUpcomingQueue(queue);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`/api/visits?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch visits: ${response.status}`);
    }
    return response.json();
  };

  const processDoctorRooms = (visits) => {
    const roomMap = new Map();

    visits.forEach((visit) => {
      if (!visit.room || visit.room === "-") return;

      const roomKey = visit.room;
      if (!roomMap.has(roomKey)) {
        roomMap.set(roomKey, {
          id: roomKey,
          name: visit.room,
          doctor: visit.doctor?.name || "Dokter tidak diketahui",
          status: "Terisi",
          currentPatient: visit.patient?.name || "Pasien tidak diketahui",
          estimatedTime: getEstimatedTime(visit),
          visitId: visit.id,
        });
      }
    });

    // Add some empty rooms for demonstration
    const rooms = Array.from(roomMap.values());

    // Add empty rooms if less than 4 rooms are occupied
    const totalRooms = Math.max(4, rooms.length);
    for (let i = rooms.length; i < totalRooms; i++) {
      rooms.push({
        id: `empty-${i}`,
        name: `Ruang Dokter ${i + 1}`,
        doctor: null,
        status: "Kosong",
        currentPatient: null,
        estimatedTime: null,
        visitId: null,
      });
    }

    return rooms;
  };

  const processUpcomingQueue = (visits) => {
    return visits
      .filter((visit) => visit.status === "Aktif")
      .sort((a, b) => {
        // Sort by visit date/creation time
        const aTime = new Date(a.visitDate || a.createdAt).getTime();
        const bTime = new Date(b.visitDate || b.createdAt).getTime();
        return aTime - bTime;
      })
      .slice(0, 10)
      .map((visit, index) => ({
        id: visit.id,
        queueNumber: index + 1,
        patientName: visit.patient?.name || "Pasien tidak diketahui",
        estimatedTime: getEstimatedTime(visit, index),
        status: index === 0 ? "Sedang Dilayani" : "Menunggu",
        visitId: visit.id,
      }));
  };

  const getEstimatedTime = (visit, queueIndex = 0) => {
    const now = new Date();
    const baseMinutes = 15; // 15 minutes per patient
    const startTime = new Date(
      now.getTime() + queueIndex * baseMinutes * 60000
    );
    const endTime = new Date(startTime.getTime() + baseMinutes * 60000);

    const formatTime = (date) => {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d4acc] mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto">
          <div className="text-center py-8">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-[#2d4acc] text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl text-black font-bold">
            Dashboard
          </h1>
          <button
            onClick={fetchDashboardData}
            className="bg-[#2d4acc] text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {/* Statistik Kunjungan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">
                  Kunjungan Hari Ini
                </p>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mt-1">
                  {stats.dailyVisits}
                </h3>
              </div>
              <span className="text-xl md:text-2xl lg:text-3xl">👥</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-gray-600 text-xs md:text-sm">
                Total kunjungan: {stats.totalVisitsToday}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">
                  Kunjungan Bulan Ini
                </p>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mt-1">
                  {stats.monthlyVisits}
                </h3>
              </div>
              <span className="text-xl md:text-2xl lg:text-3xl">📊</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-green-600 text-xs md:text-sm">
                Bulan{" "}
                {new Date().toLocaleDateString("id-ID", { month: "long" })}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">
                  Kunjungan Aktif
                </p>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-[#2d4acc] mt-1">
                  {stats.activeVisits}
                </h3>
              </div>
              <span className="text-xl md:text-2xl lg:text-3xl">🎫</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-black text-xs md:text-sm">
                Sedang berlangsung
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">
                  Est. Waktu Tunggu
                </p>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black mt-1">
                  ~{stats.avgWaitTime}
                </h3>
              </div>
              <span className="text-xl md:text-2xl lg:text-3xl">⏱️</span>
            </div>
            <div className="mt-2 lg:mt-4">
              <p className="text-gray-600 text-xs md:text-sm">menit</p>
            </div>
          </div>
        </div>

        {/* Status Ruang Dokter */}
        <h2 className="text-lg lg:text-xl text-black font-bold mb-3 lg:mb-4">
          Status Ruang Dokter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {doctorRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md p-4 md:p-5 lg:p-6"
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
            Antrian Kunjungan Aktif
          </h2>

          {upcomingQueue.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada antrian kunjungan aktif</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Large screens only */}
              <div className="hidden xl:block">
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
                      {upcomingQueue.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-black font-medium">
                            {item.queueNumber}
                          </td>
                          <td className="px-6 py-4 text-black">
                            {item.patientName}
                          </td>
                          <td className="px-6 py-4 text-black text-sm">
                            {item.estimatedTime}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === "Sedang Dilayani"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tablet Table View - Medium to Large screens */}
              <div className="hidden md:block xl:hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">
                          No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">
                          Pasien
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">
                          Waktu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {upcomingQueue.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-black font-bold text-lg">
                            {item.queueNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-black font-medium text-sm">
                              {item.patientName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-black text-xs">
                              {item.estimatedTime}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === "Sedang Dilayani"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View - Small screens */}
              <div className="md:hidden space-y-3">
                {upcomingQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-[#2d4acc] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          {item.queueNumber}
                        </div>
                        <div>
                          <h4 className="text-black font-semibold text-sm">
                            {item.patientName}
                          </h4>
                          <p className="text-gray-600 text-xs mt-1">
                            Estimasi: {item.estimatedTime}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          item.status === "Sedang Dilayani"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Progress indicator for mobile */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.status === "Sedang Dilayani"
                              ? "bg-green-500 w-full"
                              : "bg-yellow-500 w-1/3"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.status === "Sedang Dilayani"
                          ? "Sedang proses"
                          : "Menunggu"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
