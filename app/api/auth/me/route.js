import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("GET /api/auth/me called");

    // Get request headers for debugging
    const userAgent = request.headers.get("user-agent");
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    console.log("Request details:", {
      userAgent: userAgent?.substring(0, 50),
      origin,
      referer,
      host,
    });

    // Ambil token dari cookie menggunakan get() method
    const apiToken = request.cookies.get("api_token");
    const token = request.cookies.get("token");

    // Get all cookies for debugging using getAll() method
    const allCookies = {};
    const cookieArray = request.cookies.getAll();
    cookieArray.forEach((cookie) => {
      allCookies[cookie.name] = cookie.value.substring(0, 20) + "...";
    });

    console.log("All cookies received:", allCookies);
    console.log("Cookies found:", {
      token: !!token,
      apiToken: !!apiToken,
      tokenValue: token ? token.value.substring(0, 20) + "..." : "none",
    });

    if (!token && !apiToken) {
      console.log("No tokens found, returning null");
      return NextResponse.json(null, { status: 200 });
    }

    // Prioritas: gunakan token internal terlebih dahulu karena lebih cepat
    if (token) {
      console.log("Verifying internal token");
      try {
        // Gunakan verifyJwtToken untuk memastikan token valid
        const payload = await verifyJwtToken(token.value);
        console.log("Token verification result:", !!payload);

        if (payload) {
          console.log("Token payload:", {
            id: payload.id || payload.sub || payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            clinic_id: payload.clinic_id,
            exp: payload.exp,
            iat: payload.iat,
          });

          const user = {
            id: payload.id || payload.sub || payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role || "USER",
            clinic_id: payload.clinic_id || null,
          };

          // Validasi data user - pastikan memiliki id dan name
          if (user.id && user.name && user.email) {
            console.log("User validation passed, returning user data");
            return NextResponse.json(user);
          } else {
            console.error("Invalid user data from token:", user);
            console.error("Missing fields:", {
              id: !user.id,
              name: !user.name,
              email: !user.email,
            });
          }
        } else {
          console.log("Token verification failed - payload is null");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }

    // Fallback: Coba dapatkan data dari API eksternal jika token internal gagal
    if (apiToken) {
      console.log("Attempting external API authentication");
      try {
        // Set timeout untuk external API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const apiResponse = await fetch(
          "https://api1-dev.doctorphc.id/laboratorium/me",
          {
            headers: {
              Authorization: `Bearer ${apiToken.value}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        console.log("External API response status:", apiResponse.status);

        if (apiResponse.ok) {
          const userData = await apiResponse.json();
          console.log("External API data received:", !!userData);

          // Transform data user
          const user = {
            id: userData.data?.ID || userData.ID,
            name: userData.data?.FullName || userData.FullName || "Unknown",
            email: userData.data?.email || userData.email,
            role:
              userData.data?.level?.LevelName ||
              userData.level?.LevelName ||
              "USER",
            clinic_id: null,
          };

          // Validasi data user - pastikan memiliki id dan name yang valid
          if (user.id && user.name && user.name !== "Unknown" && user.email) {
            console.log("External API user validation passed");
            return NextResponse.json(user);
          } else {
            console.error("Invalid user data from external API:", user);
          }
        } else {
          console.error("External API response not ok:", apiResponse.status);
        }
      } catch (error) {
        // Jika timeout atau error lainnya, lanjutkan ke fallback
        if (error.name === "AbortError") {
          console.log("External API call timed out");
        } else {
          console.error("Error fetching from external API:", error);
        }
      }
    }

    // If we reach here, all methods failed
    console.log("All authentication methods failed, returning null");
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
