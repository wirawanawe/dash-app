"use client";

import { useState, useEffect } from "react";
import InsuranceForm from "./components/InsuranceForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function InsurancePage() {
  const [insurances, setInsurances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const response = await fetch("/api/settings/insurance");
      const data = await response.json();
      setInsurances(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data asuransi");
      setIsLoading(false);
    }
  };

  const handleEdit = (insurance) => {
    setSelectedInsurance(insurance);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus asuransi ini?")) {
      try {
        const response = await fetch(`/api/settings/insurance/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus asuransi");

        toast.success("Asuransi berhasil dihapus");
        fetchInsurances();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus asuransi");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedInsurance(null);
    fetchInsurances();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedInsurance(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Asuransi</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] rounded-lg hover:bg-red-600"
          >
            Tambah Asuransi
          </button>
        </div>

        {showForm && (
          <InsuranceForm
            insurance={selectedInsurance}
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
                    Nama Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
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
                {Array.isArray(insurances) &&
                  insurances.map((insurance) => (
                    <tr key={insurance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {insurance.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {insurance.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {insurance.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                            insurance.status === "Aktif"
                              ? "text-green-800 bg-green-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {insurance.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <button
                          onClick={() => handleEdit(insurance)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(insurance.id)}
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
