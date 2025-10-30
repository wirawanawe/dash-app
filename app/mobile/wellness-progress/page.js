"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, 
  Activity, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Heart,
  Zap,
  Star,
  ChevronRight,
  Eye,
  Filter,
  Search,
  Download,
  User,
  Target as TargetIcon,
  Activity as ActivityIcon,
  Heart as HeartIcon,
  Droplets,
  Utensils,
  Moon,
  Smile
} from 'lucide-react';

export default function WellnessProgressPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/mobile/wellness-progress?limit=1000');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Gagal memuat data pengguna');
      }
    } catch (err) {

      setError('Gagal memuat data pengguna: ' + err.message);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const fetchUserProgress = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch detailed wellness progress data
      const response = await fetch(`/api/mobile/wellness-progress/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setUserProgress(data.progress);
      } else {
        setError(data.message || 'Gagal memuat progress pengguna');
      }

    } catch (err) {

      setError('Gagal memuat progress pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchUsers();
  }, [mounted]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserProgress(selectedUser.id);
    }
  }, [selectedUser]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.wellness_program_joined) ||
                         (filterStatus === 'inactive' && !user.wellness_program_joined);
    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (category) => {
    const icons = {
      'fitness': ActivityIcon,
      'nutrition': Utensils,
      'mental_health': HeartIcon,
      'sleep': Moon,
      'mood': Smile,
      'water': Droplets,
      'other': ActivityIcon
    };
    return icons[category] || ActivityIcon;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserProgress(null); // Reset progress when selecting new user
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Heart className="w-4 h-4 mr-2" />
                Wellness Progress Monitoring
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Progress <span className="text-yellow-300">Wellness</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Pantau perkembangan program wellness pengguna mobile untuk membantu konsultasi dokter
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchUsers}
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
                  onClick={() => {
                    setError(null);
                    fetchUsers();
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 text-black ßbackdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-white/50 text-black backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="all">Semua Pengguna</option>
                  <option value="active">Aktif Wellness</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {filteredUsers.length} dari {users.length} pengguna
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Daftar Pengguna
              </h2>
              
              {loading && !isLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Memuat pengguna...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          selectedUser?.id === user.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-white/50 border border-gray-200 hover:bg-white/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{user.name || 'Nama tidak tersedia'}</h3>
                            <p className="text-sm text-gray-600">{user.email || 'Email tidak tersedia'}</p>
                            <div className="flex items-center mt-2">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                user.wellness_program_joined ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className="text-xs text-gray-500">
                                {user.wellness_program_joined ? 'Aktif Wellness' : 'Tidak Aktif'}
                              </span>
                            </div>
                            {user.wellness_program_joined && user.days_since_joining && (
                              <div className="mt-1">
                                <span className="text-xs text-blue-600">
                                  {user.days_since_joining} hari berpartisipasi
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Tidak ada pengguna ditemukan</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Progress Details */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name || 'Nama tidak tersedia'}</h2>
                      <p className="text-gray-600">{selectedUser.email || 'Email tidak tersedia'}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedUser.wellness_program_joined
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.wellness_program_joined ? 'Aktif Wellness' : 'Tidak Aktif'}
                      </div>
                    </div>
                  </div>

                  {/* User Profile Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
                      <User className="w-5 h-5 mr-2 text-black" />
                      Informasi Profil
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Berat Badan</div>
                        <div className="font-semibold text-black">{selectedUser.weight || '-'} kg</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tinggi Badan</div>
                        <div className="font-semibold text-black">{selectedUser.height || '-'} cm</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Usia</div>
                        <div className="font-semibold text-black">{selectedUser.age || '-'} tahun</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Jenis Kelamin</div>
                        <div className="font-semibold capitalize text-black">{selectedUser.gender || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Level Aktivitas</div>
                        <div className="font-semibold capitalize text-black">{selectedUser.activity_level?.replace('_', ' ') || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Tujuan Fitness</div>
                        <div className="font-semibold capitalize text-black">{selectedUser.fitness_goal?.replace('_', ' ') || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Join Wellness</div>
                        <div className="font-semibold text-black">
                          {selectedUser.wellness_join_date 
                            ? new Date(selectedUser.wellness_join_date).toLocaleDateString('id-ID')
                            : '-'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className={`font-semibold text-black ${
                          selectedUser.wellness_program_joined ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {selectedUser.wellness_program_joined ? 'Aktif' : 'Tidak Aktif'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Durasi Program</div>
                        <div className="font-semibold text-black">
                          {selectedUser.wellness_program_duration ? `${selectedUser.wellness_program_duration} hari` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Hari Berpartisipasi</div>
                        <div className="font-semibold text-black">
                          {selectedUser.days_since_joining ? `${selectedUser.days_since_joining} hari` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Sisa Hari</div>
                        <div className="font-semibold text-black">
                          {selectedUser.days_remaining !== undefined ? `${selectedUser.days_remaining} hari` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {loading && !userProgress ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Memuat progress...</span>
                    </div>
                  ) : userProgress ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                          <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">{userProgress.totalActivities || 0}</div>
                          <div className="text-sm text-gray-600">Total Aktivitas</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">{userProgress.completedMissions || 0}</div>
                          <div className="text-sm text-gray-600">Misi Selesai</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl">
                          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">{userProgress.totalPoints || 0}</div>
                          <div className="text-sm text-gray-600">Total Poin</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-xl">
                          <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">{userProgress.weeklyActivities || 0}</div>
                          <div className="text-sm text-gray-600">Aktivitas Minggu Ini</div>
                        </div>
                      </div>

                      {/* Wellness Score */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {userProgress.wellnessScore || 0}%
                          </div>
                          <div className="text-sm text-gray-600 mb-3">Wellness Score</div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${userProgress.wellnessScore || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Tidak ada data progress tersedia</p>
                    </div>
                  )}
                </div>

                {/* Progress Charts */}
                {userProgress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activity Distribution */}
                    {userProgress.activityDistribution && Object.keys(userProgress.activityDistribution).length > 0 && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                          <BarChart3 className="w-5 h-5 mr-2 text-black" />
                          Distribusi Aktivitas
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(userProgress.activityDistribution).map(([category, count]) => {
                            const Icon = getActivityIcon(category);
                            const percentage = userProgress.totalActivities > 0 ? (count / userProgress.totalActivities) * 100 : 0;
                            return (
                              <div key={category} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Icon className="w-4 h-4 mr-2 text-gray-600" />
                                  <span className="text-sm font-medium capitalize">{category.replace('_', ' ')}</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mission Progress */}
                    {userProgress.totalMissions > 0 && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                          <Target className="w-5 h-5 mr-2 text-black" />
                          Progress Misi
                        </h3>
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {userProgress.totalMissions > 0 
                              ? Math.round((userProgress.completedMissions / userProgress.totalMissions) * 100)
                              : 0}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {userProgress.completedMissions} dari {userProgress.totalMissions} misi
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${userProgress.totalMissions > 0 
                                ? (userProgress.completedMissions / userProgress.totalMissions) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tracking Data */}
                {userProgress && userProgress.trackingData && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                      <BarChart3 className="w-5 h-5 mr-2 text-black" />
                      Data Tracking Harian
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Water Intake */}
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center mb-2">
                          <Droplets className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="font-medium text-gray-900">Konsumsi Air</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {userProgress.trackingData.avgWaterIntake || 0} ml
                        </div>
                        <div className="text-sm text-gray-600">Rata-rata per hari</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(((userProgress.trackingData.avgWaterIntake || 0) / 2000) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Target: 2000 ml</div>
                        </div>
                      </div>

                      {/* Sleep Hours */}
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center mb-2">
                          <Moon className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="font-medium text-gray-900">Tidur</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {userProgress.trackingData.avgSleepHours || 0} jam
                        </div>
                        <div className="text-sm text-gray-600">Rata-rata per malam</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${Math.min(((userProgress.trackingData.avgSleepHours || 0) / 8) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Target: 8 jam</div>
                        </div>
                      </div>

                      {/* Mood Score */}
                      <div className="p-4 bg-yellow-50 rounded-xl">
                        <div className="flex items-center mb-2">
                          <Smile className="w-5 h-5 text-yellow-600 mr-2" />
                          <span className="font-medium text-gray-900">Mood</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {userProgress.trackingData.avgMoodScore || 0}/10
                        </div>
                        <div className="text-sm text-gray-600">Rata-rata skor</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full"
                              style={{ width: `${((userProgress.trackingData.avgMoodScore || 0) / 10) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Skala 1-10</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Missions */}
                {userProgress && userProgress.missions && userProgress.missions.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                      <Target className="w-5 h-5 mr-2 text-black" />
                      Daftar Misi
                    </h3>
                    <div className="space-y-3">
                      {userProgress.missions.map((mission) => (
                        <div key={mission.id} className="p-4 bg-white/50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                mission.status === 'completed' ? 'bg-green-500' :
                                mission.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-900">{mission.title || 'Misi tidak tersedia'}</div>
                                <div className="text-sm text-gray-600">{mission.description || 'Deskripsi tidak tersedia'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{mission.points || 0} poin</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                mission.status === 'completed' ? 'bg-green-100 text-green-800' :
                                mission.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {mission.status === 'completed' ? 'Selesai' :
                                 mission.status === 'in_progress' ? 'Sedang Berjalan' : 'Belum Dimulai'}
                              </div>
                            </div>
                          </div>
                          {mission.status === 'in_progress' && mission.target_value && (
                            <div className="mt-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{mission.current_value || 0} / {mission.target_value} {mission.unit || ''}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(((mission.current_value || 0) / mission.target_value) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {mission.completed_date && (
                            <div className="mt-2 text-xs text-gray-500">
                              Selesai: {new Date(mission.completed_date).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activities */}
                {userProgress && userProgress.recentActivities && userProgress.recentActivities.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                      <Clock className="w-5 h-5 mr-2 text-black" />
                      Aktivitas Terbaru
                    </h3>
                    <div className="space-y-3">
                      {userProgress.recentActivities.map((activity) => {
                        const Icon = getActivityIcon(activity.category);
                        return (
                          <div key={activity.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                            <div className="flex items-center">
                              <Icon className="w-5 h-5 mr-3 text-gray-600" />
                              <div>
                                <div className="font-medium text-gray-900">{activity.title || 'Aktivitas tidak tersedia'}</div>
                                <div className="text-sm text-gray-600">
                                  {activity.completed_at ? new Date(activity.completed_at).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{activity.points || 0} poin</div>
                              <div className="text-xs text-gray-600 capitalize">{activity.category?.replace('_', ' ') || 'other'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/20 text-center">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Pilih Pengguna</h3>
                <p className="text-gray-500">Pilih pengguna dari daftar di sebelah kiri untuk melihat progress wellness mereka</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 