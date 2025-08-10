import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "PHC Dashboard - Modern Healthcare Management",
  description: "Modern healthcare management dashboard for PHC with real-time patient tracking, doctor management, and comprehensive reporting.",
  keywords: "healthcare, dashboard, PHC, patient management, doctor management",
  authors: [{ name: "PHC Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const themeColor = "#3b82f6";

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="preload" href="/phc-logo.png" as="image" type="image/png" />
        <link rel="preload" href="/phc-logo-1.png" as="image" type="image/png" />
        <link rel="preload" href="/login-bg.jpg" as="image" type="image/jpeg" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
