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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // Important for cookies
      });

      const responseText = await response.text();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/phc-logo.png"
            alt="PHC Logo"
            width={120}
            height={120}
            className="mx-auto h-16 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Masuk ke akun Anda
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Silakan masukkan kredensial Anda untuk melanjutkan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="appearance-none block w-full px-3 text-black py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#E22345] focus:border-[#E22345] sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="appearance-none block w-full px-3 text-black py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#E22345] focus:border-[#E22345] sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#E22345] focus:ring-[#E22345] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#E22345] hover:text-red-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#E22345] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E22345] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Debug Info Display */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Debug Information:
              </h3>
              <pre className="text-xs text-yellow-700 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
