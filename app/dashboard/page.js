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
  Clock,
  Target
} from 'lucide-react';


export default function Dashboard() {
  const [stats, setStats] = useState({
    dailyVisits: 0,
    monthlyVisits: 0,
    activeVisits: 0,
    totalVisitsToday: 0,
    avgWaitTime: 0,
  });
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

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    setIsLoaded(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching dashboard data...");

      // Fetch dashboard statistics from API
      const statsResponse = await fetch('/api/dashboard/stats');
      console.log("Stats response status:", statsResponse.status);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Stats data:", statsData);
        if (statsData.success) {
          setStats(statsData.data);
        } else {
          throw new Error(statsData.message || 'Failed to fetch stats');
        }
      } else {
        const errorText = await statsResponse.text();
        console.error("Stats response error:", errorText);
        throw new Error('Failed to fetch dashboard stats');
      }

      // Fetch visits data for rooms and queue
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      console.log("Fetching visits with status Aktif...");
      const activeVisits = await fetchVisits({ status: "Aktif", limit: 100 });
      console.log("Active visits:", activeVisits);

      // Process doctor rooms from active visits
      const rooms = await processDoctorRooms(activeVisits.data || []);
      setDoctorRooms(rooms);

      // Process upcoming queue from active visits
      const queue = processUpcomingQueue(activeVisits.data || []);
      setUpcomingQueue(queue);

      // Fetch mobile user statistics
      console.log("Fetching mobile user statistics...");
      const mobileStatsResponse = await fetch('/api/dashboard/mobile-stats');
      console.log("Mobile stats response status:", mobileStatsResponse.status);
      
      if (mobileStatsResponse.ok) {
        const mobileStatsData = await mobileStatsResponse.json();
        console.log("Mobile stats data:", mobileStatsData);
        if (mobileStatsData.success) {
          setMobileStats(mobileStatsData.data);
        } else {
          console.warn("Failed to fetch mobile stats:", mobileStatsData.message);
        }
      } else {
        console.warn("Failed to fetch mobile stats:", mobileStatsResponse.status);
      }

      // Fetch habit activities data
      console.log("Fetching habit activities...");
      const habitResponse = await fetch('/api/dashboard/habit-activities?limit=8');
      console.log("Habit response status:", habitResponse.status);
      
      if (habitResponse.ok) {
        const habitData = await habitResponse.json();
        console.log("Habit data:", habitData);
        if (habitData.success) {
          setHabitActivities(habitData.data);
          setHabitStats(habitData.summary);
        } else {
          console.warn("Failed to fetch habit activities:", habitData.message);
        }
      } else {
        console.warn("Failed to fetch habit activities:", habitResponse.status);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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
      console.error("Error fetching rooms:", error);
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
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        </div> */}

        {/* Mobile User Statistics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
                Statistik Pengguna Mobile
              </h2>
              <p className="text-gray-600 mt-2">Data pengguna aplikasi mobile dan aktivitas terkait</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Mobile Users */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-blue-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Total
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.totalMobileUsers}
                </p>
                <p className="text-sm text-gray-600 font-medium">Total Pengguna Mobile</p>
                <p className="text-xs text-gray-500 mt-1">
                  Terdaftar di aplikasi
                </p>
              </div>
            </div>

            {/* Active Mobile Users */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '500ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {mobileStats.activePercentage}%
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.activeMobileUsers}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pengguna Aktif</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  {mobileStats.activePercentage}% dari total
                </p>
              </div>
            </div>

            {/* Male Users */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '600ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-blue-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Laki-laki
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.genderDistribution?.male || 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pengguna Laki-laki</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mobileStats.totalMobileUsers > 0 ? Math.round(((mobileStats.genderDistribution?.male || 0) / mobileStats.totalMobileUsers) * 100) : 0}% dari total
                </p>
              </div>
            </div>

            {/* Female Users */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '700ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-pink-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Perempuan
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.genderDistribution?.female || 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pengguna Perempuan</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mobileStats.totalMobileUsers > 0 ? Math.round(((mobileStats.genderDistribution?.female || 0) / mobileStats.totalMobileUsers) * 100) : 0}% dari total
                </p>
              </div>
            </div>
          </div>

                     {/* Gender Distribution Chart */}
           <div 
             className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
               isLoaded ? 'animate-fade-in-up' : 'opacity-0'
             }`}
             style={{ animationDelay: '800ms' }}
           >
             <div className="flex items-center justify-between mb-6">
               <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                 <BarChart3 className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Distribusi Gender</h3>
             </div>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                   <span className="text-sm font-medium text-gray-700">Laki-laki</span>
                 </div>
                                   <span className="text-sm font-bold text-gray-900">
                    {mobileStats.genderDistribution?.male || 0}
                  </span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                   <span className="text-sm font-medium text-gray-700">Perempuan</span>
                 </div>
                                   <span className="text-sm font-bold text-gray-900">
                    {mobileStats.genderDistribution?.female || 0}
                  </span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                 <div className="flex h-2 rounded-full overflow-hidden">
                   <div 
                     className="bg-blue-500" 
                     style={{ 
                       width: `${mobileStats.totalMobileUsers > 0 ? ((mobileStats.genderDistribution?.male || 0) / mobileStats.totalMobileUsers) * 100 : 0}%` 
                     }}
                   ></div>
                   <div 
                     className="bg-pink-500" 
                     style={{ 
                       width: `${mobileStats.totalMobileUsers > 0 ? ((mobileStats.genderDistribution?.female || 0) / mobileStats.totalMobileUsers) * 100 : 0}%` 
                     }}
                   ></div>
                 </div>
               </div>
             </div>
           </div>

           {/* Additional Mobile App Statistics */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Habit Program Users */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '800ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-purple-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {mobileStats.habitPercentage}%
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.habitUsers}
                </p>
                <p className="text-sm text-gray-600 font-medium">Program Habit</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  Bergabung dengan program
                </p>
              </div>
            </div>

            {/* New Users This Month */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '900ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-orange-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Baru
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.newUsersThisMonth}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pengguna Baru</p>
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  Bulan ini
                </p>
              </div>
            </div>

            {/* Users with Health Data */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '1000ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-teal-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {mobileStats.healthDataPercentage}%
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.usersWithHealthData}
                </p>
                <p className="text-sm text-gray-600 font-medium">Data Kesehatan</p>
                <p className="text-xs text-teal-600 mt-1 font-medium">
                  Tinggi & berat badan
                </p>
              </div>
            </div>
                     </div>

           {/* Mobile App Activity Statistics */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Activity Level Distribution */}
             <div 
               className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                 isLoaded ? 'animate-fade-in-up' : 'opacity-0'
               }`}
               style={{ animationDelay: '1100ms' }}
             >
               <div className="flex items-center justify-between mb-6">
                 <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                   <Activity className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Level Aktivitas</h3>
               </div>
               <div className="space-y-3">
                 {Object.entries(mobileStats.activityLevelDistribution || {}).map(([level, count], index) => (
                   <div key={level} className="flex items-center justify-between">
                     <span className="text-sm font-medium text-gray-700 capitalize">
                       {level.replace('_', ' ')}
                     </span>
                     <div className="flex items-center space-x-2">
                       <div className="w-20 bg-gray-200 rounded-full h-2">
                         <div 
                           className="bg-indigo-500 h-2 rounded-full" 
                           style={{ width: `${mobileStats.totalMobileUsers > 0 ? (count / mobileStats.totalMobileUsers) * 100 : 0}%` }}
                         ></div>
                       </div>
                       <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-right">
                         {count}
                       </span>
                     </div>
                   </div>
                 ))}
                 {Object.keys(mobileStats.activityLevelDistribution || {}).length === 0 && (
                   <p className="text-sm text-gray-500 text-center py-4">Belum ada data level aktivitas</p>
                 )}
               </div>
             </div>

             {/* Fitness Goals Distribution */}
             <div 
               className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                 isLoaded ? 'animate-fade-in-up' : 'opacity-0'
               }`}
               style={{ animationDelay: '1200ms' }}
             >
               <div className="flex items-center justify-between mb-6">
                 <div className="p-3 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl shadow-lg">
                   <Target className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Tujuan Fitness</h3>
               </div>
               <div className="space-y-3">
                 {Object.entries(mobileStats.fitnessGoalDistribution || {}).map(([goal, count], index) => (
                   <div key={goal} className="flex items-center justify-between">
                     <span className="text-sm font-medium text-gray-700 capitalize">
                       {goal.replace('_', ' ')}
                     </span>
                     <div className="flex items-center space-x-2">
                       <div className="w-20 bg-gray-200 rounded-full h-2">
                         <div 
                           className="bg-rose-500 h-2 rounded-full" 
                           style={{ width: `${mobileStats.totalMobileUsers > 0 ? (count / mobileStats.totalMobileUsers) * 100 : 0}%` }}
                         ></div>
                       </div>
                       <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-right">
                         {count}
                       </span>
                     </div>
                   </div>
                 ))}
                 {Object.keys(mobileStats.fitnessGoalDistribution || {}).length === 0 && (
                   <p className="text-sm text-gray-500 text-center py-4">Belum ada data tujuan fitness</p>
                 )}
               </div>
             </div>
           </div>

           {/* Enhanced Mobile App Statistics */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                         {/* Habit Activities */}
            <div 
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '1300ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  30 Hari
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {mobileStats.habitActivities?.total_activities || 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">Aktivitas Habit</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  {mobileStats.habitActivities?.active_users || 0} pengguna aktif
                </p>
              </div>
            </div>

             {/* Fitness Tracking */}
             <div 
               className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                 isLoaded ? 'animate-fade-in-up' : 'opacity-0'
               }`}
               style={{ animationDelay: '1400ms' }}
             >
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg">
                   <Heart className="w-6 h-6 text-white" />
                 </div>
                 <div className="flex items-center text-sm font-medium text-orange-600">
                   <TrendingUp className="w-4 h-4 mr-1" />
                   {mobileStats.fitnessTracking?.total_calories || 0}
                 </div>
               </div>
               <div>
                 <p className="text-3xl font-bold text-gray-900 mb-1">
                   {mobileStats.fitnessTracking?.total_sessions || 0}
                 </p>
                 <p className="text-sm text-gray-600 font-medium">Sesi Fitness</p>
                 <p className="text-xs text-orange-600 mt-1 font-medium">
                   {mobileStats.fitnessTracking?.total_steps || 0} langkah
                 </p>
               </div>
             </div>

             {/* Missions */}
             <div 
               className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                 isLoaded ? 'animate-fade-in-up' : 'opacity-0'
               }`}
               style={{ animationDelay: '1500ms' }}
             >
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                   <Target className="w-6 h-6 text-white" />
                 </div>
                 <div className="flex items-center text-sm font-medium text-purple-600">
                   <TrendingUp className="w-4 h-4 mr-1" />
                   {mobileStats.missions?.active_missions || 0}
                 </div>
               </div>
               <div>
                 <p className="text-3xl font-bold text-gray-900 mb-1">
                   {mobileStats.missions?.total_missions || 0}
                 </p>
                 <p className="text-sm text-gray-600 font-medium">Total Misi</p>
                 <p className="text-xs text-purple-600 mt-1 font-medium">
                   {mobileStats.missions?.mission_categories || 0} kategori
                 </p>
               </div>
             </div>

             {/* User Missions */}
             <div 
               className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                 isLoaded ? 'animate-fade-in-up' : 'opacity-0'
               }`}
               style={{ animationDelay: '1600ms' }}
             >
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                   <Star className="w-6 h-6 text-white" />
                 </div>
                 <div className="flex items-center text-sm font-medium text-cyan-600">
                   <TrendingUp className="w-4 h-4 mr-1" />
                   {mobileStats.userMissions?.completed_missions || 0}
                 </div>
               </div>
               <div>
                 <p className="text-3xl font-bold text-gray-900 mb-1">
                   {mobileStats.userMissions?.total_user_missions || 0}
                 </p>
                 <p className="text-sm text-gray-600 font-medium">Misi Pengguna</p>
                 <p className="text-xs text-cyan-600 mt-1 font-medium">
                   {mobileStats.userMissions?.users_with_missions || 0} pengguna
                 </p>
               </div>
             </div>
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

       

        {/* Habit Activities Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                Aktivitas Kesehatan & Habit
              </h2>
              <p className="text-gray-600 mt-2">Kelola dan pantau aktivitas kesehatan yang tersedia untuk pengguna mobile</p>
            </div>
            <div className="hidden lg:flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-2" />
              Total: {habitStats.total_activities} aktivitas
            </div>
          </div>

          {/* Habit Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Aktif
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {habitStats.total_activities}
                </p>
                <p className="text-sm text-gray-600 font-medium">Total Aktivitas</p>
                <p className="text-xs text-gray-500 mt-1">
                  {habitStats.active_activities} aktif saat ini
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-blue-600">
                  <Star className="w-4 h-4 mr-1" />
                  Kategori
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {habitStats.categories}
                </p>
                <p className="text-sm text-gray-600 font-medium">Kategori Aktivitas</p>
                <p className="text-xs text-gray-500 mt-1">
                  Berbagai jenis aktivitas
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-purple-600">
                  <Clock className="w-4 h-4 mr-1" />
                  Rata-rata
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {habitStats.avg_duration}
                </p>
                <p className="text-sm text-gray-600 font-medium">Durasi (Menit)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Rata-rata per aktivitas
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-orange-600">
                  <Zap className="w-4 h-4 mr-1" />
                  Poin
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {habitStats.avg_points}
                </p>
                <p className="text-sm text-gray-600 font-medium">Poin Rata-rata</p>
                <p className="text-xs text-gray-500 mt-1">
                  Per aktivitas selesai
                </p>
              </div>
            </div>
          </div>

          {/* Habit Activities List */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    Daftar Aktivitas Habit
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Aktivitas kesehatan yang tersedia untuk pengguna mobile
                  </p>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-sm">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Lihat Semua
                </button>
              </div>
            </div>

            <div className="p-6">
              {habitActivities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Aktivitas</h3>
                  <p className="text-gray-500">Aktivitas habit belum ditambahkan ke sistem</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {habitActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ${
                        isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                      }`}
                      style={{ animationDelay: `${(index + 8) * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {activity.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {activity.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durasi
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {activity.duration_minutes} menit
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kesulitan
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            activity.difficulty === 'easy' || activity.difficulty === 'beginner'
                              ? 'bg-green-100 text-green-800'
                              : activity.difficulty === 'medium' || activity.difficulty === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : activity.difficulty === 'hard' || activity.difficulty === 'advanced'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.difficulty === 'easy' || activity.difficulty === 'beginner' ? 'Mudah' : 
                             activity.difficulty === 'medium' || activity.difficulty === 'intermediate' ? 'Sedang' : 
                             activity.difficulty === 'hard' || activity.difficulty === 'advanced' ? 'Sulit' : 
                             'Tidak ditentukan'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Poin
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            <Star className="w-3 h-3 mr-1" />
                            {activity.points}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {activity.id}</span>
                          <span>{new Date(activity.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
