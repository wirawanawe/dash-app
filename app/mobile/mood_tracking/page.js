"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Heart, RefreshCw, BarChart3, TrendingUp, Zap, Smile,
  Plus, Search, Filter, Eye, Edit, Trash, Calendar, User, Activity
} from 'lucide-react';
import MoodTrackingForm from "./components/MoodTrackingForm";
import MoodTrackingDetailModal from "./components/MoodTrackingDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";
import toast from "react-hot-toast";

export default function MoodTrackingPage() {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMoodData, setEditingMoodData] = useState(null);
  const [selectedMoodData, setSelectedMoodData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMoodData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        mood: moodFilter !== "all" ? moodFilter : ""
      });

      const response = await fetch(`/api/mobile/mood_tracking?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMoodData(data.moodData || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || 'Gagal memuat data mood tracking');
      }
    } catch (err) {
      console.error('Error fetching mood data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchMoodData();
  }, [currentPage, searchTerm, moodFilter, mounted]);

  const handleCreate = () => {
    setEditingMoodData(null);
    setShowForm(true);
  };

  const handleEdit = (moodDataItem) => {
    setEditingMoodData(moodDataItem);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data mood ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/mobile/mood_tracking/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Data mood berhasil dihapus');
        fetchMoodData();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Gagal menghapus data mood');
      }
    } catch (err) {
      console.error('Error deleting mood data:', err);
      toast.error(err.message);
    }
  };

  const handleShowDetail = (moodDataItem) => {
    setSelectedMoodData(moodDataItem);
    setShowDetailModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingMoodData 
        ? `/api/mobile/mood_tracking/${editingMoodData.id}`
        : '/api/mobile/mood_tracking';
      
      const method = editingMoodData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingMoodData ? 'Data mood berhasil diperbarui' : 'Data mood berhasil ditambahkan');
        setShowForm(false);
        setEditingMoodData(null);
        fetchMoodData();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Gagal menyimpan data mood');
      }
    } catch (err) {
      console.error('Error saving mood data:', err);
      toast.error(err.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMoodData(null);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedMoodData(null);
  };

  const getMoodBadge = (mood) => {
    const moodColors = {
      'very_happy': 'bg-green-100 text-green-800 border-green-200',
      'happy': 'bg-blue-100 text-blue-800 border-blue-200',
      'neutral': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'sad': 'bg-orange-100 text-orange-800 border-orange-200',
      'very_sad': 'bg-red-100 text-red-800 border-red-200'
    };
    
    const moodLabels = {
      'very_happy': 'Very Happy',
      'happy': 'Happy',
      'neutral': 'Neutral',
      'sad': 'Sad',
      'very_sad': 'Very Sad'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${moodColors[mood] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {moodLabels[mood] || mood}
      </span>
    );
  };

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'very_happy':
        return '😄';
      case 'happy':
        return '🙂';
      case 'neutral':
        return '😐';
      case 'sad':
        return '😔';
      case 'very_sad':
        return '😢';
      default:
        return '😐';
    }
  };

  const stats = [
    {
      label: "Total Mood Records",
      value: totalRecords.toLocaleString(),
      icon: Heart,
      gradient: "from-blue-500 to-blue-600",
      trend: "All Time",
      isPositive: true
    },
    {
      label: "Very Happy",
      value: moodData.filter(md => md.mood === 'very_happy').length.toLocaleString(),
      icon: Smile,
      gradient: "from-green-500 to-green-600",
      trend: "Records",
      isPositive: true
    },
    {
      label: "Happy",
      value: moodData.filter(md => md.mood === 'happy').length.toLocaleString(),
      icon: Activity,
      gradient: "from-blue-500 to-blue-600",
      trend: "Records",
      isPositive: true
    },
    {
      label: "Sad/Very Sad",
      value: (moodData.filter(md => md.mood === 'sad').length + moodData.filter(md => md.mood === 'very_sad').length).toLocaleString(),
      icon: Heart,
      gradient: "from-red-500 to-red-600",
      trend: "Records",
      isPositive: false
    }
  ];

  const moodOptions = [
    { value: "all", label: "Semua Mood" },
    { value: "very_happy", label: "Very Happy" },
    { value: "happy", label: "Happy" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Sad" },
    { value: "very_sad", label: "Very Sad" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Heart className="w-8 h-8" />
                Mood Tracking Management
              </h1>
              <p className="text-blue-100 mt-2">
                Kelola data tracking mood pengguna mobile app
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchMoodData}
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
                Tambah Data Mood
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
                placeholder="Cari data mood..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {moodOptions.map(option => (
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
              Data Tracking Mood
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
                  <Heart className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchMoodData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            ) : moodData.length === 0 ? (
              <div className="p-8 text-center">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada data tracking mood</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mood
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Energy Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {moodData.map((moodDataItem) => (
                    <tr key={moodDataItem.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {moodDataItem.user_name || `User ${moodDataItem.user_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {moodDataItem.recorded_at ? new Date(moodDataItem.recorded_at).toLocaleDateString('id-ID') : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMoodIcon(moodDataItem.mood)}</span>
                          {getMoodBadge(moodDataItem.mood)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {moodDataItem.energy_level || '-'}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {moodDataItem.recorded_at ? new Date(moodDataItem.recorded_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowDetail(moodDataItem)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(moodDataItem)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(moodDataItem.id)}
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
        <MoodTrackingForm
          moodData={editingMoodData}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMoodData && (
        <MoodTrackingDetailModal
          moodData={selectedMoodData}
          onClose={handleCloseDetail}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-mood-tracking" />
    </DashboardLayout>
  );
} 