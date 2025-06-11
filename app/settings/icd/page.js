"use client";

import { useState, useEffect } from "react";
import ICDForm from "./components/ICDForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function ICDPage() {
  const [icds, setICDs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedICD, setSelectedICD] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchICDs();
  }, []);

  const fetchICDs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/icd", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setICDs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data ICD");
      setICDs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (icd) => {
    setSelectedICD(icd);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus ICD ini?")) {
      try {
        const response = await fetch(`/api/settings/icd/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus ICD");

        toast.success("ICD berhasil dihapus");
        fetchICDs();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus ICD");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedICD(null);
    fetchICDs();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedICD(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data ICD</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah ICD
          </button>
        </div>

        {showForm && (
          <ICDForm
            icd={selectedICD}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Disease
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(icds) &&
                  icds.map((icd) => (
                    <tr key={icd.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {icd.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {icd.disease}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {icd.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {icd.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        <button
                          onClick={() => handleEdit(icd)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(icd.id)}
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
