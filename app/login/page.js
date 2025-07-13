"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/Providers";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [debugInfo, setDebugInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log("Login attempt with:", { email: formData.email });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // Important for cookies
      });

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setDebugInfo({
          error: "Invalid JSON response",
          raw: responseText,
        });
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok) {
        setDebugInfo({
          status: response.status,
          data: data,
        });
        throw new Error(data.message || "Login failed");
      }

      if (!data.success) {
        setDebugInfo({
          status: response.status,
          data: data,
          note: "Response was OK but success flag is false",
        });
        throw new Error(data.message || "Login response indicates failure");
      }

      console.log("Login successful, fetching user data");

      // Fetch user data from /api/auth/me
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include", // Important for cookies
      });

      if (!userResponse.ok) {
        const userErrorText = await userResponse.text();
        console.error("Failed to get user data:", userErrorText);
        setDebugInfo({
          status: userResponse.status,
          error: "Failed to get user data",
          raw: userErrorText,
        });
        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();
      console.log("User data received:", userData);

      // Improved validation with more specific error messages
      if (!userData) {
        setDebugInfo({
          error: "User data is null",
          data: userData,
        });
        throw new Error("No user data received from server");
      }

      if (!userData.id) {
        setDebugInfo({
          error: "User ID is missing",
          data: userData,
        });
        throw new Error("User ID is missing from server response");
      }

      if (!userData.name) {
        setDebugInfo({
          error: "User name is missing",
          data: userData,
        });
        throw new Error("User name is missing from server response");
      }

      if (!userData.email) {
        setDebugInfo({
          error: "User email is missing",
          data: userData,
        });
        throw new Error("User email is missing from server response");
      }

      setUser(userData);
      toast.success("Login berhasil");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error, debugInfo);
      toast.error(error.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = () => {
    setFormData({
      email: "admin@phc.com",
      password: "admin123",
    });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#FAFAFA]">
      <div className="relative z-10 bg-[#FAFAFA] p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          Doctor PHC <br /> Medical Record
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E22345] text-white py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        {/* Debug admin login button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loginAsAdmin}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Fill Admin Credentials
          </button>
        </div>

        {/* Debug information */}
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold text-red-600 mb-2">Debug Information:</h3>
            <pre className="text-black whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
