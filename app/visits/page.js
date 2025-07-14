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
  FaFilter,
} from "react-icons/fa";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import VisitForm from "./components/VisitForm";
import VisitDetailModal from "./components/VisitDetailModal";

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchDateInput, setSearchDateInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    doctorId: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    doctorId: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const fetchVisits = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add date search if exists
      if (searchDate) {
        params.append("searchDate", searchDate);
      }

      // Add date filters if they exist
      if (appliedFilters.startDate) {
        params.append("tglawal", appliedFilters.startDate);
      }
      if (appliedFilters.endDate) {
        params.append("tglakhir", appliedFilters.endDate);
      }

      // Add status filter if exists
      if (appliedFilters.status) {
        params.append("status", appliedFilters.status);
      }

      // Add doctor filter if exists
      if (appliedFilters.doctorId) {
        params.append("doctorId", appliedFilters.doctorId);
      }

      const response = await fetch(`/api/visits?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data kunjungan");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("Invalid data format");
      }

      setVisits(result.data);
      setMetadata(result.pagination || {});
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setVisits([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/settings/doctors");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [
    search,
    searchDate,
    page,
    limit,
    appliedFilters.startDate,
    appliedFilters.endDate,
    appliedFilters.status,
    appliedFilters.doctorId,
  ]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setSearchDate(searchDateInput);
    setPage(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchDateChange = (e) => {
    setSearchDateInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setSearchDateInput("");
    setSearchDate("");
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(
        "/api/visits" + (selectedVisit ? `/${selectedVisit.id}` : ""),
        {
          method: selectedVisit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      toast.success(
        selectedVisit
          ? "Kunjungan berhasil diupdate"
          : "Kunjungan berhasil ditambahkan"
      );
      setShowForm(false);
      fetchVisits();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menyimpan kunjungan");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus kunjungan ini?")) {
      try {
        const response = await fetch(`/api/visits/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete");

        toast.success("Kunjungan berhasil dihapus");
        fetchVisits();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus kunjungan");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Don't reset page or apply filters automatically
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      doctorId: "",
      startDate: "",
      endDate: "",
    });
    setAppliedFilters({
      status: "",
      doctorId: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
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
      <div className="container mx-auto px-2 lg:px-4 pb-8 mobile-safe">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 lg:mb-6 gap-4 lg:gap-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Daftar Kunjungan
            </h1>
          </div>
        </div>

        <div className="mb-4 lg:mb-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-2 mb-4"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari kunjungan (pasien, dokter, keluhan)..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-2 rounded-lg text-black border focus:outline-none focus:ring-2 focus:ring-[#E22345] pl-10 mobile-input"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            <button
              type="submit"
              className="bg-[#E22345] text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors mobile-btn"
            >
              <FaSearch />
              <span className="hidden sm:inline">Cari</span>
            </button>
            <button
              type="button"
              onClick={() => {
                console.log(
                  "Filter button clicked, current showFilters:",
                  showFilters
                );
                setShowFilters(!showFilters);
              }}
              className={`${
                showFilters ? "bg-blue-600" : "bg-blue-500"
              } text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors mobile-btn`}
            >
              <FaFilter />
              <span className="hidden sm:inline">
                {showFilters ? "Tutup Filter" : "Buka Filter"}
              </span>
              <span className="sm:hidden">
                {showFilters ? "Tutup" : "Filter"}
              </span>
            </button>
            {(search || searchDate) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors mobile-btn"
              >
                Reset
              </button>
            )}
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Filter Kunjungan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Awal Filter
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#E22345] mobile-input"
                    placeholder="Pilih tanggal awal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Akhir Filter
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#E22345] mobile-input"
                    placeholder="Pilih tanggal akhir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#E22345] mobile-input"
                  >
                    <option value="">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dokter
                  </label>
                  <select
                    name="doctorId"
                    value={filters.doctorId}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#E22345] mobile-input"
                  >
                    <option value="">Semua Dokter</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors mobile-btn"
                >
                  Reset Filter
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600 transition-colors mobile-btn"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}

          {(search || searchDate) && (
            <div className="mt-2 text-sm text-gray-600">
              Hasil pencarian untuk:
              {search && <span className="font-medium ml-1">"{search}"</span>}
              {search && searchDate && <span className="mx-1">dan</span>}
              {searchDate && (
                <span className="font-medium">
                  tanggal {new Date(searchDate).toLocaleDateString("id-ID")}
                </span>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {(appliedFilters.startDate ||
            appliedFilters.endDate ||
            appliedFilters.status ||
            appliedFilters.doctorId) && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              {appliedFilters.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Dari: {appliedFilters.startDate}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, startDate: "" }));
                      setAppliedFilters((prev) => ({ ...prev, startDate: "" }));
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Sampai: {appliedFilters.endDate}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, endDate: "" }));
                      setAppliedFilters((prev) => ({ ...prev, endDate: "" }));
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {appliedFilters.status}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, status: "" }));
                      setAppliedFilters((prev) => ({ ...prev, status: "" }));
                    }}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.doctorId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Dokter:{" "}
                  {doctors.find(
                    (d) => d.id.toString() === appliedFilters.doctorId
                  )?.name || appliedFilters.doctorId}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, doctorId: "" }));
                      setAppliedFilters((prev) => ({ ...prev, doctorId: "" }));
                    }}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
          </div>
        ) : (
          <>
            {/* Visits Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No. Kunjungan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pasien
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dokter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keluhan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">Tanggal</div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visits.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          Tidak ada data kunjungan
                        </td>
                      </tr>
                    ) : (
                      visits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {visit.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.patient?.name || "-"}
                            </div>
                            <div className="text-sm text-gray-500">
                              MR: {visit.patient?.mrNumber || "-"}
                            </div>
                            {visit.patient?.nip && (
                              <div className="text-sm text-gray-500">
                                NIP: {visit.patient.nip}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visit.doctor?.name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visit.room || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {visit.complaint || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                visit.status === "Selesai"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {visit.status || "Aktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {visit.visitDate
                              ? new Date(visit.visitDate).toLocaleDateString(
                                  "id-ID"
                                )
                              : visit.createdAt
                              ? new Date(visit.createdAt).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedVisitDetail(visit);
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 mr-3"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVisit(visit);
                                setShowForm(true);
                              }}
                              className="text-[#E22345] hover:text-red-700 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data info and pagination controls */}
            <div className="mt-6 mb-4 bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Data info */}
                <div className="text-sm text-gray-600">
                  Menampilkan{" "}
                  <span className="font-semibold">
                    {(page - 1) * limit + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold">
                    {Math.min(page * limit, metadata.total || 0)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold">{metadata.total || 0}</span>{" "}
                  data
                </div>

                {/* Items per page */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
                  <label
                    htmlFor="limit-visits"
                    className="text-sm text-gray-700 whitespace-nowrap"
                  >
                    Data per halaman:
                  </label>
                  <select
                    id="limit-visits"
                    value={limit}
                    onChange={handleLimitChange}
                    className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none focus:ring-0 mobile-input"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* First page button */}
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                    title="Halaman pertama"
                  >
                    <FaAngleDoubleLeft className="h-4 w-4" />
                  </button>

                  {/* Previous page button */}
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                    title="Halaman sebelumnya"
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  {getPageNumbers().map((pageNum, index) => {
                    if (pageNum === "...") {
                      return (
                        <span
                          key={index}
                          className="px-3 py-2 text-gray-400 border-r border-gray-200 select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium border-r border-gray-200 transition-colors ${
                          pageNum === page
                            ? "bg-[#E22345] text-white hover:bg-red-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
                    title="Halaman selanjutnya"
                  >
                    <FaChevronRight className="h-4 w-4" />
                  </button>

                  {/* Last page button */}
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman terakhir"
                  >
                    <FaAngleDoubleRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Visit Detail Modal */}
        {showDetailModal && (
          <VisitDetailModal
            visit={selectedVisitDetail}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedVisitDetail(null);
            }}
          />
        )}

        {/* Visit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedVisit ? "Edit Kunjungan" : "Tambah Kunjungan"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedVisit(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <VisitForm
                visit={selectedVisit}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedVisit(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
