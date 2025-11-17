"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  MoreVertical,
  Eye,
  EyeOff,
  Users,
  Award,
  Activity,
  Heart,
  TrendingUp,
  FileText,
  Cloud,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

export default function ClinicsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);

  // Check if user has access
  const isSuperadmin = user?.role === "SUPERADMIN";
  const isAdmin = user?.role === "ADMIN";
  const hasAccess = isSuperadmin || isAdmin;

  useEffect(() => {
    if (user && !hasAccess) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
    }
  }, [user, hasAccess, router]);

  const fetchClinics = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
      });

      const response = await fetch(`/api/clinics?${params}`);
      const data = await response.json();

      if (response.ok) {
        setClinics(data.data);
        setPagination({
          ...pagination,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } else {
        toast.error(data.error || "Gagal mengambil data klinik");
      }
    } catch (error) {

      toast.error("Gagal mengambil data klinik");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    if (hasAccess) {
      fetchClinics();
      setIsLoaded(true);
    }
  }, [fetchClinics, hasAccess]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Tidak Aktif
      </span>
    );
  };

  const formatRating = (rating) => {
    if (!rating) return "Belum ada rating";
    return `${rating}/5.0`;
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return "Tidak tersedia";
    
    // Only calculate on client-side to prevent hydration mismatch
    if (!isLoaded) return "Memuat...";
    
    try {
      const hours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      const todayHours = hours[today];
      
      if (todayHours && todayHours.open && todayHours.close) {
        return `${todayHours.open} - ${todayHours.close}`;
      }
      return "Tutup hari ini";
    } catch (error) {
      return "Tidak tersedia";
    }
  };

  const handleSyncFromAPI = async () => {
    if (isSyncing) return;
    
    if (!confirm('Apakah Anda yakin ingin melakukan sinkronisasi data Faskes dari API eksternal? Sistem akan mengambil semua data faskes dari API eksternal dan menyimpannya ke database lokal. Proses ini mungkin memakan waktu beberapa menit.')) {
      return;
    }
    
    try {
      setIsSyncing(true);
      setSyncProgress(null);
      toast.loading('Memulai sinkronisasi data...', { id: 'sync-toast' });

      const response = await fetch('/api/clinics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize: 50,
          delayBetweenBatches: 1000,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Gagal melakukan sync');
      }

      toast.success('Sync dimulai! Progress akan ditampilkan di bawah...', { id: 'sync-toast', duration: 3000 });
      
      // Start polling for sync progress
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch('/api/clinics/sync', {
            method: 'GET',
          });
          const progressData = await progressResponse.json();
          
          if (progressData.logs && progressData.logs.length > 0) {
            const latestLog = progressData.logs[0];
            setSyncProgress({
              status: latestLog.status === 'completed' ? 'completed' : latestLog.status === 'failed' ? 'failed' : 'in_progress',
              progress: latestLog.progress_percent || 0,
              fetched: latestLog.records_fetched || 0,
              inserted: latestLog.records_inserted || 0,
              updated: latestLog.records_updated || 0,
              failed: latestLog.records_failed || 0,
              total: latestLog.total_records || 0,
              processed: latestLog.processed_records || 0,
              duration: latestLog.duration_seconds || 0,
              error: latestLog.error_message || null,
            });

            if (latestLog.status === 'completed' || latestLog.status === 'failed') {
              clearInterval(pollInterval);
              if (latestLog.status === 'completed') {
                fetchClinics(true);
              }
            }
          }
        } catch (error) {
          console.error('Error polling sync progress:', error);
        }
      }, 2000);

      // Clear interval after 10 minutes (safety timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 600000);

    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`❌ Gagal melakukan sync: ${error.message}`, { id: 'sync-toast', duration: 6000 });
      setTimeout(() => {
        setSyncProgress(null);
      }, 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate clinic statistics
  const clinicStats = {
    total: clinics.length,
    active: clinics.filter(c => c.is_active).length,
    averageRating: Math.round(clinics.reduce((acc, c) => acc + (c.rating || 0), 0) / Math.max(1, clinics.length) * 10) / 10,
    totalReviews: clinics.reduce((acc, c) => acc + (c.total_reviews || 0), 0)
  };

  if (!hasAccess) {
    return null;
  }

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
                <Building2 className="w-4 h-4 mr-2" />
                Manajemen Klinik
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Daftar <span className="text-yellow-300">Klinik</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Data klinik/faskes disinkronisasi otomatis dari API Master. Klik tombol untuk update data terbaru.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              {syncProgress && (syncProgress.status === 'in_progress' || syncProgress.status === 'started') ? (
                <button
                  onClick={() => {
                    if (confirm('Hentikan sinkronisasi yang sedang berjalan?')) {
                      setSyncProgress(null);
                      setIsSyncing(false);
                    }
                  }}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <X className="w-5 h-5 mr-2" />
                  Hentikan Sync
                </button>
              ) : (
                <button
                  onClick={handleSyncFromAPI}
                  disabled={isSyncing}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                  {isSyncing ? 'Syncing...' : 'Sync Data'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Progress Banner */}
        {syncProgress && (
          <div className={`rounded-2xl p-5 shadow-xl border-2 transition-all duration-300 ${
            syncProgress.status === 'completed' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : syncProgress.status === 'failed'
              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {syncProgress.status === 'in_progress' || syncProgress.status === 'started' ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : syncProgress.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="text-lg font-bold text-gray-900">
                    {syncProgress.status === 'in_progress' || syncProgress.status === 'started' 
                      ? 'Sinkronisasi Data Sedang Berlangsung' 
                      : syncProgress.status === 'completed'
                      ? 'Sinkronisasi Selesai'
                      : 'Sinkronisasi Gagal'}
                  </h3>
                </div>
                
                {/* Progress Bar */}
                {(syncProgress.status === 'in_progress' || syncProgress.status === 'started') && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Progress: {syncProgress.progress}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {syncProgress.processed.toLocaleString('id-ID')} / {syncProgress.total.toLocaleString('id-ID')} records
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${syncProgress.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Fetched</p>
                    <p className="text-lg font-bold text-gray-900">{syncProgress.fetched.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Inserted</p>
                    <p className="text-lg font-bold text-green-600">{syncProgress.inserted.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Updated</p>
                    <p className="text-lg font-bold text-blue-600">{syncProgress.updated.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Failed</p>
                    <p className={`text-lg font-bold ${syncProgress.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {syncProgress.failed.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Duration and Error */}
                {(syncProgress.status === 'completed' || syncProgress.status === 'failed') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {syncProgress.duration && (
                      <p className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Durasi: {syncProgress.duration} detik
                      </p>
                    )}
                    {syncProgress.error && (
                      <p className="text-sm text-red-600 mt-1">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {syncProgress.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Close button */}
              {(syncProgress.status === 'completed' || syncProgress.status === 'failed') && (
                <button
                  onClick={() => setSyncProgress(null)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {clinicStats.total}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Klinik</p>
              <p className="text-xs text-gray-500 mt-1">
                Terdaftar dalam sistem
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
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Aktif
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {clinicStats.active}
              </p>
              <p className="text-sm text-gray-600 font-medium">Klinik Aktif</p>
              <p className="text-xs text-gray-500 mt-1">
                Sedang beroperasi
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
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-purple-600">
                <Award className="w-4 h-4 mr-1" />
                Rating
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {clinicStats.averageRating}
              </p>
              <p className="text-sm text-gray-600 font-medium">Rating Rata-rata</p>
              <p className="text-xs text-gray-500 mt-1">
                Dari semua klinik
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-orange-600">
                <Heart className="w-4 h-4 mr-1" />
                Ulasan
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {clinicStats.totalReviews}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Ulasan</p>
              <p className="text-xs text-gray-500 mt-1">
                Dari pasien
              </p>
            </div>
          </div>
        </div> */}

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian Klinik
              </h2>
              <p className="text-gray-600 mt-2">Cari klinik berdasarkan nama, lokasi, atau layanan</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-blue-100 text-blue-600 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari klinik berdasarkan nama, lokasi, atau layanan..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            </div>
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Search className="w-5 h-5 mr-2" />
              Cari Klinik
            </button>
          </form>
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  Data Klinik
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap klinik yang terdaftar dalam sistem
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-green-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Klinik</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Klinik</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Tidak ada klinik yang sesuai dengan pencarian Anda."
                    : "Belum ada data klinik. Klik tombol 'Update Data dari API' untuk mengambil data."}
                </p>
              </div>
            ) : viewMode === 'table' ? (
              /* Table View */
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klinik
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lokasi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clinics.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-green-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{clinic.name}</div>
                              {clinic.code && (
                                <div className="text-xs font-medium text-blue-600 mt-1">
                                  Kode: {clinic.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {clinic.address || 'Tidak ada alamat'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatOperatingHours(clinic.operating_hours)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {clinic.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {clinic.phone}
                              </div>
                            )}
                            {clinic.email && (
                              <div className="flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {clinic.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(clinic.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(clinic.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-end">
                            <span className="text-xs text-gray-400 italic">Data dari API</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                          {clinic.code && (
                            <p className="text-xs font-medium text-blue-600 mt-1">Kode: {clinic.code}</p>
                          )}
                          {getStatusBadge(clinic.is_active)}
                        </div>
                      </div>
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{clinic.city || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-start">
                        <p className="text-sm text-gray-600">{clinic.address || 'Tidak ada alamat'}</p>
                      </div>
                      
                      {clinic.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{clinic.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-2" />
                        <span className="text-sm text-gray-600">{formatRating(clinic.rating)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500">Dibuat: {formatDate(clinic.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-end">
                        <span className="text-xs text-gray-400 italic">Data dari API</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} sampai{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                {pagination.total} klinik
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* API Documentation */}
      <ApiDocumentation pageType="clinics" />
    </DashboardLayout>
  );
}
