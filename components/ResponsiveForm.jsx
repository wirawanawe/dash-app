"use client";

import React from "react";
import { Search, Filter, X, Plus, Edit, Trash, Eye } from "lucide-react";

const ResponsiveForm = ({ 
  onSubmit, 
  onReset, 
  searchValue, 
  onSearchChange, 
  placeholder = "Cari...",
  showSearch = true,
  showFilter = false,
  showAdd = false,
  onAdd,
  addLabel = "Tambah",
  children 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  const handleReset = () => {
    if (onReset) onReset();
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
              <Search className="w-5 h-5 text-white" />
            </div>
            Pencarian & Filter
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Cari dan filter data dengan mudah
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={onSearchChange}
                className="w-full px-4 py-3 sm:py-4 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm text-base"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          )}
          
          <div className="flex gap-2 sm:gap-3">
            <button
              type="submit"
              className="flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold touch-manipulation min-h-[44px]"
            >
              <Search className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Cari</span>
            </button>
            
            {searchValue && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center px-4 py-3 sm:py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold touch-manipulation min-h-[44px]"
              >
                <X className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {showAdd && onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold touch-manipulation min-h-[44px]"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">{addLabel}</span>
              </button>
            )}
          </div>
        </div>

        {children && (
          <div className="pt-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </form>
    </div>
  );
};

// Responsive Form Field Component
export const ResponsiveFormField = ({ 
  label, 
  children, 
  required = false,
  error,
  className = "" 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm sm:text-base font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

// Responsive Input Component
export const ResponsiveInput = ({ 
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-3 sm:py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm text-base touch-manipulation ${className}`}
      {...props}
    />
  );
};

// Responsive Select Component
export const ResponsiveSelect = ({ 
  value,
  onChange,
  options = [],
  placeholder = "Pilih...",
  required = false,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-3 sm:py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm text-base touch-manipulation ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Responsive Textarea Component
export const ResponsiveTextarea = ({ 
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  rows = 4,
  className = "",
  ...props 
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`w-full px-4 py-3 sm:py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm text-base touch-manipulation resize-vertical ${className}`}
      {...props}
    />
  );
};

// Responsive Button Component
export const ResponsiveButton = ({ 
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props 
}) => {
  const baseClasses = "flex items-center justify-center font-semibold rounded-xl transition-all duration-300 touch-manipulation";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:scale-105",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-xl hover:scale-105",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-xl hover:scale-105",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-4 sm:px-6 py-3 sm:py-4 text-base min-h-[44px]",
    lg: "px-6 sm:px-8 py-4 sm:py-5 text-lg min-h-[48px]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// Responsive Action Buttons Component
export const ResponsiveActionButtons = ({ 
  onView,
  onEdit,
  onDelete,
  loading = false,
  className = ""
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {onView && (
        <button
          onClick={onView}
          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
          title="Lihat Detail"
          aria-label="Lihat detail"
        >
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
          title="Edit"
          aria-label="Edit"
        >
          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={loading}
          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px] min-w-[44px]"
          title="Hapus"
          aria-label="Hapus"
        >
          <Trash className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
};

export default ResponsiveForm; 