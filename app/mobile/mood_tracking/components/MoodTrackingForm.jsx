"use client";

import { useState, useEffect } from "react";
import { X, Save, User, Heart, Calendar, Clock } from "lucide-react";

export default function MoodTrackingForm({ moodData, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    user_id: "",
    mood: "happy",
    energy_level: 5,
    recorded_at: "",
    notes: ""
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (moodData) {
      setFormData({
        user_id: moodData.user_id || "",
        mood: moodData.mood || "happy",
        energy_level: moodData.energy_level || 5,
        recorded_at: moodData.recorded_at ? moodData.recorded_at.split('T')[0] + 'T' + moodData.recorded_at.split('T')[1].substring(0, 5) : "",
        notes: moodData.notes || ""
      });
    } else {
      // Set default values for new mood data
      setFormData({
        user_id: "",
        mood: "happy",
        energy_level: 5,
        recorded_at: new Date().toISOString().slice(0, 16),
        notes: ""
      });
    }
  }, [moodData]);

  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/mobile/users?limit=1000');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const moodOptions = [
    { value: "happy", label: "Happy", emoji: "😊" },
    { value: "sad", label: "Sad", emoji: "😢" },
    { value: "angry", label: "Angry", emoji: "😠" },
    { value: "excited", label: "Excited", emoji: "🤩" },
    { value: "calm", label: "Calm", emoji: "😌" },
    { value: "anxious", label: "Anxious", emoji: "😰" },
    { value: "tired", label: "Tired", emoji: "😴" },
    { value: "energetic", label: "Energetic", emoji: "⚡" }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6" />
              <h2 className="text-xl font-semibold">
                {moodData ? 'Edit Mood Data' : 'Tambah Data Mood Baru'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                User *
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={loadingData}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {loadingData && (
                <p className="text-sm text-gray-500 mt-1">Loading users...</p>
              )}
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-2" />
                Mood *
              </label>
              <select
                name="mood"
                value={formData.mood}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {moodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level: {formData.energy_level}/10
              </label>
              <input
                type="range"
                name="energy_level"
                min="1"
                max="10"
                value={formData.energy_level}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="recorded_at"
                  value={formData.recorded_at}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="How are you feeling today? Any specific thoughts or events that affected your mood?"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {moodData ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 