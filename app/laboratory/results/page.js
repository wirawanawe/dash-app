"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FaSearch, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LaboratoryResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/laboratory/results");

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data hasil laboratorium");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(
    (result) =>
      result.patientName.toLowerCase().includes(search.toLowerCase()) ||
      result.labNumber.toLowerCase().includes(search.toLowerCase()) ||
      result.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hasil Laboratorium</h1>
          <button
            className="bg-[#E22345] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600"
            onClick={() => router.push("/laboratory/results/new")}
          >
            <FaPlus /> Tambah Hasil
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari hasil laboratorium..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Lab
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Pasien
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pemeriksaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hasil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai Normal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.labNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(result.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.testType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.result}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.normalValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.status === "Selesai"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          Lihat
                        </button>
                        <button className="text-[#E22345] hover:text-red-700">
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
