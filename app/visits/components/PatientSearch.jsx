"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export default function PatientSearch({ onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

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

  return (
    <div className="relative">
      <div className="flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari pasien (min. 3 karakter)..."
            className="w-full px-4 py-2 pr-10 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {searchResults.map((patient) => (
            <div
              key={patient.id}
              onClick={() => {
                onSelect(patient);
                setSearchTerm(patient.name);
                setSearchResults([]);
              }}
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
    </div>
  );
}
