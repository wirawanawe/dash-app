"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import ClinicForm from "./components/ClinicForm";
import ApiDocumentation from "@/components/ApiDocumentation";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  Filter,
  MoreVertical,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Award,
  Activity,
  Heart,
  Shield,
  TrendingUp,
  FileText,
  BarChart3
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
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isLoaded, setIsLoaded] = useState(false);

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
      console.error("Error fetching clinics:", error);
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

  const handleEdit = (clinic) => {
    setEditingClinic(clinic);
    setShowForm(true);
  };

  const handleDelete = async (clinicId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus klinik ini?")) return;

    try {
      const response = await fetch(`/api/clinics/${clinicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Klinik berhasil dihapus");
        fetchClinics(true);
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menghapus klinik");
      }
    } catch (error) {
      console.error("Error deleting clinic:", error);
      toast.error("Gagal menghapus klinik");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    try {
      const url = editingClinic
        ? `/api/clinics/${editingClinic.id}`
        : "/api/clinics";
      const method = editingClinic ? "PUT" : "POST";

      const token = localStorage.getItem("token");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save clinic");
      }

      toast.success(
        editingClinic
          ? "Klinik berhasil diperbarui"
          : "Klinik berhasil ditambahkan"
      );
      setShowForm(false);
      setEditingClinic(null);
      fetchClinics(true);
    } catch (error) {
      console.error("Error saving clinic:", error);
      toast.error("Gagal menyimpan klinik");
    }
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
                Kelola data klinik, informasi layanan kesehatan, dan fasilitas medis dalam sistem terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchClinics(true)}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              {isSuperadmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Klinik
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

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
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Premium</span>
                </div>
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
                    : "Belum ada klinik yang ditambahkan."}
                </p>
                {isSuperadmin && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Klinik Pertama
                    </button>
                  </div>
                )}
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
                        Rating
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
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {clinic.city || 'N/A'}
                                </span>
                              </div>
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
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1 text-yellow-400" />
                              {formatRating(clinic.rating)}
                            </div>
                            {clinic.total_reviews > 0 && (
                              <div className="text-xs text-gray-500">
                                {clinic.total_reviews} ulasan
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
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(clinic)}
                              className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Klinik"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isSuperadmin && (
                              <button
                                onClick={() => handleDelete(clinic.id)}
                                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Hapus Klinik"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(clinic)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {isSuperadmin && (
                          <button
                            onClick={() => handleDelete(clinic.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Hapus
                          </button>
                        )}
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

      {/* Form Modal */}
      {showForm && (
        <ClinicForm
          clinic={editingClinic}
          onCancel={() => {
            setShowForm(false);
            setEditingClinic(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="clinics" />
    </DashboardLayout>
  );
}
