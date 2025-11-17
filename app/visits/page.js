"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFilter,
} from "react-icons/fa";
import { 
  Calendar, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp,
  Activity,
  Clock,
  User,
  Stethoscope,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CalendarDays,
  Users,
  Zap,
  Heart,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Square
} from 'lucide-react';
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import VisitForm from "./components/VisitForm";
import VisitDetailModal from "./components/VisitDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function VisitsPage() {
  const router = useRouter();
  const [allVisits, setAllVisits] = useState([]); // Store ALL visits
  const [visits, setVisits] = useState([]); // Paginated visits for display
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchDateInput, setSearchDateInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    doctorId: "",
    clinic: "",
    startDate: "",
    endDate: "",
    facilityName: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    doctorId: "",
    clinic: "",
    startDate: "",
    endDate: "",
    facilityName: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // Store all doctors
  const [clinics, setClinics] = useState([]);
  const [facilityNames, setFacilityNames] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    monthly: 0,
  });
  const [facilityStats, setFacilityStats] = useState([]);
  const refreshTimeoutRef = useRef(null);
  const [syncProgress, setSyncProgress] = useState(null); // Sync progress state
  const [isManualSync, setIsManualSync] = useState(false); // Track if sync was started manually

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters - Use proper server-side pagination
      const params = new URLSearchParams({
        search,
        page: page.toString(),      // Use current page for server-side pagination
        limit: limit.toString(),     // Use limit for server-side pagination (not "all")
        sortBy: "date",              // Sort by date
        sortOrder: "desc",           // Descending (terbaru dulu)
      });

      // Add date search if exists
      if (searchDate) {
        params.append("searchDate", searchDate);
      }

      // Add date filters if they exist
      if (appliedFilters.startDate) {
        params.append("tglawal", appliedFilters.startDate);
      }
      if (appliedFilters.endDate) {
        params.append("tglakhir", appliedFilters.endDate);
      }

      // Add status filter if exists
      if (appliedFilters.status) {
        params.append("status", appliedFilters.status);
      }

      // Add doctor filter if exists
      if (appliedFilters.doctorId) {
        params.append("doctorId", appliedFilters.doctorId);
      }

      // Add clinic filter if exists
      if (appliedFilters.clinic) {
        params.append("clinic", appliedFilters.clinic);
      }

      // Add facility name (faskes) filter if exists
      if (appliedFilters.facilityName) {
        params.append("facilityName", appliedFilters.facilityName);
      }

      const response = await fetch(`/api/visits?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data kunjungan");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("Invalid data format");
      }

      // Use server-side pagination data directly (facility filter already handled by API)
      const visitsData = result.data || [];
      setVisits(visitsData);
      
      // Get pagination info from API response
      const pagination = result.pagination || {};
      const totalData = pagination.total || visitsData.length;
      const totalPagesCalculated = pagination.totalPages || Math.ceil(totalData / limit);
      
      setMetadata({ total: totalData });
      setTotalPages(totalPagesCalculated);
      
      // For backwards compatibility, store in allVisits (but limited to current page)
      setAllVisits(visitsData);

    } catch (error) {

      toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      setAllVisits([]);
      setVisits([]);
      setMetadata({});
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, searchDate, appliedFilters.startDate, appliedFilters.endDate, appliedFilters.status, appliedFilters.doctorId, appliedFilters.clinic, appliedFilters.facilityName]);

  const fetchDoctorsAndClinics = async () => {
    try {
      // Fetch doctors and clinics from visits table (more reliable)
      const response = await fetch("/api/visits/filters");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      
      // API returns { success: true, doctors: [...], clinics: [...], doctorPoliMapping: {...} }
      const doctorsList = data.doctors || [];
      const clinicsList = data.clinics || [];
      
      setAllDoctors(Array.isArray(doctorsList) ? doctorsList : []); // Store all doctors
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
      setClinics(Array.isArray(clinicsList) ? clinicsList : []);
    } catch (error) {
      setAllDoctors([]);
      setDoctors([]);
      setClinics([]);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      // Get today's date in YYYY-MM-DD format (local timezone, not UTC)
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get this month's date range
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStart = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
      const monthEnd = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

      // Fetch all stats in parallel (optimized - only fetch pagination info, not all data)
      const [totalResponse, todayResponse, monthlyResponse, facilityStatsResponse] = await Promise.all([
        // Total: Fetch dengan limit kecil untuk hanya mendapatkan pagination info
        fetch('/api/visits?page=1&limit=1'),
        // Today: Fetch dengan filter tanggal hari ini, limit kecil
        fetch(`/api/visits?searchDate=${todayString}&page=1&limit=1`),
        // Monthly: Fetch dengan filter bulan ini, limit kecil
        fetch(`/api/visits?tglawal=${monthStart}&tglakhir=${monthEnd}&page=1&limit=1`),
        // Facility stats: Fetch breakdown by facility
        fetch('/api/visits/facility-stats'),
      ]);

      const [totalData, todayData, monthlyData, facilityData] = await Promise.all([
        totalResponse.json(),
        todayResponse.json(),
        monthlyResponse.json(),
        facilityStatsResponse.json(),
      ]);

      const totalCount = totalData.pagination?.total || 0;
      const todayCount = todayData.pagination?.total || 0;
      const monthlyCount = monthlyData.pagination?.total || 0;

      console.log('[Stats Debug]', {
        todayString,
        todayCount,
        monthlyCount,
        totalCount,
        todayResponse: todayData,
        facilityData: facilityData.data
      });

      setStats({
        total: totalCount,
        today: todayCount,
        monthly: monthlyCount,
      });

      // Set facility stats
      if (facilityData.success && facilityData.data) {
        setFacilityStats(facilityData.data);
      }

    } catch (error) {
      console.error('[Stats Error]', error);
    }
  }, []); // No dependencies - stats are independent

  // Fetch data when search/filters change (including page/limit)
  useEffect(() => {
    fetchVisits();
    setIsLoaded(true);
  }, [fetchVisits]);
  
  // Note: Client-side pagination removed - now using server-side pagination

  useEffect(() => {
    fetchDoctorsAndClinics();
    fetchStats(); // Fetch stats on initial load
  }, [fetchStats]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let eventSource;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        return;
      }
      refreshTimeoutRef.current = setTimeout(async () => {
        refreshTimeoutRef.current = null;
        try {
          await fetchVisits();
          await fetchStats();
        } catch (err) {
          console.warn("[Visits SSE] Failed to refresh data:", err);
        }
      }, 800);
    };

    try {
      eventSource = new EventSource("/api/visits/updates");
    } catch (error) {
      console.warn("[Visits SSE] Unable to create EventSource:", error);
      return () => {};
    }

    const handleRefreshEvent = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.lastSync) {
          const sync = data.lastSync;
          const syncTimestamp = sync.started_at ? new Date(sync.started_at).getTime() : 0;
          const now = Date.now();
          const fiveMinutesAgo = now - (5 * 60 * 1000);
          const isRecentSync = syncTimestamp > fiveMinutesAgo;
          const isSyncActive = sync.status === 'started' || sync.status === 'in_progress';
          
          // Always show progress if:
          // 1. Manual sync is active (regardless of age or status) - this is the main condition
          // 2. Sync is active (started/in_progress) and recent (for non-manual syncs)
          if (isManualSync || (isSyncActive && isRecentSync)) {
            if (isSyncActive) {
              // Sync is still running - always show progress
              setSyncProgress({
                status: sync.status,
                progress: sync.progress_percent || 0,
                fetched: sync.fetched || 0,
                inserted: sync.inserted || 0,
                updated: sync.updated || 0,
                failed: sync.failed || 0,
                total: sync.total_records || 0,
                processed: sync.processed_records || 0,
              });
            } else if (sync.status === 'completed' || sync.status === 'failed') {
              // Sync is finished - only show completion if it was manual sync
              if (isManualSync) {
                setSyncProgress({
                  status: sync.status,
                  progress: 100,
                  fetched: sync.fetched || 0,
                  inserted: sync.inserted || 0,
                  updated: sync.updated || 0,
                  failed: sync.failed || 0,
                  total: sync.total_records || 0,
                  processed: sync.processed_records || 0,
                  duration: sync.duration_seconds || 0,
                  error: sync.error_message || null,
                });
                
                // Refresh data when sync completes
                setTimeout(() => {
                  fetchVisits();
                  fetchStats();
                }, 1000);
                
                // Clear progress after 5 seconds and reset manual sync flag
                setTimeout(() => {
                  setSyncProgress(null);
                  setIsManualSync(false);
                }, 5000);
              } else {
                // Not a manual sync, clear progress only if sync is old
                if (!isRecentSync) {
                  setSyncProgress(null);
                }
              }
            }
          } else {
            // Sync is not active and not recent - only clear if not manual sync
            if (!isManualSync && !isSyncActive) {
              setSyncProgress(null);
            }
          }
        } else {
          // No lastSync in event - only clear if not manual sync
          // Keep progress if manual sync is active (might be temporary SSE issue)
          if (!isManualSync) {
            setSyncProgress(null);
          }
        }
      } catch (err) {
        console.warn("[Visits SSE] Failed to parse refresh data:", err);
      }
      scheduleRefresh();
    };

    const handleBootstrapEvent = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.lastSync) {
          const sync = data.lastSync;
          const syncTimestamp = sync.started_at ? new Date(sync.started_at).getTime() : 0;
          const now = Date.now();
          const fiveMinutesAgo = now - (5 * 60 * 1000);
          const isRecentSync = syncTimestamp > fiveMinutesAgo;
          const isSyncActive = sync.status === 'started' || sync.status === 'in_progress';
          
          // Show progress on bootstrap if:
          // 1. Manual sync is active (regardless of age or status)
          // 2. Sync is active and recent
          if (isManualSync || (isSyncActive && isRecentSync)) {
            if (isSyncActive) {
              setSyncProgress({
                status: sync.status,
                progress: sync.progress_percent || 0,
                fetched: sync.fetched || 0,
                inserted: sync.inserted || 0,
                updated: sync.updated || 0,
                failed: sync.failed || 0,
                total: sync.total_records || 0,
                processed: sync.processed_records || 0,
              });
            } else if ((sync.status === 'completed' || sync.status === 'failed') && isManualSync) {
              // Show completion only if manual sync
              setSyncProgress({
                status: sync.status,
                progress: 100,
                fetched: sync.fetched || 0,
                inserted: sync.inserted || 0,
                updated: sync.updated || 0,
                failed: sync.failed || 0,
                total: sync.total_records || 0,
                processed: sync.processed_records || 0,
                duration: sync.duration_seconds || 0,
                error: sync.error_message || null,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Visits SSE] Failed to parse bootstrap data:", err);
      }
      scheduleRefresh();
    };

    const handleErrorEvent = (event) => {
      console.warn("[Visits SSE] Error event:", event.data);
    };

    eventSource.addEventListener("visits:refresh", handleRefreshEvent);
    eventSource.addEventListener("visits:bootstrap", handleBootstrapEvent);
    eventSource.addEventListener("visits:error", handleErrorEvent);

    eventSource.onerror = (error) => {
      console.warn("[Visits SSE] Connection error:", error);
    };

    return () => {
      if (eventSource) {
        eventSource.removeEventListener("visits:refresh", handleRefreshEvent);
        eventSource.removeEventListener("visits:bootstrap", handleBootstrapEvent);
        eventSource.removeEventListener("visits:error", handleErrorEvent);
        eventSource.close();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [fetchVisits, fetchStats, isManualSync]);

  // Derive unique facility names (nama faskes) from current dataset
  useEffect(() => {
    const names = Array.from(
      new Set((allVisits || []).map(v => v?.facility?.name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    setFacilityNames(names);
  }, [allVisits]);

  // Refetch stats when visits data changes (e.g., after add/edit/delete)
  // Removed: This was causing excessive re-renders and high CPU usage
  // Stats will be fetched on initial load only
  // useEffect(() => {
  //   if (isLoaded) {
  //     fetchStats();
  //   }
  // }, [visits.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setSearchDate(searchDateInput);
    setPage(1);
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchDateChange = (e) => {
    setSearchDateInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setSearchDateInput("");
    setSearchDate("");
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(
        "/api/visits" + (selectedVisit ? `/${selectedVisit.id}` : ""),
        {
          method: selectedVisit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      toast.success(
        selectedVisit
          ? "Kunjungan berhasil diupdate"
          : "Kunjungan berhasil ditambahkan"
      );
      setShowForm(false);
      setSelectedVisit(null);
      fetchVisits();
      fetchStats(); // Update statistics after saving
    } catch (error) {

      toast.error("Gagal menyimpan kunjungan");
    }
  };

  // Handle sync data from external API
  const [syncing, setSyncing] = useState(false);

  const handleSyncData = async () => {
    if (
      !confirm(
        'Jalankan sinkronisasi data dari API? Sistem akan mengambil semua data kunjungan dari API eksternal dan menyimpannya ke database lokal. Proses ini mungkin memakan waktu beberapa menit.'
      )
    ) {
      return;
    }

    try {
      setSyncing(true);
      setIsManualSync(true); // Mark as manual sync - DON'T reset this until sync completes
      setSyncProgress(null); // Clear any old progress
      toast.loading('Memulai sinkronisasi data...', { id: 'sync-toast' });

      const response = await fetch('/api/visits/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSize: 50, // Batch size untuk processing
          delayBetweenBatches: 2000, // 2 detik delay antar batch untuk mengurangi load CPU API
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Gagal melakukan sync');
      }

      // Don't show success toast immediately - sync is still running in background
      // Progress will be shown via SSE events
      toast.success('Sync dimulai! Progress akan ditampilkan di bawah...', { id: 'sync-toast', duration: 3000 });
      
      // Note: isManualSync will be reset in handleRefreshEvent when sync completes
      // Don't reset it here because sync is still running in background
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`❌ Gagal melakukan sync: ${error.message}`, { id: 'sync-toast', duration: 6000 });
      // Reset manual sync flag on error only
      setTimeout(() => {
        setIsManualSync(false);
        setSyncProgress(null);
      }, 3000);
    } finally {
      setSyncing(false);
      // DON'T reset isManualSync here - sync is still running in background
      // It will be reset when sync completes (via SSE event handler)
    }
  };

  const handleCancelSync = async () => {
    if (!confirm('Hentikan sinkronisasi yang sedang berjalan?')) {
      return;
    }

    try {
      toast.loading('Menghentikan sync...', { id: 'cancel-sync-toast' });
      
      const response = await fetch('/api/visits/sync', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Gagal menghentikan sync');
      }

      toast.success(`✅ ${result.message}`, { id: 'cancel-sync-toast', duration: 3000 });
      
      // Reset states
      setIsManualSync(false);
      setSyncProgress(null);
      setSyncing(false);
      
      // Refresh data
      setTimeout(() => {
        fetchVisits();
        fetchStats();
      }, 1000);
    } catch (error) {
      console.error('Cancel sync error:', error);
      toast.error(`❌ Gagal menghentikan sync: ${error.message}`, { id: 'cancel-sync-toast', duration: 6000 });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus kunjungan ini?")) {
      try {
        const response = await fetch(`/api/visits/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete");

        toast.success("Kunjungan berhasil dihapus");
        fetchVisits();
        fetchStats(); // Update statistics after deletion
      } catch (error) {

        toast.error("Gagal menghapus kunjungan");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Recompute doctor options when Poli or Faskes changes
    if (name === 'clinic' || name === 'facilityName') {
      const nextFilters = { ...filters, [name]: value };

      const hasClinic = !!nextFilters.clinic;
      const hasFacility = !!nextFilters.facilityName;

      if (hasClinic && hasFacility) {
        // When both clinic and facility are selected, show doctors that appear
        // in visits matching BOTH the selected clinic and facility
        const allowedDoctorNames = Array.from(new Set(
          (allVisits || [])
            .filter(v =>
              (v?.clinic || v?.room || '') === nextFilters.clinic &&
              (v?.facility?.name || '') === nextFilters.facilityName
            )
            .map(v => v?.doctor?.name)
            .filter(Boolean)
        ));

        const filteredDoctors = (allDoctors || []).filter(d => allowedDoctorNames.includes(d.name));
        setDoctors(filteredDoctors);

        if (nextFilters.doctorId && !filteredDoctors.some(d => d.name === nextFilters.doctorId)) {
          setFilters(prev => ({ ...prev, doctorId: '' }));
        }
      } else if (name === 'clinic') {
        // Backward-compatible behavior: filter by clinic only
        if (value) {
          const filteredDoctors = allDoctors.filter(doctor => 
            doctor.polyclinics && doctor.polyclinics.includes(value)
          );
          setDoctors(filteredDoctors);
          if (filters.doctorId && !filteredDoctors.some(d => d.name === filters.doctorId)) {
            setFilters(prev => ({ ...prev, doctorId: '' }));
          }
        } else {
          setDoctors(allDoctors);
        }
      } else if (name === 'facilityName') {
        // If only facility changes (no clinic), keep current behavior (do not narrow by facility only)
        // so users can optionally select clinic to narrow further. No-op here.
      }
    }
    // Don't reset page or apply filters automatically
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      doctorId: "",
      clinic: "",
      startDate: "",
      endDate: "",
      facilityName: "",
    });
    setAppliedFilters({
      status: "",
      doctorId: "",
      clinic: "",
      startDate: "",
      endDate: "",
      facilityName: "",
    });
    // Reset doctors list to show all doctors
    setDoctors(allDoctors);
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate the range of pages to show around current page
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    // Always show first page
    if (totalPages > 0) {
      rangeWithDots.push(1);
    }

    // Add dots and range if needed
    if (page - delta > 2) {
      rangeWithDots.push("...");
    }

    // Add the middle range (excluding first and last page)
    range.forEach((pageNum) => {
      if (pageNum !== 1 && pageNum !== totalPages) {
        rangeWithDots.push(pageNum);
      }
    });

    // Add dots and last page if needed
    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...");
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remove duplicates while preserving order
    return rangeWithDots.filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
  };

  // Note: Stats are now fetched separately via fetchStats()
  // This ensures accurate counts regardless of current filters/pagination
  // visitStats.total = ALL visits in database
  // visitStats.today = ALL visits today (not affected by filters)
  // visitStats.active = ALL active visits
  // visitStats.completed = ALL completed visits

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                Manajemen Kunjungan
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Daftar <span className="text-yellow-300">Kunjungan</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Kelola jadwal kunjungan, status pasien, dan riwayat medis dengan sistem yang terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              {syncProgress && (syncProgress.status === 'in_progress' || syncProgress.status === 'started') ? (
                <button
                  onClick={handleCancelSync}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <X className="w-5 h-5 mr-2" />
                  Hentikan Sync
                </button>
              ) : (
                <button
                  onClick={handleSyncData}
                  disabled={syncing}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                  {syncing ? 'Syncing...' : 'Sync Data'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Progress Banner */}
        {syncProgress && (
          <div className={`rounded-2xl p-5 shadow-xl border-2 transition-all duration-300 ${
            syncProgress.status === 'completed' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : syncProgress.status === 'failed'
              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {syncProgress.status === 'in_progress' || syncProgress.status === 'started' ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : syncProgress.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="text-lg font-bold text-gray-900">
                    {syncProgress.status === 'in_progress' || syncProgress.status === 'started' 
                      ? 'Sinkronisasi Data Sedang Berlangsung' 
                      : syncProgress.status === 'completed'
                      ? 'Sinkronisasi Selesai'
                      : 'Sinkronisasi Gagal'}
                  </h3>
                </div>
                
                {/* Progress Bar */}
                {(syncProgress.status === 'in_progress' || syncProgress.status === 'started') && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Progress: {syncProgress.progress}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {syncProgress.processed.toLocaleString('id-ID')} / {syncProgress.total.toLocaleString('id-ID')} records
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${syncProgress.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Fetched</p>
                    <p className="text-lg font-bold text-gray-900">{syncProgress.fetched.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Inserted</p>
                    <p className="text-lg font-bold text-green-600">{syncProgress.inserted.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Updated</p>
                    <p className="text-lg font-bold text-blue-600">{syncProgress.updated.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Failed</p>
                    <p className={`text-lg font-bold ${syncProgress.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {syncProgress.failed.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Duration and Error */}
                {(syncProgress.status === 'completed' || syncProgress.status === 'failed') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {syncProgress.duration && (
                      <p className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Durasi: {syncProgress.duration} detik
                      </p>
                    )}
                    {syncProgress.error && (
                      <p className="text-sm text-red-600 mt-1">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {syncProgress.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Close button */}
              {(syncProgress.status === 'completed' || syncProgress.status === 'failed') && (
                <button
                  onClick={() => setSyncProgress(null)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className={`bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-blue-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">+15%</span>
              </div>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {stats.total.toLocaleString('id-ID')}
              </p>
              <p className="text-base font-semibold text-gray-700 mb-1">Total Kunjungan</p>
              <p className="text-xs text-gray-500 font-medium">
                Semua waktu
              </p>
              {facilityStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Per Faskes</p>
                    <span className="text-xs text-gray-400">{facilityStats.length} faskes</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {facilityStats.map((facility, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-gray-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-semibold text-gray-700">{facility.facilityCode}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 bg-blue-50 px-2.5 py-1 rounded-md">{facility.total.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div 
            className={`bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <CalendarDays className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Bulan Ini</span>
              </div>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {stats.monthly.toLocaleString('id-ID')}
              </p>
              <p className="text-base font-semibold text-gray-700 mb-1">Kunjungan Bulan Ini</p>
              {isLoaded && (
                <p className="text-xs text-gray-500 font-medium">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              )}
              {facilityStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Per Faskes</p>
                    <span className="text-xs text-gray-400">{facilityStats.length} faskes</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {facilityStats.map((facility, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-gray-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-sm font-semibold text-gray-700">{facility.facilityCode}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 bg-purple-50 px-2.5 py-1 rounded-md">{facility.monthly.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div 
            className={`bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-2xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <CalendarDays className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-200">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">Hari Ini</span>
              </div>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {stats.today.toLocaleString('id-ID')}
              </p>
              <p className="text-base font-semibold text-gray-700 mb-1">Kunjungan Hari Ini</p>
              {isLoaded && (
                <p className="text-xs text-gray-500 font-medium">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {facilityStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Per Faskes</p>
                    <span className="text-xs text-gray-400">{facilityStats.length} faskes</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {facilityStats.map((facility, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-gray-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm font-semibold text-gray-700">{facility.facilityCode}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 bg-orange-50 px-2.5 py-1 rounded-md">{facility.today.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter
              </h2>
              <p className="text-gray-600 mt-2">Cari dan filter kunjungan berdasarkan berbagai kriteria</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari kunjungan (pasien, dokter, keluhan)..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
                />
                <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  placeholder="Pilih tanggal"
                  value={searchDateInput}
                  onChange={handleSearchDateChange}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
                />
                <Calendar className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Cari
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-4 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold ${
                    showFilters 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filter
                </button>
                {(search || searchDate) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Filter Lanjutan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Awal
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poli
                    </label>
                    <select
                      name="clinic"
                      value={filters.clinic}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Semua Poli</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.name}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Faskes
                    </label>
                    <select
                      name="facilityName"
                      value={filters.facilityName}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Semua Faskes</option>
                      {facilityNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dokter
                    </label>
                    <select
                      name="doctorId"
                      value={filters.doctorId}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Semua Dokter</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.name}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                </div>
                <div className="flex flex-wrap justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Reset Filter
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Search Results */}
          {(search || searchDate) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Hasil pencarian untuk:</span>
                {search && <span className="ml-1">"{search}"</span>}
                {search && searchDate && <span className="mx-1">dan</span>}
                {searchDate && (
                  <span className="ml-1">
                    tanggal {new Date(searchDate).toLocaleDateString("id-ID")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Active Filters Display */}
          {(appliedFilters.startDate ||
            appliedFilters.endDate ||
            appliedFilters.status ||
            appliedFilters.doctorId ||
            appliedFilters.clinic ||
            appliedFilters.facilityName) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              {appliedFilters.startDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Dari: {appliedFilters.startDate}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, startDate: "" }));
                      setAppliedFilters((prev) => ({ ...prev, startDate: "" }));
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.endDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Sampai: {appliedFilters.endDate}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, endDate: "" }));
                      setAppliedFilters((prev) => ({ ...prev, endDate: "" }));
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {appliedFilters.status}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, status: "" }));
                      setAppliedFilters((prev) => ({ ...prev, status: "" }));
                    }}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.doctorId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Dokter: {appliedFilters.doctorId}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, doctorId: "" }));
                      setAppliedFilters((prev) => ({ ...prev, doctorId: "" }));
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.clinic && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Poli: {appliedFilters.clinic}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, clinic: "" }));
                      setAppliedFilters((prev) => ({ ...prev, clinic: "" }));
                      // Reset doctors list to show all doctors
                      setDoctors(allDoctors);
                    }}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {appliedFilters.facilityName && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Faskes: {appliedFilters.facilityName}
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, facilityName: "" }));
                      setAppliedFilters((prev) => ({ ...prev, facilityName: "" }));
                    }}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              )}
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
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  Data Kunjungan
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap kunjungan pasien dalam sistem
                </p>
              </div>
             
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Kunjungan</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : (
              <>
                {/* Visits Table */}
                <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full min-w-max">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No. Kunjungan
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pasien
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NIK
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dokter
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diagnosa
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visits.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-3 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Kunjungan</h3>
                              <p className="text-gray-500">Belum ada kunjungan yang tercatat dalam sistem</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        visits.map((visit) => (
                          <tr key={visit.uniqueId || visit.id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">{visit.visitNumber || visit.id}</div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {visit.patient?.name || "-"}
                              </div>
                              {visit.patient?.noPeserta && (
                                <div className="text-sm text-gray-500">
                                  No. Peserta: {visit.patient.noPeserta}
                                </div>
                              )}
                              {visit.patient?.nip && (
                                <div className="text-sm text-gray-500">
                                  NIP: {visit.patient.nip}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visit.patient?.nik || "-"}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-semibold">{visit.doctor?.name || "-"}</span>
                                {visit.clinic || visit.room ? (
                                  <span className="text-xs text-gray-500">Poli: {visit.clinic || visit.room}</span>
                                ) : null}
                                {visit.facility?.code ? (
                                  <span className="text-xs text-gray-500">Klinik: {visit.facility.code}</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={visit.diagnosis || visit.complaint || "-"}>
                              {visit.diagnosis || visit.complaint || "-"}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  visit.status === "Selesai"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {visit.status || "Aktif"}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visit.visitDate
                                ? new Date(visit.visitDate).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  })
                                : visit.createdAt
                                ? new Date(visit.createdAt).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  })
                                : "-"}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedVisitDetail(visit);
                                    setShowDetailModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                               
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Data Info and Pagination */}
                <div className="table-pagination-wrapper">
                  {/* Data info and pagination controls */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Data info */}
                      <div className="text-sm text-gray-600">
                        Menampilkan{" "}
                        <span className="font-semibold text-blue-600">
                          {(page - 1) * limit + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-semibold text-blue-600">
                          {Math.min(page * limit, allVisits.length || 0)}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-blue-600">{metadata.total || 0}</span>{" "}
                        data kunjungan
                        {metadata.total > allVisits.length && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({allVisits.length} data terbaru tersedia)
                          </span>
                        )}
                      </div>

                      {/* Items per page */}
                      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                        <label
                          htmlFor="limit-visits"
                          className="text-sm text-gray-700 whitespace-nowrap font-medium"
                        >
                          Data per halaman:
                        </label>
                        <select
                          id="limit-visits"
                          value={limit}
                          onChange={handleLimitChange}
                          className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none focus:ring-0 font-semibold"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="mobile-pagination-container">
                      {/* Mobile Compact Pagination */}
                      <div className="lg:hidden mobile-pagination-compact">
                        <div className="mobile-pagination-info">
                          Halaman {page} dari {totalPages}
                        </div>
                        <div className="mobile-pagination-controls">
                          <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman pertama"
                          >
                            <FaAngleDoubleLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman sebelumnya"
                          >
                            <FaChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="mobile-pagination-page-info">
                            {page}
                          </span>
                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman selanjutnya"
                          >
                            <FaChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="mobile-pagination-icon-button mobile-pagination-touch"
                            title="Halaman terakhir"
                          >
                            <FaAngleDoubleRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Desktop Full Pagination */}
                      <div className="hidden lg:block">
                        <div className="mobile-pagination-group">
                          {/* First page button */}
                          <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="mobile-pagination-button"
                            title="Halaman pertama"
                          >
                            <FaAngleDoubleLeft className="h-4 w-4" />
                          </button>

                          {/* Previous page button */}
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="mobile-pagination-button"
                            title="Halaman sebelumnya"
                          >
                            <FaChevronLeft className="h-4 w-4" />
                          </button>

                          {/* Page numbers */}
                          {getPageNumbers().map((pageNum, index) => {
                            if (pageNum === "...") {
                              return (
                                <span
                                  key={index}
                                  className="mobile-pagination-dots"
                                >
                                  ...
                                </span>
                              );
                            }

                            return (
                              <button
                                key={index}
                                onClick={() => setPage(pageNum)}
                                className={`mobile-pagination-number text-black mobile-pagination-touch ${
                                  pageNum === page
                                    ? "mobile-pagination-number.active"
                                    : "mobile-pagination-number.inactive"
                                }`}
                                title={`Halaman ${pageNum}`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          {/* Next page button */}
                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="mobile-pagination-button"
                            title="Halaman selanjutnya"
                          >
                            <FaChevronRight className="h-4 w-4" />
                          </button>

                          {/* Last page button */}
                          <button
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                            className="mobile-pagination-button"
                            title="Halaman terakhir"
                          >
                            <FaAngleDoubleRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <ApiDocumentation pageType="visits" />

        {/* Visit Detail Modal */}
        {showDetailModal && (
          <VisitDetailModal
            visit={selectedVisitDetail}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedVisitDetail(null);
            }}
          />
        )}

        {/* Visit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedVisit ? "Edit Kunjungan" : "Tambah Kunjungan"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedVisit(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <VisitForm
                visit={selectedVisit}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedVisit(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
