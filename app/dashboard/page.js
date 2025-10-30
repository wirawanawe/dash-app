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
  Star,
  Building2
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalPatients: 0,
    totalClinics: 0,
    dailyVisits: 0,
    monthlyVisits: 0,
    activeVisits: 0,
    totalVisitsToday: 0,
    avgWaitTime: 0,
  });
  const [monthlyVisitsData, setMonthlyVisitsData] = useState([]);
  const [mobileStats, setMobileStats] = useState({
    totalMobileUsers: 0,
    activeMobileUsers: 0,
    activePercentage: 0,
    genderDistribution: {},
    habitUsers: 0,
    habitPercentage: 0,
    newUsersThisMonth: 0,
    usersWithHealthData: 0,
    healthDataPercentage: 0,
    activityLevelDistribution: {},
    fitnessGoalDistribution: {},
    habitActivities: {},
    fitnessTracking: {},
    missions: {},
    userMissions: {}
  });
  const [doctorRooms, setDoctorRooms] = useState([]);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [habitActivities, setHabitActivities] = useState([]);
  const [habitStats, setHabitStats] = useState({
    total_activities: 0,
    active_activities: 0,
    categories: 0,
    avg_duration: 0,
    avg_points: 0,
    category_distribution: [],
    difficulty_distribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics?limit=1000");
      if (response.ok) {
        const result = await response.json();
        const clinicsList = result.data || [];
        setClinics(clinicsList);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date in local timezone (not UTC)
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get this month's date range in local timezone
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStart = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
      const monthEnd = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

      // Log dates for debugging

      // Prepare base params with clinic filter
      const baseParams = selectedClinic ? { facility_code: selectedClinic } : {};

      // Fetch visits data for different time periods
      // NOTE: External API tidak punya field status, semua kunjungan adalah "Selesai"
      const [todayVisits, monthlyVisits, allVisits] = await Promise.all([
        fetchVisits({ ...baseParams, searchDate: todayString, limit: 10000 }),
        fetchVisits({ ...baseParams, tglawal: monthStart, tglakhir: monthEnd, limit: 10000 }),
        fetchVisits({ ...baseParams, limit: 999999 }), // Fetch semua data tanpa limit
      ]);

      // Calculate statistics - Gunakan total dari pagination API, bukan length array
      const dailyVisitsCount = todayVisits.data?.length || 0;
      const monthlyVisitsCount = monthlyVisits.data?.length || 0;
      const activeVisitsCount = 0; // Semua kunjungan "Selesai", tidak ada "Aktif"
      // Ambil total dari pagination API untuk mendapatkan jumlah sebenarnya
      const totalVisitsCount = allVisits.pagination?.total || allVisits.data?.length || 0;

      // Get total visits today (including completed)
      const totalVisitsToday = todayVisits.data?.length || 0;

      // Calculate average wait time (estimated based on active visits)
      const avgWaitTime =
        activeVisitsCount > 0 ? Math.ceil(activeVisitsCount * 15) : 0;

      // Fetch total patients
      let totalPatientsCount = 0;
      try {
        const patientsResponse = await fetch('/api/patients?limit=10000');
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          totalPatientsCount = patientsData.pagination?.total || patientsData.data?.length || 0;
        }
      } catch (err) {
        // Error fetching patients
      }

      // Fetch total clinics/faskes
      let totalClinicsCount = 0;
      try {
        const clinicsResponse = await fetch('/api/clinics?limit=10000');
        if (clinicsResponse.ok) {
          const clinicsData = await clinicsResponse.json();
          // Gunakan pagination.total untuk mendapatkan jumlah sebenarnya
          totalClinicsCount = clinicsData.pagination?.total || clinicsData.data?.length || 0;
        }
      } catch (err) {
        // Error fetching clinics
      }

      // Fetch monthly visits data for chart with clinic filter
      try {
        const url = selectedClinic 
          ? `/api/dashboard/monthly-visits?facility_code=${encodeURIComponent(selectedClinic)}`
          : '/api/dashboard/monthly-visits';
        const monthlyResponse = await fetch(url);
        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json();
          if (monthlyData.success) {
            setMonthlyVisitsData(monthlyData.data);
          }
        }
      } catch (err) {
        // Error fetching monthly data
      }

      setStats({
        totalVisits: totalVisitsCount,
        totalPatients: totalPatientsCount,
        totalClinics: totalClinicsCount,
        dailyVisits: dailyVisitsCount,
        monthlyVisits: monthlyVisitsCount,
        activeVisits: activeVisitsCount,
        totalVisitsToday,
        avgWaitTime,
      });

      // Process doctor rooms - tidak ada kunjungan aktif karena semua "Selesai"
      const rooms = await processDoctorRooms([]);
      setDoctorRooms(rooms);

      // Process upcoming queue - tidak ada antrian karena semua kunjungan "Selesai"
      const queue = processUpcomingQueue([]);
      setUpcomingQueue(queue);

      // Fetch mobile user statistics

      const mobileStatsResponse = await fetch('/api/dashboard/mobile-stats');

      if (mobileStatsResponse.ok) {
        const mobileStatsData = await mobileStatsResponse.json();

        if (mobileStatsData.success) {
          setMobileStats(mobileStatsData.data);
        } else {

        }
      } else {

      }

      // Fetch habit activities data

      const habitResponse = await fetch('/api/dashboard/habit-activities?limit=8');

      if (habitResponse.ok) {
        const habitData = await habitResponse.json();

        if (habitData.success) {
          setHabitActivities(habitData.data);
          setHabitStats(habitData.summary);
        } else {

        }
      } else {

      }
    } catch (err) {

      setError("Gagal memuat data dashboard: " + err.message);
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

  const processDoctorRooms = async (visits) => {
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

    // Initialize rooms array with occupied rooms
    let rooms = Array.from(roomMap.values());

    // Get all available rooms from database via API
    try {
      const roomsResponse = await fetch('/api/dashboard/rooms');
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        const availableRooms = roomsData.data || [];
        
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

      // Fallback to basic room structure
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalVisits.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Kunjungan</p>
              <p className="text-xs text-gray-500 mt-1">
                Semua waktu
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
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <Activity className="w-4 h-4 mr-1" />
                Aktif
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalClinics}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Faskes</p>
              <p className="text-xs text-gray-500 mt-1">
                Fasilitas Kesehatan
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-purple-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalPatients.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Pasien</p>
              <p className="text-xs text-gray-500 mt-1">
                Terdaftar di sistem
              </p>
            </div>
          </div>
        </div>

        {/* Grafik Kunjungan Per Bulan */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Grafik Kunjungan Per Bulan
                </h2>
                <p className="text-gray-600 mt-2">Data kunjungan 12 bulan terakhir</p>
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white shadow-sm"
                >
                  <option value="">Semua Klinik</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.code}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {monthlyVisitsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyVisitsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      padding: '12px'
                    }}
                    labelStyle={{ 
                      fontWeight: 'bold', 
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#1f2937'
                    }}
                    itemStyle={{
                      color: '#3b82f6',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                    formatter={(value) => [`${value} kunjungan`, 'Total']}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#colorGradient)" 
                    name="Jumlah Kunjungan"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Data</h3>
                <p className="text-gray-500">Data kunjungan per bulan belum tersedia</p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Doctor Rooms Section */}
        {/* <div className="space-y-6">
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
        </div> */}

        {/* Enhanced Queue Section */}
        {/* <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
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
          </div> */}

          {/* <div className="p-6">
            {upcomingQueue.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Antrian Aktif</h3>
                <p className="text-gray-500">Saat ini tidak ada pasien dalam antrian kunjungan</p>
              </div>
            ) : (
              <> */}
                {/* Desktop Table View - Large screens only */}
                {/* <div className="hidden xl:block">
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
                </div> */}

                {/* Tablet Table View - Medium to Large screens */}
                {/* <div className="hidden md:block xl:hidden">
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
                </div> */}

                {/* Mobile Card View - Small screens */}
                {/* <div className="md:hidden space-y-4">
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
                      </div> */}

                      {/* Progress indicator for mobile */}
                      ?
      </div>
    </DashboardLayout>
  );
}
