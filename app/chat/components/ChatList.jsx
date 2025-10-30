import { useState } from 'react';
import { 
  MessageCircle, 
  User, 
  Clock, 
  CheckCircle, 
  X,
  Phone,
  Mail,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

export default function ChatList({ chats, selectedChat, onChatSelect }) {
  const [hoveredChat, setHoveredChat] = useState(null);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-red-100 text-red-700';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'closed':
        return 'Tertutup';
      case 'waiting':
        return 'Menunggu';
      default:
        return status;
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`p-4 cursor-pointer transition-colors ${
            selectedChat?.id === chat.id
              ? 'bg-blue-50 border-r-2 border-blue-500'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onChatSelect(chat)}
          onMouseEnter={() => setHoveredChat(chat.id)}
          onMouseLeave={() => setHoveredChat(null)}
        >
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {chat.user_avatar ? (
                <img
                  src={chat.user_avatar}
                  alt={chat.user_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {chat.user_name || 'User'}
                  </h3>
                  {chat.unread_count > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                    {getStatusText(chat.status)}
                  </span>
                  {hoveredChat === chat.id && (
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Last Message */}
              <div className="mt-1">
                <p className="text-sm text-gray-600 truncate">
                  {chat.last_message || 'Belum ada pesan'}
                </p>
              </div>

              {/* User Details */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {chat.user_phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{chat.user_phone}</span>
                  </div>
                )}
                {chat.user_email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{chat.user_email}</span>
                  </div>
                )}
              </div>

              {/* Time and Status */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {chat.last_message_time 
                      ? formatTime(chat.last_message_time)
                      : formatTime(chat.created_at)
                    }
                  </span>
                </div>
                
                {/* Read Status */}
                <div className="flex items-center space-x-1">
                  {chat.status === 'active' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {chat.status === 'closed' && (
                    <X className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Unread Indicator */}
          {chat.unread_count > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">
                {chat.unread_count} pesan belum dibaca
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 