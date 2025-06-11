"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DoctorForm from "./components/DoctorForm";
import toast from "react-hot-toast";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (search = "") => {
    try {
      setIsLoading(true);

      let url = "/api/doctors";
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }

      let response;
      try {
        response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Server error:", response.status, errorData);
          throw new Error(
            `HTTP error! Status: ${response.status}. ${errorData.message || ""}`
          );
        }
      } catch (networkError) {
        console.error("Network error:", networkError);
        setDoctors([]);
        setIsLoading(false);

        if (
          networkError.message.includes("ER_ACCESS_DENIED_ERROR") ||
          networkError.message.includes("ECONNREFUSED")
        ) {
          toast.error(
            "Database connection error. Please check MySQL credentials."
          );
        } else if (networkError.message.includes("500")) {
          toast.error(
            "Server error: Database query failed. Please check server logs."
          );
        } else {
          toast.error("Tidak dapat terhubung ke server. Coba lagi nanti.");
        }
        return;
      }

      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchDoctors:", error);
      setDoctors([]);
      setIsLoading(false);
      toast.error("Gagal mengambil data dokter");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(
        "/api/doctors" + (selectedDoctor ? `/${selectedDoctor.id}` : ""),
        {
          method: selectedDoctor ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save");
      }

      toast.success(
        selectedDoctor
          ? "Dokter berhasil diupdate"
          : "Dokter berhasil ditambahkan"
      );
      setShowForm(false);
      fetchDoctors();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Gagal menyimpan dokter");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokter ini?")) {
      try {
        const response = await fetch(`/api/doctors/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete");
        toast.success("Dokter berhasil dihapus");
        fetchDoctors();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus dokter");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(searchTerm);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Manajemen Dokter</h1>
          <button
            onClick={() => {
              setSelectedDoctor(null);
              setShowForm(true);
            }}
            className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Tambah Dokter
          </button>
        </div>

        {showForm && (
          <DoctorForm
            doctor={selectedDoctor}
            onSubmit={handleSubmit}
            onCancel={() => {
              setSelectedDoctor(null);
              setShowForm(false);
            }}
          />
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari dokter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              type="submit"
              className="ml-2 bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cari
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E22345]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Spesialis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Nomor SIP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data dokter
                    </td>
                  </tr>
                ) : (
                  doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {doctor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {doctor.specialist || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {doctor.license_number || "-"}
                      </td>
                      <td className="px-6 py-4 text-black">
                        <div>{doctor.phone || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {doctor.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="inline mr-1" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
