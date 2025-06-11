"use client";

import { useState, useEffect } from "react";
import TreatmentForm from "./components/TreatmentForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const response = await fetch("/api/settings/treatments");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setTreatments(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data tindakan");
      setTreatments([]);
      setIsLoading(false);
    }
  };

  const handleEdit = (treatment) => {
    setSelectedTreatment(treatment);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus tindakan ini?")) {
      try {
        const response = await fetch(`/api/settings/treatments/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus tindakan");

        toast.success("Tindakan berhasil dihapus");
        fetchTreatments();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus tindakan");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedTreatment(null);
    fetchTreatments();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedTreatment(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Tindakan</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah Tindakan
          </button>
        </div>

        {showForm && (
          <TreatmentForm
            treatment={selectedTreatment}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nama Tindakan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Tarif
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
                {Array.isArray(treatments) &&
                  treatments.map((treatment) => (
                    <tr key={treatment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {treatment.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {treatment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatPrice(treatment.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                            treatment.status === "Aktif"
                              ? "text-green-800 bg-green-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {treatment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(treatment.id)}
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
