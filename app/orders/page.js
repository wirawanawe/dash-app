"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD001",
      customer: "John Doe",
      date: "2024-02-20",
      status: "Pending",
      total: 299.99,
    },
    {
      id: "ORD002",
      customer: "Jane Smith",
      date: "2024-02-19",
      status: "Completed",
      total: 199.99,
    },
    {
      id: "ORD003",
      customer: "Bob Johnson",
      date: "2024-02-18",
      status: "Processing",
      total: 499.99,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-blue-100 text-[#2563EB]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Orders Management</h1>
          <div className="flex space-x-2">
            <select className="border rounded-lg px-4 py-2 text-black">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="date"
              className="border rounded-lg px-4 py-2 text-black"
              placeholder="Filter by date"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-black">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-black">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-black">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-black">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-[#33eb6a] hover:text-red-700 mr-3">
                      View
                    </button>
                    <button className="text-[#E22345] hover:text-red-700">
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
