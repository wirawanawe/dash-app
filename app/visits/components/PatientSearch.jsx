"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export default function PatientSearch({ onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const value = searchInput.trim();

    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchTerm(value);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/search?q=${value}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
    // Clear results if input is less than 3 characters
    if (e.target.value.length < 3) {
      setSearchResults([]);
      setSearchTerm("");
    }
  };

  const handleSelectPatient = (patient) => {
    onSelect(patient);
    setSearchInput(patient.name);
    setSearchTerm(patient.name);
    setSearchResults([]);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            placeholder="Cari pasien (min. 3 karakter)..."
            className="w-full px-4 py-2 pr-10 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={searchInput.length < 3}
          className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <FaSearch />
          Cari
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {searchResults.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-sm text-gray-600">
                NIK: {patient.nik} | No. RM: {patient.mrNumber}
              </div>
              {patient.insurance && (
                <div className="text-sm text-gray-600">
                  Asuransi: {patient.insurance.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-white border rounded-lg text-center">
          Mencari...
        </div>
      )}

      {searchTerm && searchResults.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-white border rounded-lg text-center text-gray-500">
          Tidak ada pasien ditemukan untuk "{searchTerm}"
        </div>
      )}
    </div>
  );
}
