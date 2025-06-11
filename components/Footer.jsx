"use client";

import React, { useState, useEffect } from "react";

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

  return (
    <footer className="bg-[#E22345] shadow-md mt-auto fixed bottom-0 right-0 w-[calc(100%-16rem)] h-16 z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 h-full flex justify-between items-center">
        <div className="text-white">
          © 2025 Your Company. All rights reserved.
        </div>
        <div className="text-white font-medium">{formatTime(currentTime)}</div>
      </div>
    </footer>
  );
};

export default Footer;
