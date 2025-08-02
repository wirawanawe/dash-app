"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaUsers, FaCalendarAlt, FaClock, FaUserMd, FaHospital, FaChartLine } from "react-icons/fa";
import { 
  TrendingUp, 
  Activity, 
  Heart, 
  Timer, 
  Stethoscope, 
  Users, 
  Calendar,
  BarChart3,
  Zap,
  RefreshCw,
  ChevronRight,
  Star
} from 'lucide-react';


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
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    setIsLoaded(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics from API
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        } else {
          throw new Error(statsData.message || 'Failed to fetch stats');
        }
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }

      // Fetch visits data for rooms and queue
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      const activeVisits = await fetchVisits({ status: "Aktif", limit: 100 });

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

          // Get all available rooms from database via API
      try {
        const roomsResponse = await fetch('/api/dashboard/rooms');
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          const availableRooms = roomsData.data || [];
          
          // Map occupied rooms
          const rooms = Array.from(roomMap.values());
          
          // Add available rooms that are not occupied
          availableRooms.forEach((room, index) => {
            const isOccupied = rooms.some(occupiedRoom => 
              occupiedRoom.name === room.room_name
            );
            
            if (!isOccupied) {
              rooms.push({
                id: `room-${index}`,
                name: room.room_name,
                doctor: null,
                status: room.room_status || "Kosong",
                currentPatient: null,
                estimatedTime: null,
                visitId: null,
              });
            }
          });
          
          // If no rooms in database, add default rooms
          if (rooms.length === 0) {
            for (let i = 0; i < 4; i++) {
              rooms.push({
                id: `default-${i}`,
                name: `Ruang Dokter ${i + 1}`,
                doctor: null,
                status: "Kosong",
                currentPatient: null,
                estimatedTime: null,
                visitId: null,
              });
            }
          }
        } else {
          throw new Error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        // Fallback to basic room structure
        const rooms = Array.from(roomMap.values());
        const totalRooms = Math.max(4, rooms.length);
        for (let i = rooms.length; i < totalRooms; i++) {
          rooms.push({
            id: `fallback-${i}`,
            name: `Ruang Dokter ${i + 1}`,
            doctor: null,
            status: "Kosong",
            currentPatient: null,
            estimatedTime: null,
            visitId: null,
          });
        }
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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
            <p className="text-xl font-medium text-gray-700 mb-2">Memuat Dashboard</p>
            <p className="text-gray-500">Mengambil data terkini untuk Anda...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Oops! Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Coba Lagi
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Dashboard PHC
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
                Selamat Datang di{" "}
                <span className="text-yellow-300">Dashboard</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl">
                Pantau aktivitas klinik dan kelola data pasien dengan mudah dalam satu dashboard terpadu
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <button
                onClick={fetchDashboardData}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
                          <div className="flex items-center text-sm font-medium text-emerald-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.trends?.dailyChange > 0 ? `+${stats.trends.dailyChange}%` : '0%'}
            </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.dailyVisits}
              </p>
              <p className="text-sm text-gray-600 font-medium">Kunjungan Hari Ini</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {stats.totalVisitsToday} kunjungan
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
                          <div className="flex items-center text-sm font-medium text-emerald-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.trends?.monthlyChange > 0 ? `+${stats.trends.monthlyChange}%` : '0%'}
            </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.monthlyVisits}
              </p>
              <p className="text-sm text-gray-600 font-medium">Kunjungan Bulan Ini</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Live
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {stats.activeVisits}
              </p>
              <p className="text-sm text-gray-600 font-medium">Kunjungan Aktif</p>
              <p className="text-xs text-gray-600 mt-1">
                Sedang berlangsung
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-orange-600">
                <Heart className="w-4 h-4 mr-1" />
                Est.
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                ~{stats.avgWaitTime}
              </p>
              <p className="text-sm text-gray-600 font-medium">Waktu Tunggu</p>
              <p className="text-xs text-gray-500 mt-1">menit (estimasi)</p>
            </div>
          </div>
        </div>

        {/* Modern Doctor Rooms Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                Status Ruang Dokter
              </h2>
              <p className="text-gray-600 mt-2">Monitor aktivitas real-time di setiap ruang praktik</p>
            </div>
            <div className="hidden lg:flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-2" />
              Update otomatis setiap 30 detik
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {doctorRooms.map((room, index) => (
              <div
                key={room.id}
                className={`group relative bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                {room.status === "Terisi" && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600">Aktif</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {room.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        room.status === "Terisi"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  {room.status === "Terisi" ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Dokter</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {room.doctor}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                          Pasien Saat Ini
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {room.currentPatient}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                        <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">
                          Estimasi Waktu
                        </p>
                        <p className="text-sm font-semibold text-orange-700">
                          {room.estimatedTime}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">
                        Ruangan Tersedia
                      </p>
                      <p className="text-xs text-gray-500">
                        Siap untuk digunakan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Queue Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Antrian Kunjungan Aktif
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar pasien yang sedang menunggu atau sedang dilayani
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Sedang Dilayani</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-600">Menunggu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {upcomingQueue.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Antrian Aktif</h3>
                <p className="text-gray-500">Saat ini tidak ada pasien dalam antrian kunjungan</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Large screens only */}
                <div className="hidden xl:block">
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Antrian</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pasien</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimasi Waktu</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {upcomingQueue.map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                                item.status === "Sedang Dilayani" 
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                              }`}>
                                <span className="text-sm font-bold text-white">{item.queueNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900">{item.patientName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 font-medium">{item.estimatedTime}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Sedang Dilayani"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
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
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pasien</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {upcomingQueue.map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                                item.status === "Sedang Dilayani" 
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                                  : "bg-gradient-to-r from-gray-400 to-gray-500"
                              }`}>
                                <span className="text-xs font-bold text-white">{item.queueNumber}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 text-sm">
                                {item.patientName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-600 text-xs font-medium">
                                {item.estimatedTime}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Sedang Dilayani"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
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
                <div className="md:hidden space-y-4">
                  {upcomingQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                            item.status === "Sedang Dilayani" 
                              ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                              : "bg-gradient-to-r from-gray-400 to-gray-500"
                          }`}>
                            <span className="text-sm font-bold text-white">{item.queueNumber}</span>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold">
                              {item.patientName}
                            </h4>
                            <p className="text-gray-500 text-sm mt-1">
                              {item.estimatedTime}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === "Sedang Dilayani"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Progress indicator for mobile */}
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              item.status === "Sedang Dilayani"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 w-full"
                                : "bg-gray-400 w-1/3"
                            }`}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
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
      </div>
    </DashboardLayout>
  );
}
