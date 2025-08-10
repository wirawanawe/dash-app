import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  CheckCircle, 
  User, 
  Stethoscope,
  Phone,
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  MessageSquare
} from 'lucide-react';

export default function ChatConversation({ 
  chat, 
  messages, 
  onSendMessage, 
  onCloseChat, 
  onReopenChat 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chat) {
      inputRef.current?.focus();
    }
  }, [chat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isTyping) return;

    setIsTyping(true);
    onSendMessage(newMessage);
    setNewMessage('');
    setIsTyping(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const isSameDay = (date1, date2) => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {chat.user_avatar ? (
              <img
                src={chat.user_avatar}
                alt={chat.user_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {chat.user_name || 'User'}
            </h3>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {chat.user_phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{chat.user_phone}</span>
                </div>
              )}
              {chat.user_email && (
                <div className="flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>{chat.user_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Actions */}
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            chat.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {chat.status === 'active' ? 'Aktif' : 'Tertutup'}
          </span>
          
          <div className="flex items-center space-x-1">
            {chat.status === 'active' ? (
              <button
                onClick={onCloseChat}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Tutup chat"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onReopenChat}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Buka kembali chat"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-sm">Belum ada pesan</p>
            <p className="text-xs">Mulai percakapan dengan mengirim pesan</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isDoctor = message.sender_type === 'doctor';
            const showDate = index === 0 || !isSameDay(message.sent_at, messages[index - 1]?.sent_at);
            
            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.sent_at)}
                    </span>
                  </div>
                )}
                
                {/* Message */}
                <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isDoctor ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {isDoctor ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 rounded-lg ${
                        isDoctor 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Message Time */}
                      <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isDoctor ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(message.sent_at)}</span>
                        {isDoctor && (
                          <div className="flex items-center space-x-1">
                            {message.is_read ? (
                              <CheckCircle className="w-3 h-3 text-blue-500" />
                            ) : (
                              <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {chat.status === 'active' && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isTyping}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Lampirkan file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                disabled={!newMessage.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Kirim pesan"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Closed Chat Message */}
      {chat.status === 'closed' && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-gray-500">
            <X className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Chat ini telah ditutup</p>
            <p className="text-xs">Klik tombol "Buka Kembali" untuk melanjutkan percakapan</p>
          </div>
        </div>
      )}
    </div>
  );
} 