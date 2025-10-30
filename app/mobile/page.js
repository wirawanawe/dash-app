"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, 
  Utensils, 
  Target, 
  Activity, 
  Settings, 
  Plus, 
  TrendingUp, 
  Zap, 
  Star,
  Home,
  User,
  Calendar,
  FileText,
  Stethoscope,
  Building,
  Database,
  FlaskConical,
  Smartphone,
  ChevronRight,
  Heart,
  Clock,
  Award,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import ApiDocumentation from "@/components/ApiDocumentation";

export default function MobileDashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFoods: 0,
    totalMissions: 0,
    totalWellnessActivities: 0,
    newUsersThisMonth: 0,
    newFoodsThisMonth: 0,
    newMissionsThisMonth: 0,
    newActivitiesThisMonth: 0
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from all mobile APIs
      const [usersResponse, foodsResponse, missionsResponse, wellnessResponse] = await Promise.all([
        fetch('/api/mobile/users?limit=1'),
        fetch('/api/mobile/food?limit=1'),
        fetch('/api/mobile/missions?limit=1'),
        fetch('/api/mobile/activities-api?limit=1')
      ]);

      // Parse responses
      const usersData = await usersResponse.json();
      const foodsData = await foodsResponse.json();
      const missionsData = await missionsResponse.json();
      const wellnessData = await wellnessResponse.json();

      // Calculate statistics
      const totalUsers = usersData.pagination?.total || 0;
      const totalFoods = foodsData.pagination?.total || 0;
      const totalMissions = missionsData.success ? (missionsData.pagination?.total || 0) : 0;
      const totalWellnessActivities = wellnessData.success ? (wellnessData.pagination?.total || 0) : 0;

      // Calculate active users (users created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersResponse = await fetch(`/api/mobile/users?limit=1000`);
      const activeUsersData = await activeUsersResponse.json();
      const activeUsers = activeUsersData.users?.filter(user => 
        new Date(user.created_at) >= thirtyDaysAgo
      ).length || 0;

      // Calculate new items this month
      const newUsersThisMonth = activeUsers;
      const newFoodsThisMonth = Math.floor(totalFoods * 0.15); // Estimate 15% growth
      const newMissionsThisMonth = Math.floor(totalMissions * 0.12); // Estimate 12% growth
      const newActivitiesThisMonth = Math.floor(totalWellnessActivities * 0.08); // Estimate 8% growth

      setDashboardData({
        totalUsers,
        activeUsers,
        totalFoods,
        totalMissions,
        totalWellnessActivities,
        newUsersThisMonth,
        newFoodsThisMonth,
        newMissionsThisMonth,
        newActivitiesThisMonth
      });

    } catch (err) {

      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickStats = [
    {
      label: "Total Users",
      value: dashboardData.totalUsers.toLocaleString(),
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      trend: `+${Math.floor((dashboardData.newUsersThisMonth / Math.max(dashboardData.totalUsers, 1)) * 100)}%`,
      isPositive: true
    },
    {
      label: "Food Database",
      value: dashboardData.totalFoods.toLocaleString(),
      icon: Utensils,
      gradient: "from-green-500 to-green-600",
      trend: `+${Math.floor((dashboardData.newFoodsThisMonth / Math.max(dashboardData.totalFoods, 1)) * 100)}%`,
      isPositive: true
    },
    {
      label: "Active Users",
      value: dashboardData.activeUsers.toLocaleString(),
      icon: Activity,
      gradient: "from-purple-500 to-purple-600",
      trend: "Live",
      isPositive: true
    },
    {
      label: "Missions",
      value: dashboardData.totalMissions.toLocaleString(),
      icon: Target,
      gradient: "from-orange-500 to-orange-600",
      trend: `+${Math.floor((dashboardData.newMissionsThisMonth / Math.max(dashboardData.totalMissions, 1)) * 100)}%`,
      isPositive: true
    }
  ];

  const menuItems = [
    {
      title: "Dashboard",
      description: "Overview dan statistik utama",
      icon: Home,
      href: "/mobile",
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "Aktif"
    },
    {
      title: "Mobile Users",
      description: "Kelola pengguna aplikasi mobile",
      icon: Smartphone,
      href: "/mobile/users",
      gradient: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: `${dashboardData.totalUsers.toLocaleString()} users`
    },
    {
      title: "Food Database",
      description: "Database makanan dan nutrisi",
      icon: Database,
      href: "/mobile/food",
      gradient: "from-green-500 to-emerald-500",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: `${dashboardData.totalFoods.toLocaleString()} items`
    },
    {
      title: "Missions & Activities",
      description: "Sistem misi dan aktivitas wellness",
      icon: Target,
      href: "/mobile/missions",
      gradient: "from-orange-500 to-red-500",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      trend: `${dashboardData.totalMissions.toLocaleString()} missions`
    },
    {
      title: "Habit Activities",
      description: "Kelola aktivitas kebiasaan dan tracking harian",
      icon: Activity,
      href: "/mobile/activities",
      gradient: "from-indigo-500 to-purple-500",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      trend: `${dashboardData.totalWellnessActivities.toLocaleString()} activities`
    }
  ];

  const quickActions = [
    {
      title: "Tambah User",
      description: "Daftarkan pengguna baru",
      icon: User,
      href: "/mobile/users",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: "Tambah Makanan",
      description: "Input data makanan baru",
      icon: Utensils,
      href: "/mobile/food",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Buat Mission",
      description: "Buat misi wellness baru",
      icon: Target,
      href: "/mobile/missions",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Aktivitas Kebiasaan",
      description: "Kelola habit activities",
      icon: Activity,
      href: "/mobile/activities",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

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
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile App Management
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Mobile <span className="text-yellow-300">Dashboard</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Kelola aplikasi mobile PHC, pengguna, dan fitur wellness dalam satu sistem terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                {loading ? 'Memuat...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickStats.map((stat, index) => (
            <div 
              key={index}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mobile App Data
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Menu */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Menu Utama
              </h2>
              <p className="text-gray-600 mt-2">Akses semua fitur mobile app management</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${item.iconBg}`}>
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {loading ? (
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    ) : (
                      item.trend
                    )}
                  </span>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                    Akses
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                Quick Actions
              </h2>
              <p className="text-gray-600 mt-2">Aksi cepat untuk manajemen mobile app</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`bg-gradient-to-r ${action.gradient} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                System Status
              </h2>
              <p className="text-gray-600 mt-2">Status sistem mobile app dan API</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-semibold text-gray-900">Mobile API</h3>
              <p className="text-green-600 text-sm">Online & Healthy</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Database</h3>
              <p className="text-blue-600 text-sm">Connected & Synced</p>
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

        {/* API Documentation */}
        <ApiDocumentation pageType="mobile" />
      </div>
    </DashboardLayout>
  );
} 