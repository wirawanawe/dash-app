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
    setSearch(e.target.value);
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
      <div className="container mx-auto px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Pasien</h1>
          <Link
            href="/patients/new"
            className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
          >
            <FaPlus className="mr-2" />
            Tambah Pasien
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari pasien..."
              value={search}
              onChange={handleSearch}
              className="w-full px-4 py-2 rounded-lg text-black border focus:outline-none focus:ring-2 focus:ring-[#E22345] pl-10"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
          </div>
        ) : (
          <>
            <PatientTable patients={patients} onRefresh={fetchPatients} />

            {/* Data per page selector and pagination info */}
            <div className="mt-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Menampilkan {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, metadata.total || 0)} dari{" "}
                  {metadata.total || 0} data
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="limit" className="text-sm text-gray-700">
                    Data per halaman:
                  </label>
                  <select
                    id="limit"
                    value={limit}
                    onChange={handleLimitChange}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E22345] focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First page button */}
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title="Halaman pertama"
                  >
                    <FaAngleDoubleLeft className="w-4 h-4" />
                  </button>

                  {/* Previous page button */}
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title="Halaman sebelumnya"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof pageNum === "number" && setPage(pageNum)
                        }
                        disabled={pageNum === "..."}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pageNum === page
                            ? "bg-[#E22345] text-white border border-[#E22345]"
                            : pageNum === "..."
                            ? "text-gray-400 cursor-default"
                            : "text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  {/* Next page button */}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title="Halaman selanjutnya"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last page button */}
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title="Halaman terakhir"
                  >
                    <FaAngleDoubleRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
