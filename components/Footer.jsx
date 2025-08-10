"use client";

import React, { useState, useEffect } from "react";
import { FaClock, FaHeart } from "react-icons/fa";

const Footer = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 shadow-lg mt-auto fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] h-12 lg:h-16 z-10">
      <div className="max-w-7xl mx-auto py-2 lg:py-4 px-4 lg:px-6 h-full flex flex-col lg:flex-row justify-between items-center">
        <div className="text-gray-600 text-xs lg:text-sm flex items-center">
          <span className="hidden lg:inline">
            © 2025 PHC Healthcare. Made with{" "}
            <FaHeart className="inline text-red-500 mx-1" />
            for better healthcare.
          </span>
          <span className="lg:hidden">
            © 2025 PHC Healthcare
          </span>
        </div>
        <div className="text-gray-700 font-medium text-xs lg:text-sm flex items-center">
          <FaClock className="mr-1 text-blue-600" />
          <span className="hidden lg:inline">
            {formatDate(currentTime)} - {formatTime(currentTime)}
          </span>
          <span className="lg:hidden">{formatTime(currentTime)}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
