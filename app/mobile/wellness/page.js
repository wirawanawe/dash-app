'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Activity, RefreshCw, BarChart3, TrendingUp, Zap, Award, Heart, Sparkles, Target, Clock, Users, Star, Calendar, ArrowRight, Play, Pause, CheckCircle, XCircle, MoreHorizontal, Filter as FilterIcon, Grid, List, Sparkles as SparklesIcon } from 'lucide-react';
import WellnessActivityForm from './components/WellnessActivityForm';
import WellnessActivityDetailModal from './components/WellnessActivityDetailModal';
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function WellnessActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'title', 'category', 'difficulty'

  const categories = [
    { id: 'fitness', name: 'Fitness', icon: '💪', color: 'from-emerald-500 to-teal-500' },
    { id: 'nutrition', name: 'Nutrition', icon: '🥗', color: 'from-orange-500 to-red-500' },
    { id: 'mental_health', name: 'Mental Health', icon: '🧠', color: 'from-purple-500 to-pink-500' },
    { id: 'social', name: 'Social', icon: '👥', color: 'from-blue-500 to-indigo-500' },
    { id: 'environmental', name: 'Environmental', icon: '🌱', color: 'from-green-500 to-emerald-500' }
  ];

  const fetchActivities = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category && { category })
      });

      const response = await fetch(`/api/mobile/wellness?${params}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
      } else {
        console.error('Failed to fetch activities:', data.error);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    setIsLoaded(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActivities(1, searchTerm, categoryFilter);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    fetchActivities(1, searchTerm, category);
  };

  const handleDelete = async (activityId) => {
    if (!confirm('Are you sure you want to delete this wellness activity?')) return;

    try {
      const response = await fetch(`/api/mobile/wellness/${activityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchActivities(currentPage, searchTerm, categoryFilter);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
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
    fetchActivities(currentPage, searchTerm, categoryFilter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryInfo = (category) => {
    return categories.find(cat => cat.id === category) || {
      name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      icon: '🎯',
      color: 'from-gray-500 to-gray-600'
    };
  };

  const getDifficultyInfo = (difficulty) => {
    const difficultyInfo = {
      'easy': { color: 'from-green-400 to-emerald-500', label: 'Easy', icon: '😊' },
      'medium': { color: 'from-yellow-400 to-orange-500', label: 'Medium', icon: '😐' },
      'hard': { color: 'from-red-400 to-pink-500', label: 'Hard', icon: '😰' }
    };
    return difficultyInfo[difficulty] || { color: 'from-gray-400 to-gray-500', label: difficulty, icon: '❓' };
  };

  const getStatusInfo = (isActive) => {
    return isActive 
      ? { color: 'from-green-400 to-emerald-500', label: 'Active', icon: '🟢' }
      : { color: 'from-red-400 to-pink-500', label: 'Inactive', icon: '🔴' };
  };

  const stats = [
    {
      label: "Total Activities",
      value: activities.length.toString(),
      icon: Activity,
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      trend: "+12%",
      isPositive: true,
      description: "Wellness activities available"
    },
    {
      label: "Active Activities",
      value: activities.filter(activity => activity.is_active).length.toString(),
      icon: Heart,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      trend: "Live",
      isPositive: true,
      description: "Currently active"
    },
    {
      label: "This Month",
      value: "18",
      icon: TrendingUp,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      trend: "+8%",
      isPositive: true,
      description: "New activities added"
    },
    {
      label: "Completed",
      value: "156",
      icon: Award,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      trend: "+15%",
      isPositive: true,
      description: "Activities completed"
    }
  ];

  const sortedActivities = [...activities].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'difficulty':
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl mx-4 mt-6 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-8 right-8">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-white/30 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          {/* Floating elements */}
          <div className="absolute top-20 left-20 w-8 h-8 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute bottom-20 right-20 w-6 h-6 bg-white/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
              <div className="max-w-2xl">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/30">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Wellness Activities Management
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  Wellness <span className="text-yellow-300">Activities</span>
                  <br />
                  <span className="text-2xl lg:text-3xl font-light text-indigo-100">
                    for Better Health
                  </span>
                </h1>
                <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                  Kelola aktivitas wellness, mindfulness, dan kesehatan mental untuk pengguna mobile PHC dengan antarmuka yang modern dan intuitif
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowForm(true)}
                    className="group flex items-center px-8 py-4 bg-white text-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
                  >
                    <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Tambah Aktivitas Baru
                  </button>
                  <button
                    onClick={() => fetchActivities()}
                    className="group flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl shadow-xl hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold text-lg border border-white/30"
                  >
                    <RefreshCw className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-300" />
                    Refresh Data
                  </button>
                </div>
              </div>
              <div className="hidden lg:block mt-8 lg:mt-0">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                    <Activity className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 bg-gradient-to-r ${stat.gradient} rounded-2xl shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-lg font-semibold text-gray-700 mb-1">{stat.label}</p>
                  <p className="text-sm text-gray-500">
                    {stat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">View Mode:</span>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Activity
              </button>
              <button
                onClick={() => fetchActivities()}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Data
              </button>
              <button
                onClick={() => setSearchTerm('')}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Clear Search
              </button>
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setSearchTerm('');
                  fetchActivities(1, '', '');
                }}
                className="flex items-center justify-center p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Filter className="w-5 h-5 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="px-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mr-4">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  Pencarian & Filter
                </h2>
                <p className="text-gray-600 text-lg">Cari aktivitas wellness berdasarkan nama, kategori, atau deskripsi</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="created_at">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="category">Sort by Category</option>
                  <option value="difficulty">Sort by Difficulty</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari aktivitas wellness (nama, kategori, deskripsi)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl text-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-14 bg-white/50 backdrop-blur-sm shadow-sm"
                />
                <Search className="absolute left-5 top-5 text-gray-400 w-6 h-6" />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
                >
                  <Search className="w-6 h-6 mr-3" />
                  Cari
                </button>
                {(searchTerm || categoryFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
                      fetchActivities(1, '', '');
                    }}
                    className="flex items-center px-6 py-4 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors font-semibold text-lg"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>

            {/* Category Filter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <FilterIcon className="w-5 h-5 mr-2" />
                Filter by Category:
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleCategoryFilter("")}
                  className={`px-6 py-3 rounded-2xl text-lg font-medium transition-all duration-300 ${
                    categoryFilter === "" 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.id)}
                    className={`px-6 py-3 rounded-2xl text-lg font-medium transition-all duration-300 flex items-center ${
                      categoryFilter === category.id 
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg` 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            {(searchTerm || categoryFilter) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <p className="text-lg text-indigo-700">
                  <span className="font-semibold">Hasil pencarian:</span> 
                  {searchTerm && ` "${searchTerm}"`}
                  {categoryFilter && ` Kategori: ${getCategoryInfo(categoryFilter).name}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activities Section */}
        <div className="px-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 border-b border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mr-4">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    Data Aktivitas Wellness
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Daftar lengkap aktivitas wellness dan mindfulness
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{activities.length}</p>
                  <p className="text-gray-500">Total Activities</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {loading ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                      <Activity className="w-10 h-10 text-white" />
                    </div>
                    <div className="loading-spinner h-12 w-12 text-indigo-600 mx-auto mb-6"></div>
                    <p className="text-2xl font-semibold text-gray-700 mb-2">Memuat Data Aktivitas</p>
                    <p className="text-gray-500 text-lg">Mengambil informasi terkini...</p>
                  </div>
                  {/* Loading skeletons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 animate-pulse">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                          <div className="flex space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="space-y-2 mb-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="space-y-3 mb-6">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                              <div className="w-20 h-3 bg-gray-200 rounded"></div>
                              <div className="w-16 h-3 bg-gray-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-100">
                          <div className="w-24 h-3 bg-gray-200 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sortedActivities.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
                    <Activity className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Activities Found</h3>
                  <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
                    {searchTerm || categoryFilter 
                      ? "No activities match your search criteria. Try adjusting your filters."
                      : "Get started by adding your first wellness activity!"
                    }
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    Add First Activity
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedActivities.map((activity) => {
                    const categoryInfo = getCategoryInfo(activity.category);
                    const difficultyInfo = getDifficultyInfo(activity.difficulty);
                    const statusInfo = getStatusInfo(activity.is_active);
                    
                    return (
                      <div key={activity.id} className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 bg-gradient-to-r ${categoryInfo.color} rounded-2xl`}>
                            <span className="text-2xl">{categoryInfo.icon}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(activity)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(activity)}
                              className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-xl transition-colors"
                              title="Edit Aktivitas"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors"
                              title="Hapus Aktivitas"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                          {activity.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Category</span>
                            <span className="text-sm font-semibold text-gray-700">{categoryInfo.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Difficulty</span>
                            <div className="flex items-center">
                              <span className="mr-2">{difficultyInfo.icon}</span>
                              <span className="text-sm font-semibold text-gray-700">{difficultyInfo.label}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Duration</span>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-700">
                                {activity.duration_minutes ? `${activity.duration_minutes} min` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Status</span>
                            <div className="flex items-center">
                              <span className="mr-2">{statusInfo.icon}</span>
                              <span className="text-sm font-semibold text-gray-700">{statusInfo.label}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(activity.created_at)}
                          </div>
                          <button 
                            onClick={() => handleView(activity)}
                            className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold group-hover:translate-x-1 transition-transform hover:scale-105"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // List View
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-2xl">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Difficulty
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedActivities.map((activity) => {
                        const categoryInfo = getCategoryInfo(activity.category);
                        const difficultyInfo = getDifficultyInfo(activity.difficulty);
                        const statusInfo = getStatusInfo(activity.is_active);
                        
                        return (
                          <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-12 h-12 bg-gradient-to-r ${categoryInfo.color} rounded-2xl flex items-center justify-center mr-4`}>
                                  <span className="text-xl">{categoryInfo.icon}</span>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-gray-900">{activity.title}</div>
                                  <div className="text-gray-500 max-w-xs truncate">{activity.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="mr-2">{categoryInfo.icon}</span>
                                <span className="font-medium text-gray-700">{categoryInfo.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="mr-2">{difficultyInfo.icon}</span>
                                <span className="font-medium text-gray-700">{difficultyInfo.label}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-gray-400" />
                                <span className="font-medium text-gray-700">
                                  {activity.duration_minutes ? `${activity.duration_minutes} min` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="mr-2">{statusInfo.icon}</span>
                                <span className="font-medium text-gray-700">{statusInfo.label}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                                <span className="font-medium text-gray-700">{formatDate(activity.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleView(activity)}
                                  className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors"
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(activity)}
                                  className="p-3 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-xl transition-colors"
                                  title="Edit Aktivitas"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(activity.id)}
                                  className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Hapus Aktivitas"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium text-gray-700">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fetchActivities(currentPage - 1, searchTerm, categoryFilter)}
                    disabled={currentPage === 1}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchActivities(currentPage + 1, searchTerm, categoryFilter)}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <WellnessActivityForm
          activity={editingActivity}
          onClose={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-wellness" />

      {/* Detail Modal */}
      {showDetailModal && selectedActivity && (
        <WellnessActivityDetailModal
          activity={selectedActivity}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </DashboardLayout>
  );
} 