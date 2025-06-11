import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Ambil token dari cookie
    const apiToken = request.cookies.get("api_token");
    const token = request.cookies.get("token");

    if (!token && !apiToken) {
      // console.log("No tokens found in cookies");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Coba dapatkan data dari API eksternal jika ada token
    if (apiToken) {
      try {
        // Request ke API eksternal dengan token
        const apiResponse = await fetch(
          "https://api1-dev.doctorphc.id/laboratorium/me",
          {
            headers: {
              Authorization: `Bearer ${apiToken.value}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!apiResponse.ok) {
          // console.error("API Error:", await apiResponse.text());
          // Continue to fallback if external API fails
        } else {
          const userData = await apiResponse.json();
          // console.log("External API Response:", userData);

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

          // console.log("Transformed user data:", user);

          // Validasi data user
          if (user.id && user.name !== "Unknown") {
            return NextResponse.json(user);
          }
        }
      } catch (error) {
        // console.error("Error fetching from external API:", error);
        // Continue to fallback if external API fails
      }
    }

    // Fallback: Gunakan token internal jika ada
    if (token) {
      try {
        // Decode token (simplified - in production you'd verify the JWT)
        const [header, payload, signature] = token.value.split(".");
        if (payload) {
          const decodedData = JSON.parse(atob(payload));
          // console.log("Decoded token payload:", decodedData);

          return NextResponse.json({
            id: decodedData.id || decodedData.sub,
            name: decodedData.name,
            email: decodedData.email,
            role: decodedData.role || "USER",
          });
        }
      } catch (error) {
        // console.error("Error decoding token:", error);
      }
    }

    // If we reach here, all methods failed
    // console.log("All authentication methods failed");
    return NextResponse.json(null);
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
