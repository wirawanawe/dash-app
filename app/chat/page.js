"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import ChatList from "./components/ChatList";
import ChatConversation from "./components/ChatConversation";
import ApiDocumentation from "@/components/ApiDocumentation";
import NewChatModal from "./components/NewChatModal";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Clock,
  Star,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Stethoscope
} from 'lucide-react';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
  const canAccessChat = user?.role === "DOCTOR" || user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  // Check if user is doctor
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push("/login");
      return;
    }

    if (!canAccessChat) {
      router.push("/dashboard");
      toast.error("Akses ditolak. Hanya dokter, admin, dan superadmin yang dapat mengakses fitur chat.");
      return;
    }

    fetchChats();
    setIsLoaded(true);
  }, [user, authLoading, router, canAccessChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchTerm,
        status: statusFilter
      });

      const response = await fetch(`/api/chat?${params}`);
      const data = await response.json();

      if (response.ok) {
        setChats(data.chats);
      } else {

        toast.error("Gagal memuat daftar chat");
      }
    } catch (error) {

      toast.error("Terjadi kesalahan saat memuat chat");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/${chatId}?limit=100`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
      } else {

        toast.error("Gagal memuat pesan");
      }
    } catch (error) {

      toast.error("Terjadi kesalahan saat memuat pesan");
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async (content) => {
    if (!selectedChat || !content.trim()) return;

    try {
      const response = await fetch(`/api/chat/${selectedChat.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add new message to the list
        setMessages(prev => [...prev, data.messageData]);
        // Refresh chat list to update last message
        fetchChats();
      } else {
        toast.error(data.message || "Gagal mengirim pesan");
      }
    } catch (error) {

      toast.error("Terjadi kesalahan saat mengirim pesan");
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(`/api/chat/${selectedChat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Chat ditutup");
        setSelectedChat(null);
        setMessages([]);
        fetchChats();
      } else {
        toast.error(data.message || "Gagal menutup chat");
      }
    } catch (error) {

      toast.error("Terjadi kesalahan saat menutup chat");
    }
  };

  const handleReopenChat = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(`/api/chat/${selectedChat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Chat dibuka kembali");
        fetchChats();
      } else {
        toast.error(data.message || "Gagal membuka kembali chat");
      }
    } catch (error) {

      toast.error("Terjadi kesalahan saat membuka kembali chat");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchChats();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchChats();
  };

  const handleNewChatCreated = () => {
    setShowNewChatModal(false);
    fetchChats();
  };

  // Auto-refresh chats every 30 seconds
  useEffect(() => {
    if (!user || !canAccessChat) return;

    const interval = setInterval(() => {
      fetchChats();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, searchTerm, statusFilter]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !canAccessChat) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat Dokter</h1>
                <p className="text-gray-600">
                  Kelola percakapan dengan pasien mobile
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Chat Baru
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chat</p>
                <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chat Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {chats.filter(chat => chat.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chat Tertutup</p>
                <p className="text-2xl font-bold text-gray-600">
                  {chats.filter(chat => chat.status === 'closed').length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <X className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pesan Belum Dibaca</p>
                <p className="text-2xl font-bold text-orange-600">
                  {chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Chat List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search and Filter */}
              <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Cari chat..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>

                {/* Status Filter */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusFilter("active")}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === "active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => handleStatusFilter("closed")}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === "closed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Tertutup
                  </button>
                  <button
                    onClick={() => handleStatusFilter("all")}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter === "all"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p>Tidak ada chat</p>
                  </div>
                ) : (
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onChatSelect={handleChatSelect}
                  />
                )}
              </div>
            </div>

            {/* Chat Conversation */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <ChatConversation
                  chat={selectedChat}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onCloseChat={handleCloseChat}
                  onReopenChat={handleReopenChat}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Pilih chat untuk memulai percakapan</p>
                    <p className="text-sm">Atau buat chat baru dengan pasien</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <ApiDocumentation pageType="chat" />

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleNewChatCreated}
        />
      )}
    </DashboardLayout>
  );
} 