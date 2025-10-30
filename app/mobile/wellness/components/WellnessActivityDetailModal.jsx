'use client';

import { X, Clock, Flame, Target, CheckCircle, XCircle, Activity, User } from 'lucide-react';

export default function WellnessActivityDetailModal({ activity, onClose }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryBadge = (category) => {
    const colors = {
      fitness: 'bg-green-100 text-green-800',
      nutrition: 'bg-blue-100 text-blue-800',
      mental_health: 'bg-purple-100 text-purple-800',
      social: 'bg-orange-100 text-orange-800',
      environmental: 'bg-cyan-100 text-cyan-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Wellness Activity Details</h2>
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
                  <p className="text-sm text-gray-900 mt-1">{activity.user_name || `User ${activity.user_id}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.user_id}</p>
                </div>
              </div>
            </div>

            {/* Activity Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Activity Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Type</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{activity.activity_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{activity.duration_minutes} minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Calories Burned</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{activity.calories_burned} calories</p>
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
                  <p className="text-sm text-gray-900 mt-1">{formatDate(activity.activity_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Time</label>
                  <p className="text-sm text-gray-900 mt-1">{formatTime(activity.activity_date)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {activity.notes && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.notes}</p>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(activity.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(activity.updated_at)}</p>
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