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
  Eye,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import PatientTable from "./components/PatientTable";
import PatientDetailModal from "./components/PatientDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState([]); // Store ALL patients
  const [patients, setPatients] = useState([]); // Paginated patients for display
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    active: 0,
  });
  
  // Check if user is superadmin for API Documentation access
  const canViewApiDocumentation = user?.role === "SUPERADMIN";

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Build query parameters - Fetch ALL data (no pagination at API level)
      const params = new URLSearchParams({
        search,
        page: "1",           // Always fetch from page 1
        limit: "10000",      // Fetch all data (large limit)
        sortBy: "name",      // Sort by name
        sortOrder: "asc",    // Ascending (A-Z)
      });

      const response = await fetch(`/api/patients?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data pasien");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("Invalid data format");
      }

      // Store ALL patients data
      setAllPatients(result.data);
      
      // Calculate client-side pagination
      const totalData = result.data.length;
      const totalPagesCalculated = Math.ceil(totalData / limit);
      
      // Apply pagination to get current page data
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = result.data.slice(startIndex, endIndex);
      
      setPatients(paginatedData);
      setMetadata({ total: totalData });
      setTotalPages(totalPagesCalculated);
      
      // Calculate stats
      const maleCount = result.data.filter(p => p.gender?.toLowerCase() === 'laki-laki' || p.gender?.toLowerCase() === 'l').length;
      const femaleCount = result.data.filter(p => p.gender?.toLowerCase() === 'perempuan' || p.gender?.toLowerCase() === 'p').length;
      
      setStats({
        total: totalData,
        male: maleCount,
        female: femaleCount,
        active: totalData, // All patients are considered active
      });
      
      console.log(`[Patients] Total data: ${totalData}, Page: ${page}, Showing: ${paginatedData.length}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setAllPatients([]);
      setPatients([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when search changes (not when page/limit changes)
  useEffect(() => {
    fetchPatients();
    setIsLoaded(true);
  }, [search]);

  // Apply client-side pagination when page or limit changes
  useEffect(() => {
    if (allPatients.length > 0) {
      const totalData = allPatients.length;
      const totalPagesCalculated = Math.ceil(totalData / limit);
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allPatients.slice(startIndex, endIndex);
      
      setPatients(paginatedData);
      setTotalPages(totalPagesCalculated);
      
      console.log(`[Pagination] Page: ${page}, Limit: ${limit}, Showing: ${paginatedData.length} of ${totalData}`);
    }
  }, [page, limit, allPatients]);

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

  // Modal handlers
  const handleShowDetail = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedPatient(null);
    setShowDetailModal(false);
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
                Manajemen Pasien
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
                Daftar <span className="text-yellow-300">Pasien</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl">
                Kelola data pasien, riwayat medis, dan informasi pribadi dalam satu sistem terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchPatients}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.total}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Pasien</p>
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
              <div className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                Live
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {stats.active}
              </p>
              <p className="text-sm text-gray-600 font-medium">Pasien Aktif</p>
              <p className="text-xs text-gray-500 mt-1">
                Sedang terdaftar
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
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-blue-600">
                <Heart className="w-4 h-4 mr-1" />
                Laki-laki
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.male}
              </p>
              <p className="text-sm text-gray-600 font-medium">Pasien Laki-laki</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0}% dari total
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
              <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-pink-600">
                <Heart className="w-4 h-4 mr-1" />
                Perempuan
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.female}
              </p>
              <p className="text-sm text-gray-600 font-medium">Pasien Perempuan</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0}% dari total
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
              <p className="text-gray-600 mt-2">Cari pasien berdasarkan nama, NIK, atau nomor MR</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari pasien (nama, NIK, No. MR)..."
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
                  Data Pasien
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap pasien yang terdaftar dalam sistem
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
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Pasien</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : (
              <>
                <PatientTable 
                  patients={patients} 
                  onRefresh={fetchPatients} 
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
                          {(page - 1) * limit + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-semibold text-blue-600">
                          {Math.min(page * limit, metadata.total || 0)}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-blue-600">{metadata.total || 0}</span>{" "}
                        data pasien
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
          <ApiDocumentation pageType="patients" />
        )}

        {/* Mobile Floating Action Button */}
        <Link
          href="/patients/new"
          className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50"
          title="Tambah Pasien"
        >
          <UserPlus className="h-6 w-6" />
        </Link>

        {/* Patient Detail Modal */}
        {showDetailModal && selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
