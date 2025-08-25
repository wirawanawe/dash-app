'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Activity, RefreshCw, BarChart3, TrendingUp, Award, Clock } from 'lucide-react';
import ActivityForm from '../missions/components/ActivityForm';
import ActivityDetailModal from '../missions/components/ActivityDetailModal';
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";
import toast from "react-hot-toast";
import { createCrudOperation } from "@/utils/refreshUtils";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchActivities = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category && { category })
      });

      const response = await fetch(`/api/mobile/activities-api?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setActivities(data.activities || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(data.pagination?.page || 1);
      } else {
        console.error('Failed to fetch activities:', data.error || data.message);
        setActivities([]);
        setError(data.error || data.message || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    fetchActivities();
    setIsLoaded(true);
  }, [mounted]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActivities(1, searchTerm, categoryFilter);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    fetchActivities(1, searchTerm, category);
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await createCrudOperation(
        "DELETE",
        `/api/mobile/activities-api/${id}`,
        null,
        () => fetchActivities(currentPage, searchTerm, categoryFilter),
        { setLoading }
      );
      
      toast.success('Activity berhasil dihapus');
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Failed to delete activity');
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleView = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingActivity(null);
    // Auto-refresh is handled by the form component through createCrudOperation
    fetchActivities(currentPage, searchTerm, categoryFilter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const mapDatabaseCategoryToFrontend = (dbCategory) => {
    const categoryMap = {
      'fitness': 'Fitness',
      'nutrition': 'Nutrition',
      'wellness': 'Wellness',
      'mindfulness': 'Mindfulness',
      'health': 'Health',
      'sports': 'Sports',
      'meditation': 'Meditation',
      'yoga': 'Yoga'
    };
    return categoryMap[dbCategory] || dbCategory;
  };

  const getCategoryBadge = (category) => {
    const frontendCategory = mapDatabaseCategoryToFrontend(category);
    const categoryColors = {
      'Fitness': 'bg-blue-100 text-blue-800',
      'Nutrition': 'bg-green-100 text-green-800',
      'Wellness': 'bg-purple-100 text-purple-800',
      'Mindfulness': 'bg-yellow-100 text-yellow-800',
      'Health': 'bg-red-100 text-red-800',
      'Sports': 'bg-indigo-100 text-indigo-800',
      'Meditation': 'bg-pink-100 text-pink-800',
      'Yoga': 'bg-teal-100 text-teal-800'
    };

    const colorClass = categoryColors[frontendCategory] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {frontendCategory}
      </span>
    );
  };

  const activitiesArray = activities || [];
  console.log('Activities array length:', activitiesArray.length);
  const stats = [
    {
      label: "Total Activities",
      value: activitiesArray.length.toString(),
      icon: Activity,
      gradient: "from-blue-500 to-blue-600",
      trend: "+15%",
      isPositive: true
    },
    {
      label: "Activities Today",
      value: activitiesArray.filter(activity => {
        const today = new Date().toISOString().split('T')[0];
        return activity.created_at?.startsWith(today);
      }).length.toString(),
      icon: Clock,
      gradient: "from-green-500 to-green-600",
      trend: "Live",
      isPositive: true
    },
    {
      label: "Total Points Earned",
      value: activitiesArray.reduce((sum, activity) => sum + (parseInt(activity.points) || 0), 0).toString(),
      icon: Award,
      gradient: "from-purple-500 to-purple-600",
      trend: "+8%",
      isPositive: true
    },
    {
      label: "Avg Duration",
      value: activitiesArray.length > 0 
        ? Math.round(activitiesArray.reduce((sum, activity) => sum + (parseInt(activity.duration_minutes) || 0), 0) / activitiesArray.length) + ' min'
        : '0 min',
      icon: BarChart3,
      gradient: "from-orange-500 to-orange-600",
      trend: "+12%",
      isPositive: true
    }
  ];

  const categories = ['fitness', 'nutrition', 'wellness', 'mindfulness', 'health', 'sports', 'meditation', 'yoga'];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Activity className="w-4 h-4 mr-2" />
                Activity Management
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Habit <span className="text-yellow-300">Activities</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Kelola aktivitas kesehatan dan tracking kesehatan pengguna mobile PHC
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchActivities()}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Activity
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
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari aktivitas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
                >
                  Cari
                </button>
              </form>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !categoryFilter 
                    ? "bg-blue-500 text-white" 
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
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {mapDatabaseCategoryToFrontend(category)}
                </button>
              ))}
            </div>
          </div>
          
          {(searchTerm || categoryFilter) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Hasil pencarian:</span> 
                {searchTerm && ` "${searchTerm}"`}
                {categoryFilter && ` Kategori: ${mapDatabaseCategoryToFrontend(categoryFilter)}`}
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  Data Aktivitas
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap aktivitas kesehatan yang telah dilakukan pengguna
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Aktivitas</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-xl font-medium text-gray-700 mb-2">Error Loading Data</p>
                <p className="text-gray-500">{error}</p>
                <button 
                  onClick={() => fetchActivities()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            ) : activitiesArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-gray-700 mb-2">Tidak Ada Data Aktivitas</p>
                <p className="text-gray-500">Belum ada aktivitas yang tersedia</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activitiesArray.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                              <div className="text-sm text-gray-500">{activity.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(activity.category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.duration_minutes} menit
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            +{activity.points} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(activity.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(activity)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(activity)}
                              className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                              title="Edit Activity"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus Activity"
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
                  onClick={() => fetchActivities(currentPage - 1, searchTerm, categoryFilter)}
                  disabled={currentPage === 1}
                  className="mobile-pagination-text-button mobile-pagination-touch"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchActivities(currentPage + 1, searchTerm, categoryFilter)}
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
        <ActivityForm
          activity={editingActivity}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedActivity(null);
          }}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation />
    </DashboardLayout>
  );
} 