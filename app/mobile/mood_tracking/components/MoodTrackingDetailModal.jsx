"use client";

import { X, User, Heart, Calendar, Clock, Activity } from "lucide-react";

export default function MoodTrackingDetailModal({ moodData, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodBadge = (mood) => {
    const moodConfig = {
      happy: { label: 'Happy', color: 'bg-green-100 text-green-800', emoji: '😊' },
      sad: { label: 'Sad', color: 'bg-blue-100 text-blue-800', emoji: '😢' },
      angry: { label: 'Angry', color: 'bg-red-100 text-red-800', emoji: '😠' },
      excited: { label: 'Excited', color: 'bg-yellow-100 text-yellow-800', emoji: '🤩' },
      calm: { label: 'Calm', color: 'bg-indigo-100 text-indigo-800', emoji: '😌' },
      anxious: { label: 'Anxious', color: 'bg-orange-100 text-orange-800', emoji: '😰' },
      tired: { label: 'Tired', color: 'bg-gray-100 text-gray-800', emoji: '😴' },
      energetic: { label: 'Energetic', color: 'bg-purple-100 text-purple-800', emoji: '⚡' }
    };

    const config = moodConfig[mood] || { label: mood, color: 'bg-gray-100 text-gray-800', emoji: '❓' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.emoji}</span>
        {config.label}
      </span>
    );
  };

  const getEnergyLevelColor = (level) => {
    if (level >= 8) return 'text-green-600';
    if (level >= 6) return 'text-yellow-600';
    if (level >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Mood Tracking Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* User Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">User Name</label>
                  <p className="text-sm text-gray-900 mt-1">{moodData.user_name || `User ${moodData.user_id}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm text-gray-900 mt-1">{moodData.user_id}</p>
                </div>
              </div>
            </div>

            {/* Mood Information */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">Mood Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Mood</label>
                  <div className="mt-1">{getMoodBadge(moodData.mood)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Energy Level</label>
                  <p className={`text-sm font-semibold mt-1 ${getEnergyLevelColor(moodData.energy_level)}`}>
                    {moodData.energy_level}/10
                  </p>
                </div>
              </div>
            </div>

            {/* Time Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Time Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(moodData.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Time</label>
                  <p className="text-sm text-gray-900 mt-1">{formatTime(moodData.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {moodData.notes && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{moodData.notes}</p>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(moodData.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(moodData.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div className="flex justify-end p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 