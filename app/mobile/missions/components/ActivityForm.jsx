'use client';

import { useState, useEffect } from 'react';
import { X, Save, Activity, Calculator, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCrudOperation } from "@/utils/refreshUtils";

export default function ActivityForm({ activity, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    user_id: '',
    activity_id: '',
    activity_name: '',
    activity_type: '',
    activity_category: '',
    duration: '',
    points_earned: '',
    notes: '',
    mood_before: '',
    mood_after: '',
    stress_level_before: '',
    stress_level_after: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [calculatedPoints, setCalculatedPoints] = useState(0);

  // Activity categories with their base points
  const activityCategories = {
    fitness: { name: 'Fitness', basePoints: 15, icon: '🏃‍♂️' },
    nutrition: { name: 'Nutrition', basePoints: 10, icon: '🥗' },
    wellness: { name: 'Wellness', basePoints: 12, icon: '🧘‍♀️' },
    mindfulness: { name: 'Mindfulness', basePoints: 8, icon: '🧠' },
    health: { name: 'Health', basePoints: 10, icon: '❤️' },
    sports: { name: 'Sports', basePoints: 20, icon: '⚽' },
    meditation: { name: 'Meditation', basePoints: 6, icon: '🧘‍♂️' },
    yoga: { name: 'Yoga', basePoints: 12, icon: '🧘‍♀️' }
  };

  // Activity types with difficulty multipliers
  const activityTypes = {
    beginner: { name: 'Beginner', multiplier: 1.0 },
    intermediate: { name: 'Intermediate', multiplier: 1.2 },
    advanced: { name: 'Advanced', multiplier: 1.5 },
    expert: { name: 'Expert', multiplier: 2.0 }
  };

  useEffect(() => {
    if (activity) {
      setFormData({
        user_id: activity.user_id || '',
        activity_id: activity.activity_id || '',
        activity_name: activity.activity_name || '',
        activity_type: activity.activity_type || '',
        activity_category: activity.activity_category || '',
        duration: activity.duration || '',
        points_earned: activity.points_earned || '',
        notes: activity.notes || '',
        mood_before: activity.mood_before || '',
        mood_after: activity.mood_after || '',
        stress_level_before: activity.stress_level_before || '',
        stress_level_after: activity.stress_level_after || ''
      });
    }
  }, [activity]);

  // Calculate points based on category, type, and duration
  useEffect(() => {
    if (formData.activity_category && formData.activity_type && formData.duration) {
      const category = activityCategories[formData.activity_category];
      const type = activityTypes[formData.activity_type];
      
      if (category && type) {
        const basePoints = category.basePoints;
        const multiplier = type.multiplier;
        const durationMultiplier = Math.min(parseInt(formData.duration) / 30, 2); // Max 2x for duration
        const calculated = Math.round(basePoints * multiplier * durationMultiplier);
        setCalculatedPoints(calculated);
      }
    } else {
      setCalculatedPoints(0);
    }
  }, [formData.activity_category, formData.activity_type, formData.duration]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.user_id) newErrors.user_id = 'User ID is required';
    if (!formData.activity_id) newErrors.activity_id = 'Activity ID is required';
    if (!formData.activity_name) newErrors.activity_name = 'Activity name is required';
    if (!formData.activity_type) newErrors.activity_type = 'Activity type is required';
    if (!formData.activity_category) newErrors.activity_category = 'Activity category is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (formData.duration && parseInt(formData.duration) <= 0) newErrors.duration = 'Duration must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use calculated points if points_earned is empty
      const finalData = {
        ...formData,
        points_earned: formData.points_earned || calculatedPoints.toString()
      };

      const url = activity 
        ? `/api/mobile/activities/${activity.id}` 
        : '/api/mobile/activities';
      
      const method = activity ? 'PUT' : 'POST';
      
      await createCrudOperation(
        method,
        url,
        finalData,
        () => Promise.resolve(), // Form handles refresh through onSubmit callback
        { setLoading }
      );

      toast.success('Activity saved successfully!');
      onSubmit();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl text-black font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {activity ? 'Edit Activity' : 'Add New Activity'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">User ID *</label>
                  <input
                    type="number"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.user_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity ID *</label>
                  <input
                    type="text"
                    name="activity_id"
                    value={formData.activity_id}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.activity_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.activity_id && <p className="mt-1 text-sm text-red-600">{errors.activity_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Name *</label>
                  <input
                    type="text"
                    name="activity_name"
                    value={formData.activity_name}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.activity_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.activity_name && <p className="mt-1 text-sm text-red-600">{errors.activity_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Type *</label>
                  <select
                    name="activity_type"
                    value={formData.activity_type}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.activity_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Type</option>
                    {Object.entries(activityTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name} (x{type.multiplier})</option>
                    ))}
                  </select>
                  {errors.activity_type && <p className="mt-1 text-sm text-red-600">{errors.activity_type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Category *</label>
                  <select
                    name="activity_category"
                    value={formData.activity_category}
                    onChange={handleChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.activity_category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {Object.entries(activityCategories).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.icon} {category.name} ({category.basePoints} pts)
                      </option>
                    ))}
                  </select>
                  {errors.activity_category && <p className="mt-1 text-sm text-red-600">{errors.activity_category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className={`mt-1 block w-full px-3 py-2 border text-black rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                </div>
              </div>
            </div>

            {/* Points Calculation */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calculator className="w-5 h-5 mr-2 text-orange-600" />
                <h4 className="text-lg font-medium text-orange-900">Points Calculation</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">Duration: {formData.duration || 0} min</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">
                    Calculated Points: {calculatedPoints}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Manual Points (Optional)</label>
                  <input
                    type="number"
                    name="points_earned"
                    value={formData.points_earned}
                    onChange={handleChange}
                    min="0"
                    placeholder={calculatedPoints.toString()}
                    className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Mood & Stress Tracking */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mood & Stress Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mood Before</label>
                  <select
                    name="mood_before"
                    value={formData.mood_before}
                    onChange={handleChange}
                    className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Mood</option>
                    <option value="very_happy">😊 Very Happy</option>
                    <option value="happy">🙂 Happy</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="sad">😔 Sad</option>
                    <option value="very_sad">😢 Very Sad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mood After</label>
                  <select
                    name="mood_after"
                    value={formData.mood_after}
                    onChange={handleChange}
                    className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Mood</option>
                    <option value="very_happy">😊 Very Happy</option>
                    <option value="happy">🙂 Happy</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="sad">😔 Sad</option>
                    <option value="very_sad">😢 Very Sad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Stress Level Before</label>
                  <select
                    name="stress_level_before"
                    value={formData.stress_level_before}
                    onChange={handleChange}
                    className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Stress Level</option>
                    <option value="low">😌 Low</option>
                    <option value="moderate">😐 Moderate</option>
                    <option value="high">😰 High</option>
                    <option value="very_high">😱 Very High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Stress Level After</label>
                  <select
                    name="stress_level_after"
                    value={formData.stress_level_after}
                    onChange={handleChange}
                    className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Stress Level</option>
                    <option value="low">😌 Low</option>
                    <option value="moderate">😐 Moderate</option>
                    <option value="high">😰 High</option>
                    <option value="very_high">😱 Very High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div>
                <label className="block text-sm font-medium text-gray-500">Activity Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add any notes about this activity..."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Always Visible */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {activity ? 'Update Activity' : 'Create Activity'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 