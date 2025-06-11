"use client";

import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar />
        <main className="flex-1 p-6 mt-16 pb-24 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
