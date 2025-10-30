'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Target, RefreshCw, BarChart3, TrendingUp, Activity, Zap, Award } from 'lucide-react';
import MissionForm from './components/MissionForm';
import MissionDetailModal from './components/MissionDetailModal';
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchMissions = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category && { category })
      });

      const response = await fetch(`/api/mobile/missions?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMissions(data.missions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(data.pagination?.page || 1);
      } else {
        console.error('Failed to fetch missions:', data.error || 'Unknown error');
        setMissions([]);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
    setIsLoaded(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMissions(1, searchTerm, categoryFilter);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    fetchMissions(1, searchTerm, category);
  };

  const handleDelete = async (missionId) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;

    try {
      const response = await fetch(`/api/mobile/missions/${missionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMissions(currentPage, searchTerm, categoryFilter);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete mission');
      }
    } catch (error) {

      alert('Failed to delete mission');
    }
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setShowForm(true);
  };

  const handleView = (mission) => {
    setSelectedMission(mission);
    setShowDetailModal(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingMission(null);
    fetchMissions(currentPage, searchTerm, categoryFilter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'fitness': 'bg-blue-100 text-blue-800',
      'nutrition': 'bg-green-100 text-green-800',
      'wellness': 'bg-purple-100 text-purple-800',
      'mental_health': 'bg-yellow-100 text-yellow-800',
      'sleep': 'bg-indigo-100 text-indigo-800',
      'health_tracking': 'bg-red-100 text-red-800',
      'education': 'bg-pink-100 text-pink-800',
      'consultation': 'bg-teal-100 text-teal-800',
      'daily_habit': 'bg-orange-100 text-orange-800'
    };

    const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {getCategoryLabel(category)}
      </span>
    );
  };

  const stats = [
    {
      label: "Total Missions",
      value: missions.length.toString(),
      icon: Target,
      gradient: "from-orange-500 to-orange-600",
      trend: "+15%",
      isPositive: true
    },
    {
      label: "Active Missions",
                      value: missions.filter(mission => mission.is_active).length.toString(),
      icon: Activity,
      gradient: "from-green-500 to-green-600",
      trend: "Live",
      isPositive: true
    },
    {
      label: "This Month",
      value: "23",
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      trend: "+8%",
      isPositive: true
    },
    {
      label: "Completed",
      value: "89",
      icon: Award,
      gradient: "from-blue-500 to-blue-600",
      trend: "+12%",
      isPositive: true
    }
  ];

  const categories = ['fitness', 'nutrition', 'wellness', 'mental_health', 'sleep', 'health_tracking', 'education', 'consultation', 'daily_habit'];
  
  const getCategoryLabel = (category) => {
    const labels = {
      'fitness': 'Fitness',
      'nutrition': 'Nutrition',
      'wellness': 'Wellness',
      'mental_health': 'Mental Health',
      'sleep': 'Sleep',
      'health_tracking': 'Health Tracking',
      'education': 'Education',
      'consultation': 'Consultation',
      'daily_habit': 'Daily Habit'
    };
    return labels[category] || category;
  };

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Target className="w-4 h-4 mr-2" />
                Missions & Activities Management
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Missions & <span className="text-yellow-300">Activities</span>
              </h1>
              <p className="text-xl text-orange-100 max-w-2xl">
                Kelola misi wellness, aktivitas kesehatan, dan tantangan untuk pengguna mobile PHC
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchMissions()}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Mission
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Wellness Missions
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter
              </h2>
              <p className="text-gray-600 mt-2">Cari misi berdasarkan nama, kategori, atau deskripsi</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari misi (nama, kategori, deskripsi)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Cari</span>
              </button>
              {(searchTerm || categoryFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    fetchMissions(1, '', '');
                  }}
                  className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Category Filter */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter("")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === "" 
                    ? "bg-orange-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === category 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
          
          {(searchTerm || categoryFilter) && (
            <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-sm text-orange-700">
                <span className="font-medium">Hasil pencarian:</span> 
                {searchTerm && ` "${searchTerm}"`}
                {categoryFilter && ` Kategori: ${getCategoryLabel(categoryFilter)}`}
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Data Misi & Aktivitas
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap misi wellness dan aktivitas kesehatan
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-orange-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Misi</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : missions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-700 mb-2">Tidak Ada Data Misi</p>
                <p className="text-gray-500 mb-4">Belum ada misi yang tersedia di database</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Misi Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missions.map((mission) => (
                      <tr key={mission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Target className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{mission.title}</div>
                              <div className="text-sm text-gray-500">{mission.description?.substring(0, 50)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(mission.category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mission.type ? mission.type : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(mission.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mission.createdAt ? formatDate(mission.createdAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(mission)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(mission)}
                              className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                              title="Edit Mission"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(mission.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus Mission"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 pagination-safe-area">
            <div className="mobile-pagination-compact">
              <div className="mobile-pagination-info">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="mobile-pagination-controls">
                <button
                  onClick={() => fetchMissions(currentPage - 1, searchTerm, categoryFilter)}
                  disabled={currentPage === 1}
                  className="mobile-pagination-text-button mobile-pagination-touch"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchMissions(currentPage + 1, searchTerm, categoryFilter)}
                  disabled={currentPage === totalPages}
                  className="mobile-pagination-text-button mobile-pagination-touch"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <MissionForm
          mission={editingMission}
          onClose={() => {
            setShowForm(false);
            setEditingMission(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-missions" />

      {/* Detail Modal */}
      {showDetailModal && selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMission(null);
          }}
        />
      )}
    </DashboardLayout>
  );
} 