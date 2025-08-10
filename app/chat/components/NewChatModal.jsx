import { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  MessageCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewChatModal({ onClose, onChatCreated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        search: searchTerm
      });

      const response = await fetch(`/api/chat/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        console.error('Failed to fetch users:', data.message);
        toast.error("Gagal memuat daftar user");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Terjadi kesalahan saat memuat user");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleCreateChat = async () => {
    if (!selectedUser) {
      toast.error("Pilih user terlebih dahulu");
      return;
    }

    try {
      setCreatingChat(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          title: `Chat dengan ${selectedUser.name}`,
          initial_message: initialMessage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Chat berhasil dibuat");
        onChatCreated(data.chat);
      } else {
        toast.error(data.message || "Gagal membuat chat");
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error("Terjadi kesalahan saat membuat chat");
    } finally {
      setCreatingChat(false);
    }
  };

  const getStatusBadge = (user) => {
    if (user.existing_chat_id) {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          user.chat_status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {user.chat_status === 'active' ? 'Chat Aktif' : 'Chat Tertutup'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Belum Ada Chat
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chat Baru</h2>
              <p className="text-sm text-gray-600">Pilih user untuk memulai percakapan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari user berdasarkan nama, email, atau nomor telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <User className="w-12 h-12 mb-2" />
              <p>Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        {getStatusBadge(user)}
                      </div>

                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        {user.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                      </div>

                      {user.existing_chat_id && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Chat ID: {user.existing_chat_id}</span>
                          {user.unread_messages > 0 && (
                            <span className="ml-2 text-orange-600">
                              • {user.unread_messages} pesan belum dibaca
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Select Indicator */}
                    {selectedUser?.id === user.id && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Initial Message Input */}
        {selectedUser && (
          <div className="p-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pesan Awal (Opsional)
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Ketik pesan awal untuk user ini..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleCreateChat}
            disabled={!selectedUser || creatingChat}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creatingChat ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Membuat Chat...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Buat Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 