"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import FoodForm from "./components/FoodForm";
import FoodTable from "./components/FoodTable";
import ApiDocumentation from "@/components/ApiDocumentation";
import toast from "react-hot-toast";
import { 
  Utensils, 
  Plus, 
  Search, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap,
  Database
} from 'lucide-react';

export default function FoodManagementPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // Add debounced search term
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50, // Increased from 20 to 50
    offset: 0,
    hasMore: false
  });

  // Debounce search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch foods when debounced search term changes
  useEffect(() => {
    if (isLoaded) {
      fetchFoods(debouncedSearchTerm, selectedCategory, 0);
    }
  }, [debouncedSearchTerm, selectedCategory]);

  const fetchFoods = async (search = "", category = "", offset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });
      
      if (search) params.append("search", search);
      if (category) params.append("category", category);

      const response = await fetch(`/api/mobile/food?${params}`);
      const data = await response.json();

      if (data.success) {
        setFoods(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Gagal memuat data makanan");
      console.error("Error fetching foods:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/mobile/food/categories");
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchFoods();
    fetchCategories();
    setIsLoaded(true);
  }, []);

  const handleSearch = () => {
    // Search is now handled by debounced effect
    // This function can be removed or kept for manual search button
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    // Category change is handled by debounced effect
  };

  const handleAddFood = () => {
    setEditingFood(null);
    setShowForm(true);
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setShowForm(true);
  };

  const handleDeleteFood = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus makanan ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/mobile/food/${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Makanan berhasil dihapus");
        fetchFoods(searchTerm, selectedCategory, pagination.offset);
      } else {
        toast.error(data.message || "Gagal menghapus makanan");
      }
    } catch (err) {
      console.error("Error deleting food:", err);
      toast.error("Gagal menghapus makanan");
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingFood(null);
    fetchFoods(searchTerm, selectedCategory, pagination.offset);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFood(null);
  };

  const handlePageChange = (newOffset) => {
    fetchFoods(searchTerm, selectedCategory, newOffset);
  };

  const stats = [
    {
      label: "Total Foods",
      value: pagination.total.toString(),
      icon: Utensils,
      gradient: "from-green-500 to-green-600",
      trend: "+8%",
      isPositive: true
    },
    {
      label: "Categories",
      value: categories.length.toString(),
      icon: Database,
      gradient: "from-blue-500 to-blue-600",
      trend: "Live",
      isPositive: true
    },
    {
      label: "This Month",
      value: "45",
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      trend: "+12%",
      isPositive: true
    },
    {
      label: "Active Items",
              value: foods.filter(food => food.is_active !== false).length.toString(),
      icon: Activity,
      gradient: "from-orange-500 to-orange-600",
      trend: "+15%",
      isPositive: true
    }
  ];

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Utensils className="w-4 h-4 mr-2" />
                Food Database Management
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Food <span className="text-yellow-300">Database</span>
              </h1>
              <p className="text-xl text-green-100 max-w-2xl">
                Kelola database makanan, nutrisi, dan informasi gizi untuk aplikasi mobile PHC
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchFoods()}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              <button
                onClick={handleAddFood}
                className="flex items-center px-6 py-3 bg-white text-green-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Makanan
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
                  Food Database
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
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter
              </h2>
              <p className="text-gray-600 mt-2">Cari makanan berdasarkan nama, kategori, atau nutrisi</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari makanan (nama, kategori, nutrisi)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Cari</span>
              </button>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    fetchFoods('', '', 0);
                  }}
                  className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryFilter("")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === "" 
                      ? "bg-green-500 text-white" 
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
                      selectedCategory === category 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {(searchTerm || selectedCategory) && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-700">
                <span className="font-medium">Hasil pencarian:</span> 
                {searchTerm && ` "${searchTerm}"`}
                {selectedCategory && ` Kategori: ${selectedCategory}`}
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Database Makanan
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap makanan dan informasi nutrisi
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-green-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Makanan</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <FoodTable
                foods={foods}
                onEdit={handleEditFood}
                onDelete={handleDeleteFood}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-food" />

      {/* Form Modal */}
      {showForm && (
        <FoodForm
          food={editingFood}
          categories={categories}
          onClose={handleFormCancel}
          onSubmit={handleFormSubmit}
        />
      )}
    </DashboardLayout>
  );
} 