"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/components/Providers";
import { syncOnLogin } from "@/utils/syncUtils";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight
} from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const expired = searchParams?.get("expired");
    if (expired === "1") {
      toast.error("Waktu login sudah habis. Silakan login kembali.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.success) {
        throw new Error(data.message || "Login response indicates failure");
      }

      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!userResponse.ok) {
        await userResponse.text();
        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();

      if (!userData || !userData.id || !userData.name || !userData.email) {
        throw new Error("Invalid user data from server");
      }

      setUser(userData);
      toast.success("Login berhasil! Selamat datang di PHC Dashboard");
      
      // Trigger sync after successful login
      syncOnLogin();
      
      // Wait a bit to ensure cookie is set before redirecting
      // This prevents redirect loop due to cookie timing issues
      setTimeout(() => {
        router.push("/dashboard");
      }, 300);
    } catch (error) {
      toast.error(error.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoLoad = () => {
    setLogoLoaded(true);
  };

  const handleLogoError = () => {
    setLogoLoaded(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/login-bg.jpg"
          alt="PHC Login Background"
          className="w-full h-full object-cover"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md">
          <div 
            className={`bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <div 
              className={`flex justify-center mb-6 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src="/phc-logo.png"
                alt="PHC Logo"
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] object-contain drop-shadow-lg"
                onLoad={handleLogoLoad}
                onError={(e) => {
                  console.log('Logo failed to load, trying alternate...');
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = '/icon-phc.png'; // Fallback to icon-phc.png
                  handleLogoError();
                }}
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang</h2>
              <p className="text-gray-600">Masuk ke akun PHC Anda</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors" />
                  <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 font-medium">Remember me</label>
                </div>
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</Link>
                </div>
              </div>

              <div className="space-y-4">
                <button type="submit" disabled={isLoading} className="group w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner h-5 w-5 mr-2"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className={`text-center mt-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
            <div className="text-sm text-white drop-shadow-sm">© 2025 PHC Medical Record System. Semua hak dilindungi.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


