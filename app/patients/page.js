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
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import PatientTable from "./components/PatientTable";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/patients?search=${search}&page=${page}&limit=${limit}`
      );

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

      setPatients(result.data);
      setMetadata(result.pagination || {});
      setTotalPages(result.pagination?.totalPages || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setPatients([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, page, limit]);

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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 gap-4 lg:gap-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Daftar Pasien
          </h1>

          {/* Desktop Add Button */}
          <Link
            href="/patients/new"
            className="hidden lg:flex bg-[#E22345] text-white px-6 py-2 rounded-lg hover:bg-red-600 items-center gap-2 transition-colors"
          >
            <FaPlus />
            Tambah Pasien
          </Link>
        </div>

        <div className="mb-4 lg:mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari pasien (nama, NIK, No. MR)..."
                value={searchInput}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-2 rounded-lg text-black border focus:outline-none focus:ring-2 focus:ring-[#E22345] pl-10 mobile-input text-sm lg:text-base"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              type="submit"
              className="bg-[#E22345] text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors mobile-btn"
            >
              <FaSearch className="lg:hidden" />
              <span className="hidden lg:inline">Cari</span>
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base"
              >
                Reset
              </button>
            )}
          </form>
          {search && (
            <div className="mt-2 text-xs lg:text-sm text-gray-600">
              Hasil pencarian untuk: "
              <span className="font-medium">{search}</span>"
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
          </div>
        ) : (
          <>
            <PatientTable patients={patients} onRefresh={fetchPatients} />

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
                    htmlFor="limit"
                    className="text-sm text-gray-700 whitespace-nowrap"
                  >
                    Data per halaman:
                  </label>
                  <select
                    id="limit"
                    value={limit}
                    onChange={handleLimitChange}
                    className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none focus:ring-0 mobile-input"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mb-8">
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
                    if (typeof pageNum !== "number") {
                      return (
                        <span
                          key={index}
                          className="px-3 py-2 text-gray-400 border-r border-gray-200 select-none"
                        >
                          {pageNum}
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

        {/* Mobile Floating Action Button */}
        <Link
          href="/patients/new"
          className="lg:hidden fixed bottom-6 right-6 bg-[#E22345] text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10 mobile-btn"
          title="Tambah Pasien"
        >
          <FaPlus className="h-6 w-6" />
        </Link>
      </div>
    </DashboardLayout>
  );
}
