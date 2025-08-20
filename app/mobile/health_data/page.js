"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Activity, RefreshCw, BarChart3, TrendingUp, Zap, Heart,
  Plus, Search, Filter, Eye, Edit, Trash, Calendar, User, Thermometer
} from 'lucide-react';
import HealthDataForm from "./components/HealthDataForm";
import HealthDataDetailModal from "./components/HealthDataDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";
import toast from "react-hot-toast";
import { createCrudOperation } from "@/utils/refreshUtils";

export default function HealthDataPage() {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHealthData, setEditingHealthData] = useState(null);
  const [selectedHealthData, setSelectedHealthData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        type: typeFilter !== "all" ? typeFilter : ""
      });

      const response = await fetch(`/api/mobile/health_data?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHealthData(data.healthData || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || 'Gagal memuat data health data');
      }
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchHealthData();
  }, [currentPage, searchTerm, typeFilter, mounted]);

  const handleCreate = () => {
    setEditingHealthData(null);
    setShowForm(true);
  };

  const handleEdit = (healthDataItem) => {
    setEditingHealthData(healthDataItem);
    setShowForm(true);
  };

  const handleDeleteHealthData = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data kesehatan ini?')) {
      return;
    }

    try {
      await createCrudOperation(
        "DELETE",
        `/api/mobile/health_data/${id}`,
        null,
        () => fetchHealthData(),
        { setLoading }
      );
      
      toast.success('Data kesehatan berhasil dihapus');
    } catch (err) {
      console.error('Error deleting health data:', err);
      toast.error('Gagal menghapus data kesehatan');
    }
  };

  const handleShowDetail = (healthDataItem) => {
    setSelectedHealthData(healthDataItem);
    setShowDetailModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingHealthData 
        ? `/api/mobile/health_data/${editingHealthData.id}`
        : '/api/mobile/health_data';
      
      const method = editingHealthData ? 'PUT' : 'POST';
      
      await createCrudOperation(
        method,
        url,
        formData,
        () => fetchHealthData(),
        { setLoading }
      );

      toast.success('Health data saved successfully!');
      setShowForm(false);
      setEditingHealthData(null);
    } catch (err) {
      console.error('Error saving health data:', err);
      toast.error('Network error: Gagal menyimpan data kesehatan. Please check your connection.');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHealthData(null);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedHealthData(null);
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'blood_pressure': 'bg-red-100 text-red-800 border-red-200',
      'heart_rate': 'bg-pink-100 text-pink-800 border-pink-200',
      'blood_sugar': 'bg-blue-100 text-blue-800 border-blue-200',
      'weight': 'bg-green-100 text-green-800 border-green-200',
      'temperature': 'bg-orange-100 text-orange-800 border-orange-200',
      'oxygen_saturation': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    const typeLabels = {
      'blood_pressure': 'Blood Pressure',
      'heart_rate': 'Heart Rate',
      'blood_sugar': 'Blood Sugar',
      'weight': 'Weight',
      'temperature': 'Temperature',
      'oxygen_saturation': 'Oxygen Saturation'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  const stats = [
    {
      label: "Total Health Records",
      value: totalRecords.toLocaleString(),
      icon: Activity,
      gradient: "from-blue-500 to-blue-600",
      trend: "All Time",
      isPositive: true
    },
    {
      label: "Blood Pressure",
      value: healthData.filter(hd => hd.data_type === 'blood_pressure').length.toLocaleString(),
      icon: Heart,
      gradient: "from-red-500 to-red-600",
      trend: "Records",
      isPositive: true
    },
    {
      label: "Heart Rate",
      value: healthData.filter(hd => hd.data_type === 'heart_rate').length.toLocaleString(),
      icon: Activity,
      gradient: "from-pink-500 to-pink-600",
      trend: "Records",
      isPositive: true
    },
    {
      label: "Blood Sugar",
      value: healthData.filter(hd => hd.data_type === 'blood_sugar').length.toLocaleString(),
      icon: Thermometer,
      gradient: "from-blue-500 to-blue-600",
      trend: "Records",
      isPositive: true
    }
  ];

  const typeOptions = [
    { value: "all", label: "Semua Tipe" },
    { value: "blood_pressure", label: "Blood Pressure" },
    { value: "heart_rate", label: "Heart Rate" },
    { value: "blood_sugar", label: "Blood Sugar" },
    { value: "weight", label: "Weight" },
    { value: "temperature", label: "Temperature" },
    { value: "oxygen_saturation", label: "Oxygen Saturation" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="w-8 h-8" />
                Health Data Management
              </h1>
              <p className="text-blue-100 mt-2">
                Kelola data kesehatan pengguna mobile app
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchHealthData}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah Data Kesehatan
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.isPositive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari data kesehatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                Menampilkan hasil pencarian untuk: <span className="font-medium">"{searchTerm}"</span>
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Data Kesehatan
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-4">
                  <Activity className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchHealthData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            ) : healthData.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada data kesehatan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Data Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {healthData.map((healthDataItem) => (
                    <tr key={healthDataItem.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {healthDataItem.user_name || `User ${healthDataItem.user_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getTypeBadge(healthDataItem.data_type)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {healthDataItem.value}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {healthDataItem.unit || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {healthDataItem.recorded_at ? new Date(healthDataItem.recorded_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowDetail(healthDataItem)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(healthDataItem)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHealthData(healthDataItem.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 pagination-safe-area">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalRecords)} dari {totalRecords} data
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <HealthDataForm
          healthData={editingHealthData}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-health-data" />

      {/* Detail Modal */}
      {showDetailModal && selectedHealthData && (
        <HealthDataDetailModal
          healthData={selectedHealthData}
          onClose={handleCloseDetail}
        />
      )}
    </DashboardLayout>
  );
} 