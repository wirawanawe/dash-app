"use client";

import { X, User, Moon, Calendar, Clock, Bed, Star, Activity } from "lucide-react";

export default function SleepTrackingDetailModal({ sleepData, onClose }) {
  const getQualityBadge = (quality) => {
    const qualityColors = {
      'excellent': 'bg-green-100 text-green-800 border-green-200',
      'good': 'bg-blue-100 text-blue-800 border-blue-200',
      'fair': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'poor': 'bg-red-100 text-red-800 border-red-200'
    };
    
    const qualityLabels = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${qualityColors[quality] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {qualityLabels[quality] || quality}
      </span>
    );
  };

  const getQualityIcon = (quality) => {
    switch (quality) {
      case 'excellent':
        return <Star className="w-6 h-6 text-green-600" />;
      case 'good':
        return <Star className="w-6 h-6 text-blue-600" />;
      case 'fair':
        return <Star className="w-6 h-6 text-yellow-600" />;
      case 'poor':
        return <Star className="w-6 h-6 text-red-600" />;
      default:
        return <Star className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatDuration = (hours, minutes) => {
    const totalHours = hours + (minutes / 60);
    const hoursPart = Math.floor(totalHours);
    const minutesPart = Math.round((totalHours - hoursPart) * 60);
    return `${hoursPart}h ${minutesPart}m`;
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Not recorded';
    return new Date(dateTime).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('id-ID');
  };

  const getSleepScore = (hours, quality) => {
    let score = 0;
    
    // Duration score (0-50 points)
    if (hours >= 7 && hours <= 9) score += 50;
    else if (hours >= 6 && hours <= 10) score += 40;
    else if (hours >= 5 && hours <= 11) score += 30;
    else if (hours >= 4 && hours <= 12) score += 20;
    else score += 10;
    
    // Quality score (0-50 points)
    switch (quality) {
      case 'excellent': score += 50; break;
      case 'good': score += 40; break;
      case 'fair': score += 25; break;
      case 'poor': score += 10; break;
      default: score += 0;
    }
    
    return Math.min(score, 100);
  };

  const sleepScore = getSleepScore(sleepData.sleep_hours || 0, sleepData.sleep_quality);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Sleep Tracking Details</h2>
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
                  <p className="text-sm text-gray-900 mt-1">{sleepData.user_name || `User ${sleepData.user_id}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm text-gray-900 mt-1">{sleepData.user_id}</p>
                </div>
              </div>
            </div>

            {/* Sleep Information */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Moon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Sleep Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sleep Duration</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{sleepData.sleep_hours} hours</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sleep Quality</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{sleepData.sleep_quality}/10</p>
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
                  <label className="block text-sm font-medium text-gray-500">Bedtime</label>
                  <p className="text-sm text-gray-900 mt-1">{formatTime(sleepData.bedtime)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Wake Time</label>
                  <p className="text-sm text-gray-900 mt-1">{formatTime(sleepData.wake_time)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {sleepData.notes && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{sleepData.notes}</p>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(sleepData.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(sleepData.updated_at)}</p>
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