"use client";

import { useState, useEffect } from "react";
import ExaminationForm from "./components/ExaminationForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function ExaminationsPage() {
  const [examinations, setExaminations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExaminations();
  }, []);

  const fetchExaminations = async () => {
    try {
      setIsLoading(true);

      // Attempt to fetch examinations data with improved error handling
      let response;
      try {
        response = await fetch("/api/examinations");
        if (!response.ok) {
          // Try to get error details from response
          const errorData = await response.json().catch(() => ({}));
          console.error("Server error:", response.status, errorData);
          throw new Error(
            `HTTP error! Status: ${response.status}. ${errorData.message || ""}`
          );
        }
      } catch (networkError) {
        console.error("Network error:", networkError);
        // Use empty array as fallback when API fails
        setExaminations([]);
        setIsLoading(false);

        // Check for specific error types
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

      // Parse the response data
      try {
        const data = await response.json();
        setExaminations(Array.isArray(data) ? data : []);
        setIsLoading(false);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        setExaminations([]);
        setIsLoading(false);
        toast.error("Gagal memproses data dari server");
      }
    } catch (error) {
      console.error("Error in fetchExaminations:", error);
      setExaminations([]);
      setIsLoading(false);
      toast.error("Gagal mengambil data pemeriksaan");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(
        "/api/examinations" +
          (selectedExamination ? `/${selectedExamination.id}` : ""),
        {
          method: selectedExamination ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      toast.success(
        selectedExamination
          ? "Pemeriksaan berhasil diupdate"
          : "Pemeriksaan berhasil ditambahkan"
      );
      setShowForm(false);
      fetchExaminations();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menyimpan pemeriksaan");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus pemeriksaan ini?")) {
      try {
        const response = await fetch(`/api/examinations/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete");
        toast.success("Pemeriksaan berhasil dihapus");
        fetchExaminations();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus pemeriksaan");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Data Pemeriksaan</h1>
          <button
            onClick={() => {
              setSelectedExamination(null);
              setShowForm(true);
            }}
            className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Tambah Pemeriksaan
          </button>
        </div>

        {showForm && (
          <ExaminationForm
            examination={selectedExamination}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Pasien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Dokter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Tekanan Darah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Detak Jantung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Suhu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    BB/TB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examinations.map((examination) => (
                  <tr key={examination.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {new Date(examination.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.visit.patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.visit.doctor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.bloodPressure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.heartRate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.temperature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {examination.weight}/{examination.height}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      <button
                        onClick={() => {
                          setSelectedExamination(examination);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(examination.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
