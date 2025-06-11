"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/Providers";

// Helper function to get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [debugInfo, setDebugInfo] = useState(null);

  // Check if token exists on page load
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      console.log(
        "Token found in cookies on page load, redirecting to dashboard"
      );
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log("Login attempt with:", { email: formData.email });

      if (
        formData.email === "admin@phc.com" &&
        formData.password === "admin123"
      ) {
        console.log("Using hardcoded admin credentials");
      }

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

      console.log("Login successful, checking cookies");

      // Check if token cookie was properly set
      const token = getCookie("token");
      console.log(
        "Token cookie after login:",
        token ? "Found" : "Not found",
        token ? token.substring(0, 20) + "..." : ""
      );

      if (!token) {
        console.log("Token cookie not found, setting it manually");
        // Get token from cookies in response headers
        const setCookieHeader = response.headers?.get("set-cookie");
        if (setCookieHeader) {
          console.log("Set-Cookie header found in response");
          const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
          if (tokenMatch && tokenMatch[1]) {
            console.log("Token extracted from header, setting manually");
            document.cookie = `token=${tokenMatch[1]}; path=/; max-age=86400`;
          }
        }
      }

      console.log("Fetching user data");
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include", // Important for cookies
      });

      if (!userResponse.ok) {
        const userErrorText = await userResponse.text();
        setDebugInfo({
          status: userResponse.status,
          error: "Failed to get user data",
          raw: userErrorText,
        });

        // Try fetching with direct Authorization header as fallback
        const token = getCookie("token");
        if (token) {
          console.log("Trying with explicit Authorization header");
          const authResponse = await fetch("/api/auth/me", {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!authResponse.ok) {
            throw new Error("Failed to get user data with fallback method");
          }

          const authUserData = await authResponse.json();
          if (!authUserData || !authUserData.id) {
            throw new Error("Invalid user data received from fallback");
          }

          setUser(authUserData);
          toast.success("Login berhasil");
          router.push("/dashboard");
          return;
        }

        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();
      console.log("User data received:", userData);

      if (!userData || !userData.id) {
        setDebugInfo({
          error: "User data is invalid",
          data: userData,
        });
        throw new Error("Invalid user data received");
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

  // Direct admin login function
  const directAdminLogin = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      // Create a token manually
      const token =
        "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhZG1pbi0wMDEiLCJpZCI6ImFkbWluLTAwMSIsIm5hbWUiOiJBZG1pbmlzdHJhdG9yIiwiZW1haWwiOiJhZG1pbkBwaGMuY29tIiwicm9sZSI6IkFETUlOIiwiY2xpbmljSWQiOm51bGwsImlhdCI6MTc0NjUxNzI0MiwiZXhwIjoxNzQ2NjAzNjQyfQ.XKIYI-CNPxYsrmQpk_8TB32YnCLbzfgS_8xcwgPHcSs";
      document.cookie = `token=${token}; path=/; max-age=86400`;

      // Setup user data
      const adminUser = {
        id: "admin-001",
        name: "Administrator",
        email: "admin@phc.com",
        role: "ADMIN",
        clinicId: null,
      };

      setUser(adminUser);
      toast.success("Login berhasil (direct method)");
      router.push("/dashboard");
    } catch (error) {
      console.error("Direct login error:", error);
      toast.error(error.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
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

          <div className="mt-4 text-center flex justify-between">
            <button
              type="button"
              onClick={loginAsAdmin}
              className="text-sm text-gray-500 hover:text-[#E22345]"
            >
              Use admin account
            </button>
            <button
              type="button"
              onClick={directAdminLogin}
              className="text-sm text-gray-500 hover:text-[#E22345]"
            >
              Direct admin login
            </button>
          </div>
        </form>

        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
