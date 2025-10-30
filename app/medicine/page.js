"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaPills,
  FaHospital,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp,
  RefreshCw,
  Pill,
  Building2,
  Package,
  DollarSign,
  Hash,
  Users, 
  UserPlus, 
  Heart,
  Activity,
  Calendar,
  Zap,
  User,
  Plus
} from 'lucide-react';
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import MedicineTable from "./components/MedicineTable";
import MedicineDetailModal from "./components/MedicineDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function MedicinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  
  // Modal state
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Check if user is superadmin for API Documentation access
  const canViewApiDocumentation = user?.role === "SUPERADMIN";
  
  // Check if user has access to medicine page
  const hasAccess = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
  
  // Redirect if user doesn't have access
  useEffect(() => {
    if (isLoaded && !hasAccess) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push('/dashboard');
    }
  }, [isLoaded, hasAccess, router]);

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/clinics');
      if (response.ok) {
        const result = await response.json();
        setClinics(result.data || []);
      }
    } catch (error) {

    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      let url = `/api/medicine?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
      
      if (selectedClinicId) {
        url += `&clinic_id=${encodeURIComponent(selectedClinicId)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();

        throw new Error("Invalid response format - expected JSON");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "API returned error");
      }

      if (!result.data) {

        setMedicines([]);
        setMetadata(result.pagination || {});
        setTotalPages(result.pagination?.totalPages || 0);
        return;
      }

      setMedicines(result.data);
      setMetadata(result.pagination || {});
      setTotalPages(result.pagination?.totalPages || 0);

    } catch (error) {

      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setMedicines([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchMedicines();
      setIsLoaded(true);
    }
  }, [search, page, limit, selectedClinicId, hasAccess]);

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

  const handleClinicChange = (e) => {
    setSelectedClinicId(e.target.value);
    setPage(1);
  };

  const handleShowDetail = (medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedMedicine(null);
  };

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

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchMedicines();
    toast.success("Data berhasil diperbarui");
  };

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                <span className="mr-2">💊</span>
                Manajemen Obat
              </div>
              <Link
                href="/medicine/new"
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white hover:bg-white/30 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Obat
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
              Manajemen <span className="text-yellow-300">Obat</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl">
              Kelola data obat dengan informasi lengkap dan terstruktur
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {metadata.total || 0}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Obat</p>
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
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <Activity className="w-4 h-4 mr-1" />
                Aktif
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {clinics.filter(c => c.is_active).length}
              </p>
              <p className="text-sm text-gray-600 font-medium">Klinik Aktif</p>
              <p className="text-xs text-gray-500 mt-1">
                Yang memiliki obat
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
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-yellow-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                Rata-rata
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {medicines.length > 0 
                  ? (medicines.reduce((sum, med) => sum + (med.HNA || 0), 0) / medicines.length).toFixed(0)
                  : '0'
                }
              </p>
              <p className="text-sm text-gray-600 font-medium">Rata-rata HNA</p>
              <p className="text-xs text-gray-500 mt-1">
                Harga Netto Apotek
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
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-purple-600">
                <Calendar className="w-4 h-4 mr-1" />
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

        {/* Search & Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter
              </h2>
              <p className="text-gray-600 mt-2">Cari obat berdasarkan nama, deskripsi, atau kode KFA</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari obat (nama, deskripsi, kode KFA)..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-l-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-r-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Clinic Filter */}
            <div className="lg:w-64">
              <select
                value={selectedClinicId}
                onChange={handleClinicChange}
                className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm"
              >
                <option value="">Semua Klinik</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Search */}
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {search && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Hasil pencarian untuk:</span> "{search}"
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
                  Data Obat
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap obat yang terdaftar dalam sistem
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Terdaftar</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Pill className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Obat</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : (
              <>
                <MedicineTable
                  medicines={medicines}
                  loading={loading}
                  onRefresh={handleRefresh}
                  onShowDetail={handleShowDetail}
                />

                {/* Data Info and Pagination */}
                <div className="table-pagination-wrapper">
                  {/* Data info and pagination controls */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Data info */}
                      <div className="text-sm text-gray-600">
                        Menampilkan{" "}
                        <span className="font-semibold text-blue-600">
                          {((page - 1) * limit) + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-semibold text-blue-600">
                          {Math.min(page * limit, metadata.total || 0)}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-blue-600">{metadata.total || 0}</span>{" "}
                        data obat
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
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="mobile-pagination-container">
                      {/* Mobile Compact Pagination */}
                      <div className="lg:hidden mobile-pagination-compact">
                        <div className="mobile-pagination-info">
                          Halaman {page} dari {totalPages}
                        </div>
                        <div className="mobile-pagination-controls">
                          <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman pertama"
                          >
                            <FaAngleDoubleLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman sebelumnya"
                          >
                            <FaChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="mobile-pagination-page-info">
                            {page}
                          </span>
                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman selanjutnya"
                          >
                            <FaChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman terakhir"
                          >
                            <FaAngleDoubleRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Desktop Full Pagination */}
                      <div className="hidden lg:block">
                        <div className="mobile-pagination-group">
                          {/* First page button */}
                          <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="mobile-pagination-button"
                            title="Halaman pertama"
                          >
                            <FaAngleDoubleLeft className="h-4 w-4" />
                          </button>

                          {/* Previous page button */}
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="mobile-pagination-button"
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
                                  className="mobile-pagination-dots"
                                >
                                  {pageNum}
                                </span>
                              );
                            }

                            return (
                              <button
                                key={index}
                                onClick={() => setPage(pageNum)}
                                className={`mobile-pagination-number text-black mobile-pagination-touch ${
                                  pageNum === page
                                    ? "mobile-pagination-number.active"
                                    : "mobile-pagination-number.inactive"
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
                            className="mobile-pagination-button"
                            title="Halaman selanjutnya"
                          >
                            <FaChevronRight className="h-4 w-4" />
                          </button>

                          {/* Last page button */}
                          <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="mobile-pagination-button"
                            title="Halaman terakhir"
                          >
                            <FaAngleDoubleRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* API Documentation - Only visible to Superadmin */}
        {canViewApiDocumentation && (
          <ApiDocumentation
            title="Medicine API Documentation"
            endpoints={[
              {
                method: "GET",
                path: "/api/medicine",
                description: "Get all medicines with pagination and filtering",
                parameters: [
                  { name: "clinic_id", type: "number", description: "Filter by clinic ID" },
                  { name: "search", type: "string", description: "Search in Detail, DetailDescription, or KFA_Code" },
                  { name: "page", type: "number", description: "Page number (default: 1)" },
                  { name: "limit", type: "number", description: "Items per page (default: 10)" }
                ],
                response: {
                  success: true,
                  data: "Array of medicine objects",
                  pagination: "Pagination metadata"
                }
              },
              {
                method: "POST",
                path: "/api/medicine",
                description: "Create a new medicine",
                parameters: [
                  { name: "clinic_id", type: "number", required: true, description: "Clinic ID" },
                  { name: "Detail", type: "string", required: true, description: "Medicine name" },
                  { name: "DetailDescription", type: "string", description: "Medicine description" },
                  { name: "HNA", type: "number", description: "Net price" },
                  { name: "HNAJual", type: "number", description: "Selling price" },
                  { name: "SmallUnit", type: "string", description: "Small unit (e.g., Tablet)" },
                  { name: "MediumUnit", type: "string", description: "Medium unit (e.g., Strip)" },
                  { name: "LargeUnit", type: "string", description: "Large unit (e.g., Box)" },
                  { name: "factor_3", type: "number", description: "Conversion factor" },
                  { name: "QtyMin", type: "number", description: "Minimum quantity" },
                  { name: "KFA_Code", type: "string", description: "KFA code" },
                  { name: "APLN_Code", type: "string", description: "APLN code" }
                ],
                response: {
                  success: true,
                  message: "Medicine created successfully",
                  data: "Created medicine object"
                }
              },
              {
                method: "GET",
                path: "/api/medicine/[id]",
                description: "Get specific medicine by ID",
                parameters: [
                  { name: "id", type: "number", required: true, description: "Medicine ID" }
                ],
                response: {
                  success: true,
                  data: "Medicine object with clinic information"
                }
              },
              {
                method: "PUT",
                path: "/api/medicine/[id]",
                description: "Update medicine",
                parameters: [
                  { name: "id", type: "number", required: true, description: "Medicine ID" },
                  { name: "clinic_id", type: "number", description: "Clinic ID" },
                  { name: "Detail", type: "string", description: "Medicine name" },
                  { name: "DetailDescription", type: "string", description: "Medicine description" },
                  { name: "HNA", type: "number", description: "Net price" },
                  { name: "HNAJual", type: "number", description: "Selling price" },
                  { name: "SmallUnit", type: "string", description: "Small unit" },
                  { name: "MediumUnit", type: "string", description: "Medium unit" },
                  { name: "LargeUnit", type: "string", description: "Large unit" },
                  { name: "factor_3", type: "number", description: "Conversion factor" },
                  { name: "QtyMin", type: "number", description: "Minimum quantity" },
                  { name: "UserIDModify", type: "string", description: "User ID who modified" },
                  { name: "KFA_Code", type: "string", description: "KFA code" },
                  { name: "APLN_Code", type: "string", description: "APLN code" }
                ],
                response: {
                  success: true,
                  message: "Medicine updated successfully",
                  data: "Updated medicine object"
                }
              },
              {
                method: "DELETE",
                path: "/api/medicine/[id]",
                description: "Delete medicine permanently (set GCRecord = 1)",
                parameters: [
                  { name: "id", type: "number", required: true, description: "Medicine ID" }
                ],
                response: {
                  success: true,
                  message: "Medicine permanently deleted"
                }
              }
            ]}
            notes={[
              "Access Control: Only Superadmin and Admin can access medicine data",
              "Status Management: Use the status toggle in edit form to activate/deactivate medicines",
              "Delete: Medicines are permanently deleted (GCRecord = 1)",
              "Clinic Association: All medicines must be associated with a valid clinic",
              "Price Format: HNA and HNAJual should be in decimal format",
              "Units: SmallUnit, MediumUnit, LargeUnit define the packaging units",
              "Codes: KFA_Code and APLN_Code are optional classification codes"
            ]}
          />
        )}

        {/* Mobile Floating Action Button */}
        <Link
          href="/medicine/new"
          className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50"
          title="Tambah Obat"
        >
          <FaPlus className="h-6 w-6" />
        </Link>

        {/* Medicine Detail Modal */}
        {showDetailModal && (
          <MedicineDetailModal
            medicine={selectedMedicine}
            onClose={handleCloseDetail}
            onEdit={() => {
              handleCloseDetail();
              router.push(`/medicine/${selectedMedicine.ElementDetailKey}/edit`);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 