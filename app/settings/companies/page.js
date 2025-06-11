"use client";

import { useState, useEffect } from "react";
import CompanyForm from "./components/CompanyForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/settings/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data perusahaan");
      setCompanies([]);
      setIsLoading(false);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus perusahaan ini?")) {
      try {
        const response = await fetch(`/api/settings/companies/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus perusahaan");

        toast.success("Perusahaan berhasil dihapus");
        fetchCompanies();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus perusahaan");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedCompany(null);
    fetchCompanies();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedCompany(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Perusahaan</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah Perusahaan
          </button>
        </div>

        {showForm && (
          <CompanyForm
            company={selectedCompany}
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
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
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
                {Array.isArray(companies) &&
                  companies.map((company) => (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {company.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {company.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {company.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
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
