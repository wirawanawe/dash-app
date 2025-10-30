import { NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Ambil token dari cookie menggunakan get() method
    const apiToken = request.cookies.get("api_token");
    const token = request.cookies.get("token");

    if (!token && !apiToken) {
      return NextResponse.json(null, { status: 200 });
    }

    // Prioritas: gunakan token internal terlebih dahulu karena lebih cepat
    if (token) {
      try {
        // Gunakan verifyJwtToken untuk memastikan token valid
        const payload = await verifyJwtToken(token.value);

        if (payload) {
          const user = {
            id: payload.id || payload.sub || payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role || "USER",
            clinic_id: payload.clinic_id || null,
          };

          // Validasi data user - pastikan memiliki id dan name
          if (user.id && user.name && user.email) {
            return NextResponse.json(user);
          } else {

          }
        }
      } catch (error) {

      }
    }

    // Fallback: Coba dapatkan data dari API eksternal jika token internal gagal
    if (apiToken) {
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

        if (apiResponse.ok) {
          const userData = await apiResponse.json();

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
            return NextResponse.json(user);
          } else {

          }
        } else {

        }
      } catch (error) {
        // Jika timeout atau error lainnya, lanjutkan ke fallback
        if (error.name !== "AbortError") {

        }
      }
    }

    // If we reach here, all methods failed
    return NextResponse.json(null, { status: 200 });
  } catch (error) {

    return NextResponse.json(null, { status: 200 });
  }
}
