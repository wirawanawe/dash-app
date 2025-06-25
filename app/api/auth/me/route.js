import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Ambil token dari cookie
    const apiToken = request.cookies.get("api_token");
    const token = request.cookies.get("token");

    if (!token && !apiToken) {
      return NextResponse.json(null, { status: 200 });
    }

    // Prioritas: gunakan token internal terlebih dahulu karena lebih cepat
    if (token) {
      try {
        // Decode token (simplified - in production you'd verify the JWT)
        const [header, payload, signature] = token.value.split(".");
        if (payload) {
          const decodedData = JSON.parse(atob(payload));

          const user = {
            id: decodedData.id || decodedData.sub || decodedData.userId,
            name: decodedData.name,
            email: decodedData.email,
            role: decodedData.role || "USER",
          };

          // Validasi data user
          if (user.id && user.name) {
            return NextResponse.json(user);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
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
          };

          // Validasi data user
          if (user.id && user.name !== "Unknown") {
            return NextResponse.json(user);
          }
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
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
