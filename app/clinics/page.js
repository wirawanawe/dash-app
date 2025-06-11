"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import ClinicForm from "./components/ClinicForm";
import DashboardLayout from "@/components/DashboardLayout";

// Debounce function to prevent frequent API calls
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

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
  const [dataInitialized, setDataInitialized] = useState(false);
  const fetchInProgress = useRef(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";

  // Memoize fetchClinics to avoid recreating the function on each render
  const fetchClinicsInternal = useCallback(
    async (forced = false) => {
      // Skip loading if already initialized and not forced
      if (
        (dataInitialized && !forced && clinics.length > 0) ||
        fetchInProgress.current
      ) {
        return;
      }

      try {
        fetchInProgress.current = true;
        setLoading(true);
        const response = await fetch(
          `/api/clinics?search=${encodeURIComponent(searchQuery)}&page=${
            pagination.page
          }&limit=${pagination.limit}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch clinics");
        }

        // Handle empty data or invalid response structure
        if (!data || !Array.isArray(data.data)) {
          console.error("Invalid data structure received:", data);
          setClinics([]);
        } else {
          setClinics(data.data);
        }

        // Safely update pagination
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        }));

        // Mark data as initialized after first successful load
        setDataInitialized(true);
      } catch (error) {
        console.error("Error fetching clinics:", error);
        toast.error("Gagal memuat data klinik");
        // Set empty data on error to avoid UI issues
        setClinics([]);
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    },
    [searchQuery, pagination.page, pagination.limit, clinics.length]
  );

  // Create a debounced version of the fetch function
  const fetchClinics = useCallback(
    debounce((forced = false) => {
      fetchClinicsInternal(forced);
    }, 300),
    [fetchClinicsInternal]
  );

  // Initial fetch when component mounts
  useEffect(() => {
    if (user && !dataInitialized) {
      fetchClinics();
    }
  }, [user, dataInitialized, fetchClinics]);

  // Handle pagination changes
  useEffect(() => {
    if (dataInitialized && (pagination.page > 1 || searchQuery !== "")) {
      fetchClinics(true);
    }
  }, [pagination.page, searchQuery, fetchClinics, dataInitialized]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleInputChange = (e) => {
    setSearchInputValue(e.target.value);
  };

  const handleAddClinic = () => {
    setEditingClinic(null);
    setShowForm(true);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinic(clinic);
    setShowForm(true);
  };

  const handleDeleteClinic = async (id) => {
    if (!confirm("Anda yakin ingin menghapus klinik ini?")) return;

    try {
      const response = await fetch(`/api/clinics/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete clinic");
      }

      toast.success("Klinik berhasil dihapus");
      fetchClinics(true);
    } catch (error) {
      console.error("Error deleting clinic:", error);
      toast.error(error.message || "Gagal menghapus klinik");
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingClinic
        ? `/api/clinics/${editingClinic.id}`
        : "/api/clinics";

      const method = editingClinic ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save clinic");
      }

      toast.success(
        editingClinic
          ? "Klinik berhasil diperbarui"
          : "Klinik berhasil ditambahkan"
      );

      setShowForm(false);
      fetchClinics(true);
    } catch (error) {
      console.error("Error saving clinic:", error);
      toast.error(error.message || "Gagal menyimpan klinik");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Manajemen Klinik</h1>
          {isAdmin && !showForm && (
            <button
              onClick={handleAddClinic}
              className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Tambah Klinik
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <ClinicForm
            clinic={editingClinic}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Cari klinik..."
              value={searchInputValue}
              onChange={handleInputChange}
              className="p-2 border rounded-l-lg w-full text-black"
            />
            <button
              type="submit"
              className="bg-[#E22345] text-white px-4 py-2 rounded-r-lg hover:bg-red-600"
            >
              Cari
            </button>
          </form>
        </div>

        {loading && !dataInitialized ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Nama Klinik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Tanggal Dibuat
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clinics.length > 0 ? (
                    clinics.map((clinic, index) => (
                      <tr key={clinic.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {clinic.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {clinic.name}
                        </td>
                        <td className="px-6 py-4 text-black">
                          {clinic.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {new Date(clinic.created_at).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-black">
                            <button
                              onClick={() => handleEditClinic(clinic)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(clinic.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-4 text-center text-black"
                      >
                        Tidak ada data klinik
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {"<<"}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {"<"}
                  </button>
                  <span className="px-3 py-1">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {">"}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {">>"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
