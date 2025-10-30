"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp,
  Heart,
  Activity,
  Calendar,
  Zap,
  RefreshCw,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Lock
} from 'lucide-react';
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import UserForm from "./components/UserForm";
import UserDetailModal from "./components/UserDetailModal";
import UserPermissionsModal from "./components/UserPermissionsModal";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  
  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [clinics, setClinics] = useState([]);

  // Check if user is admin or superadmin, otherwise redirect
  const canManageUsers = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  
  // Check if user is superadmin for API Documentation access
  const canViewApiDocumentation = user?.role === "SUPERADMIN";

  useEffect(() => {
    if (user && !canManageUsers) {
      toast.error("Hanya admin dan superadmin yang dapat mengakses halaman ini");
      router.push("/dashboard");
    }
  }, [user, canManageUsers, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: search,
        page: page.toString(),
        limit: limit.toString(),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await fetch(`/api/users?${params}`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data pengguna");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("Invalid data format");
      }

      setUsers(result.data);
      setMetadata(result.pagination || {});
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (error) {

      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setUsers([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics for dropdown
  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/settings/clinics", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch clinics");
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setClinics(data);
      } else if (data && Array.isArray(data.clinics)) {
        // If API returns { clinics: [...] }
        setClinics(data.clinics);
      } else {

        setClinics([]);
      }
    } catch (error) {

      toast.error("Gagal memuat data klinik");
      setClinics([]); // Set empty array on error
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
      fetchClinics();
      setIsLoaded(true);
    }
  }, [search, page, limit, roleFilter, canManageUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  // Handle edit user
  const handleEditUser = (targetUser) => {
    // Check if non-superadmin is trying to edit superadmin
    if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
      toast.error("Hanya Superadmin yang dapat mengedit pengguna Superadmin");
      return;
    }
    setEditingUser(targetUser);
    setShowForm(true);
  };

  // Modal handlers
  const handleShowDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedUser(null);
    setShowDetailModal(false);
  };

  // Handle show permissions modal
  const handleShowPermissions = (targetUser) => {
    // Check if non-superadmin is trying to manage superadmin permissions
    if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
      toast.error("Hanya Superadmin yang dapat mengelola akses menu Superadmin");
      return;
    }
    setPermissionUser(targetUser);
    setShowPermissionsModal(true);
  };

  const handleClosePermissions = () => {
    setPermissionUser(null);
    setShowPermissionsModal(false);
  };

  // Handle delete user
  const handleDeleteUser = async (id, targetUser) => {
    // Check if non-superadmin is trying to delete superadmin
    if (user?.role?.toUpperCase() !== 'SUPERADMIN' && targetUser?.role?.toUpperCase() === 'SUPERADMIN') {
      toast.error("Hanya Superadmin yang dapat menghapus pengguna Superadmin");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success("Pengguna berhasil dihapus");
      fetchUsers(); // Refresh the list after deletion
    } catch (error) {

      toast.error(error.message || "Gagal menghapus pengguna");
    }
  };

  // Handle form submit - just refresh data and close modal
  const handleFormSubmit = async () => {
    // UserForm already handles the API call and shows toast
    // We just need to refresh the list and close the modal
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const getRoleBadge = (role) => {
    const colors = {
      SUPERADMIN: "bg-yellow-100 text-yellow-800",
      ADMIN: "bg-red-100 text-red-800",
      DOCTOR: "bg-blue-100 text-blue-800",
      STAFF: "bg-green-100 text-green-800"
    };

    // Convert role to uppercase for display and color matching
    const roleUpper = role?.toUpperCase() || 'UNKNOWN';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[roleUpper] || 'bg-gray-100 text-gray-800'}`}>
        {roleUpper}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="h-3 w-3 mr-1" />
        Tidak Aktif
      </span>
    );
  };

  const roles = [
    { value: '', label: 'Semua Role' },
    { value: 'SUPERADMIN', label: 'Superadmin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'DOCTOR', label: 'Dokter' },
    { value: 'STAFF', label: 'Staff' }
  ];

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate the range of pages to show around current page
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    // Always show first page
    if (totalPages > 0) {
      rangeWithDots.push(1);
    }

    // Add dots and range if needed
    if (page - delta > 2) {
      rangeWithDots.push("...");
    }

    // Add the middle range (excluding first and last page)
    range.forEach((pageNum) => {
      if (pageNum !== 1 && pageNum !== totalPages) {
        rangeWithDots.push(pageNum);
      }
    });

    // Add dots and last page if needed
    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...");
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remove duplicates while preserving order
    return rangeWithDots.filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
  };

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
                <Users className="w-4 h-4 mr-2" />
                Manajemen Pengguna
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Daftar <span className="text-yellow-300">Pengguna</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Kelola pengguna, hak akses, dan informasi sistem dalam satu platform terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchUsers}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              {/* Desktop Add Button */}
              <button
                onClick={handleAddUser}
                className="hidden lg:flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Tambah Pengguna
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                +8%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {metadata.total || 0}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Pengguna</p>
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
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <Heart className="w-4 h-4 mr-1" />
                Aktif
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-gray-600 font-medium">Pengguna Aktif</p>
              <p className="text-xs text-gray-500 mt-1">
                Sedang menggunakan sistem
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
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-purple-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                Live
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {page}
              </p>
              <p className="text-sm text-gray-600 font-medium">Halaman Saat Ini</p>
              <p className="text-xs text-gray-500 mt-1">
                dari {totalPages} halaman
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter
              </h2>
              <p className="text-gray-600 mt-2">Cari pengguna berdasarkan nama, email, atau role</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari pengguna (nama, email, telepon)..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
                />
                <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Search className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Cari</span>
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
            
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="px-4 py-3 text-black rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-3 rounded-xl border transition-colors font-semibold ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white/50 text-gray-700 border-gray-200 hover:bg-white/70'
                }`}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 rounded-xl border transition-colors font-semibold ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white/50 text-gray-700 border-gray-200 hover:bg-white/70'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
          
          {(search || roleFilter) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Filter aktif:</span>
                {search && ` Pencarian: "${search}"`}
                {roleFilter && ` Role: ${roles.find(r => r.value === roleFilter)?.label}`}
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Data Pengguna
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap pengguna yang terdaftar dalam sistem
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tidak Aktif</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Pengguna</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pengguna</h3>
                <p className="text-gray-600 mb-4">
                  {search || roleFilter ? "Tidak ada pengguna yang sesuai dengan filter Anda." : "Belum ada data pengguna yang ditambahkan."}
                </p>
                {!search && !roleFilter && (
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Tambah Pengguna Pertama
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pengguna
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klinik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((tableUser) => (
                      <tr key={tableUser.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tableUser.name}</div>
                              <div className="text-sm text-gray-500">{tableUser.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {tableUser.email}
                            </div>
                            {tableUser.phone && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {tableUser.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(tableUser.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {tableUser.clinic_name ? (
                              <div className="flex items-center">
                                <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                                {tableUser.clinic_name}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(tableUser.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tableUser.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                     <div className="flex items-center justify-end space-x-2">
                             <button
                               onClick={() => handleShowDetail(tableUser)}
                               className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                               title="Lihat Detail"
                             >
                               <Eye className="h-4 w-4" />
                             </button>
                             {/* Hide permissions button for superadmin if current user is not superadmin */}
                             {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                               <button
                                 onClick={() => handleShowPermissions(tableUser)}
                                 className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                 title="Kelola Akses Menu"
                               >
                                 <Lock className="h-4 w-4" />
                               </button>
                             )}
                             {/* Hide edit button for superadmin if current user is not superadmin */}
                             {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                               <button
                                 onClick={() => handleEditUser(tableUser)}
                                 className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                 title="Edit Pengguna"
                               >
                                 <Edit className="h-4 w-4" />
                               </button>
                             )}
                             {/* Hide delete button for superadmin if current user is not superadmin */}
                             {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && tableUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                               <button
                                 onClick={() => handleDeleteUser(tableUser.id, tableUser)}
                                 className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                 title="Hapus Pengguna"
                               >
                                 <Trash2 className="h-4 w-4" />
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
                {users.map((gridUser) => (
                  <div key={gridUser.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">{gridUser.name}</h3>
                          <p className="text-sm text-gray-500">{gridUser.email}</p>
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
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">{gridUser.email}</p>
                      </div>
                      
                      {gridUser.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600">{gridUser.phone}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        {getRoleBadge(gridUser.role)}
                      </div>
                      
                      {gridUser.clinic_name && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600">{gridUser.clinic_name}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500">Dibuat: {formatDate(gridUser.created_at)}</p>
                      </div>
                      
                      <div className="flex items-center">
                        {getStatusBadge(gridUser.is_active)}
                      </div>
                    </div>
                    
                                         <div className="mt-4 pt-4 border-t border-gray-200">
                       <div className="flex gap-2 mb-2">
                         <button
                           onClick={() => handleShowDetail(gridUser)}
                           className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                         >
                           Detail
                         </button>
                         {/* Hide permissions button for superadmin if current user is not superadmin */}
                         {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                           <button
                             onClick={() => handleShowPermissions(gridUser)}
                             className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                           >
                             Akses
                           </button>
                         )}
                       </div>
                       <div className="flex gap-2">
                         {/* Hide edit button for superadmin if current user is not superadmin */}
                         {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                           <button
                             onClick={() => handleEditUser(gridUser)}
                             className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                           >
                             Edit
                           </button>
                         )}
                         {/* Hide delete button for superadmin if current user is not superadmin */}
                         {!(user?.role?.toUpperCase() !== 'SUPERADMIN' && gridUser?.role?.toUpperCase() === 'SUPERADMIN') && (
                           <button
                             onClick={() => handleDeleteUser(gridUser.id, gridUser)}
                             className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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

            {/* Data Info and Pagination */}
            <div className="table-pagination-wrapper">
              {/* Data info and pagination controls */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Data info */}
                  <div className="text-sm text-gray-600">
                    Menampilkan{" "}
                    <span className="font-semibold text-blue-600">
                      {(page - 1) * limit + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-blue-600">
                      {Math.min(page * limit, metadata.total || 0)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-blue-600">{metadata.total || 0}</span>{" "}
                    data pengguna
                  </div>

                  {/* Items per page */}
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                    <label
                      htmlFor="limit"
                      className="text-sm text-gray-700 whitespace-nowrap font-medium"
                    >
                      Data per halaman:
                    </label>
                    <select
                      id="limit"
                      value={limit}
                      onChange={handleLimitChange}
                      className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none focus:ring-0 font-semibold"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    {/* First page button */}
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                      title="Halaman pertama"
                    >
                      <FaAngleDoubleLeft className="h-4 w-4" />
                    </button>

                    {/* Previous page button */}
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                      title="Halaman sebelumnya"
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((pageNum, index) => {
                      if (typeof pageNum !== "number") {
                        return (
                          <span
                            key={index}
                            className="px-4 py-3 text-gray-400 border-r border-gray-200 select-none"
                          >
                            {pageNum}
                          </span>
                        );
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-3 text-sm font-medium border-r border-gray-200 transition-colors ${
                            pageNum === page
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                          title={`Halaman ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next page button */}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                      title="Halaman selanjutnya"
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>

                    {/* Last page button */}
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Halaman terakhir"
                    >
                      <FaAngleDoubleRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Documentation - Only visible to Superadmin */}
        {canViewApiDocumentation && (
          <ApiDocumentation pageType="users" />
        )}

        {/* Mobile Floating Action Button */}
        <button
          onClick={handleAddUser}
          className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50"
          title="Tambah Pengguna"
        >
          <UserPlus className="h-6 w-6" />
        </button>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <UserForm
                user={editingUser}
                clinics={clinics}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
              />
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={handleCloseDetail}
          />
        )}

        {/* User Permissions Modal */}
        {showPermissionsModal && permissionUser && (
          <UserPermissionsModal
            user={permissionUser}
            onClose={handleClosePermissions}
            onSaved={fetchUsers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
