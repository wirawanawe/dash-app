"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import VisitForm from "./components/VisitForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function VisitsPage() {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    doctorId: "",
    startDate: "",
    endDate: "",
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchVisits();
    fetchDoctors();
  }, []);

  useEffect(() => {
    let filtered = [...visits];

    // Filter berdasarkan pencarian
    if (searchTerm.length >= 1) {
      filtered = filtered.filter((visit) =>
        Object.values({
          patientName: visit.patient.name.toLowerCase(),
          mrNumber: visit.patient.mrNumber.toLowerCase(),
          doctorName: visit.doctor.name.toLowerCase(),
          room: visit.room.toLowerCase(),
          status: visit.status.toLowerCase(),
          complaint: (visit.complaint || "").toLowerCase(),
        }).some((value) => value.includes(searchTerm.toLowerCase()))
      );
    }

    // Filter berdasarkan status
    if (filters.status) {
      filtered = filtered.filter((visit) => visit.status === filters.status);
    }

    // Filter berdasarkan dokter
    if (filters.doctorId) {
      filtered = filtered.filter(
        (visit) => visit.doctorId.toString() === filters.doctorId
      );
    }

    // Filter berdasarkan tanggal
    if (filters.startDate) {
      filtered = filtered.filter(
        (visit) => new Date(visit.createdAt) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (visit) => new Date(visit.createdAt) <= new Date(filters.endDate)
      );
    }

    setFilteredVisits(filtered);
  }, [searchTerm, filters, visits]);

  const fetchVisits = async () => {
    try {
      setIsLoading(true);

      // Attempt to fetch visits data with error handling
      let response;
      try {
        response = await fetch("/api/visits");
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
      } catch (networkError) {
        console.error("Network error:", networkError);
        // Use empty array as fallback when API fails
        setVisits([]);
        setFilteredVisits([]);
        setIsLoading(false);
        toast.error("Tidak dapat terhubung ke server. Coba lagi nanti.");
        return;
      }

      // Parse the response data
      try {
        const data = await response.json();
        setVisits(Array.isArray(data) ? data : []);
        setIsLoading(false);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        setVisits([]);
        setFilteredVisits([]);
        setIsLoading(false);
        toast.error("Gagal memproses data dari server");
      }
    } catch (error) {
      console.error("Error in fetchVisits:", error);
      setVisits([]);
      setFilteredVisits([]);
      setIsLoading(false);
      toast.error("Gagal mengambil data kunjungan");
    }
  };

  const fetchDoctors = async () => {
    try {
      // Attempt to fetch doctors data with error handling
      let response;
      try {
        response = await fetch("/api/settings/doctors");
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
      } catch (networkError) {
        console.error("Network error fetching doctors:", networkError);
        // Use empty array as fallback when API fails
        setDoctors([]);
        return;
      }

      // Parse the response data
      try {
        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (parseError) {
        console.error("JSON parsing error for doctors:", parseError);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error in fetchDoctors:", error);
      setDoctors([]);
    }
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
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      doctorId: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Data Kunjungan</h1>
          <button
            onClick={() => {
              setSelectedVisit(null);
              setShowForm(true);
            }}
            className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Tambah Kunjungan
          </button>
        </div>

        {showForm && (
          <VisitForm
            visit={selectedVisit}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Search and Filter Bar */}
        <div className="mb-4 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berdasarkan nama pasien, no RM, dokter, ruangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Dalam Pemeriksaan">Dalam Pemeriksaan</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>

            <select
              name="doctorId"
              value={filters.doctorId}
              onChange={handleFilterChange}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
            >
              <option value="">Semua Dokter</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              placeholder="Tanggal Mulai"
            />

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              placeholder="Tanggal Selesai"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    No. RM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nama Pasien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Dokter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Ruangan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Keluhan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {new Date(visit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {visit.patient.mrNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {visit.patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {visit.doctor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {visit.room}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {visit.complaint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      <span
                        className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                          visit.status === "Selesai"
                            ? "text-green-800 bg-green-100"
                            : visit.status === "Menunggu"
                            ? "text-yellow-800 bg-yellow-100"
                            : visit.status === "Dalam Pemeriksaan"
                            ? "text-blue-800 bg-blue-100"
                            : "text-red-800 bg-red-100"
                        }`}
                      >
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      <button
                        onClick={() => {
                          setSelectedVisit(visit);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
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
                ))}
                {filteredVisits.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data yang sesuai dengan pencarian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
