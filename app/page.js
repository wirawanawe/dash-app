'use client';

import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  Activity, 
  ArrowRight, 
  Shield, 
  Clock, 
  Star,
  Heart,
  BarChart3,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Manajemen Pasien',
      description: 'Kelola data pasien dengan sistem yang terintegrasi dan aman',
      gradient: 'from-blue-500 to-cyan-500',
      delay: '0ms'
    },
    {
      icon: Calendar,
      title: 'Jadwal Kunjungan',
      description: 'Atur jadwal kunjungan dan antrian pasien dengan mudah',
      gradient: 'from-green-500 to-emerald-500',
      delay: '200ms'
    },
    {
      icon: Activity,
      title: 'Monitoring Real-time',
      description: 'Pantau aktivitas klinik dan status pasien secara real-time',
      gradient: 'from-purple-500 to-pink-500',
      delay: '400ms'
    },
    {
      icon: Shield,
      title: 'Keamanan Data',
      description: 'Data medis terlindungi dengan enkripsi tingkat enterprise',
      gradient: 'from-orange-500 to-red-500',
      delay: '600ms'
    }
  ];

  const stats = [
    { label: 'Pasien Terdaftar', value: '10,000+', icon: Users },
    { label: 'Kunjungan/Bulan', value: '2,500+', icon: Calendar },
    { label: 'Uptime System', value: '99.9%', icon: Activity },
    { label: 'Rating Kepuasan', value: '4.9/5', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400/30 to-blue-400/30 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header/Navigation */}
        <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/icon-phc.png" alt="PHC Logo" width={45} height={45} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PHC Dashboard</h1>
                <p className="text-sm text-gray-600">Medical Record System</p>
              </div>
            </div>
            <Link
              href="/login"
              className="hidden md:flex items-center px-6 py-3 bg-[#E22345] text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span className="font-medium">Login</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div 
              className={`inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-8 border border-white/30 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
            >
              <Zap className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-black">Sistem Informasi Kesehatan Modern</span>
            </div>

            <h1 
              className={`text-5xl lg:text-7xl font-bold mb-8 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '200ms' }}
            >
              <span className="bg-gradient-to-r from-[#E22345] via-[#E22345] to-[#E22345] bg-clip-text text-transparent">
                PHC Medical
              </span>
              <br />
              <span className="text-gray-900">Record Dashboard</span>
            </h1>

            <p 
              className={`text-xl lg:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '400ms' }}
            >
              Kelola rekam medis, jadwal kunjungan, dan data pasien dengan sistem yang 
              <span className="text-gradient font-semibold"> aman, modern, dan terintegrasi</span>
            </p>

            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '600ms' }}
            >
              <Link
                href="/login"
                className="group flex items-center px-8 py-4 bg-[#E22345] text-white rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center px-8 py-4 bg-white/30 backdrop-blur-sm text-gray-700 rounded-2xl border border-white/30 shadow-lg font-semibold text-lg">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                <span>Untuk Kesehatan yang Lebih Baik</span>
              </div>
            </div>

            {/* Stats */}
            <div 
              className={`grid grid-cols-2 lg:grid-cols-4 gap-8 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '800ms' }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <stat.icon className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="text-gray-600 text-lg leading-relaxed">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Fitur <span className="text-gradient">Unggulan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistem yang dirancang khusus untuk memenuhi kebutuhan fasilitas kesehatan modern
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                  isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: feature.delay }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl" 
                     style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-semibold mt-6 group-hover:text-blue-700">
                    <span>Pelajari lebih lanjut</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="relative bg-[#E22345] rounded-3xl p-12 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-white">
              <BarChart3 className="w-16 h-16 mx-auto mb-8 text-white/90" />
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Siap untuk Memulai?
              </h2>
              <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Bergabunglah dengan ribuan fasilitas kesehatan yang telah mempercayai sistem kami
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group flex items-center px-8 py-4 bg-white text-blue-600 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 font-bold text-lg"
                >
                  <span>Login ke Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl border border-white/30 font-semibold text-lg">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Image src="/icon-phc.png" alt="PHC Logo" width={45} height={45} />
            <span className="text-xl font-bold text-gray-900">PHC Dashboard</span>
          </div>
          <p className="text-gray-600">
            © 2025 PHC Medical Record System. Dibuat dengan ❤️ untuk kesehatan yang lebih baik.
          </p>
        </footer>
      </div>
    </div>
  );
}
