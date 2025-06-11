import fetch from "node-fetch";

// Test admin login directly against the API
async function testAdminLogin() {
  try {
    console.log("Testing admin login...");

    // Make a login request to the API
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@phc.com",
        password: "admin123",
      }),
    });

    console.log("Response status:", response.status);

    // Get cookies from response
    const cookies = response.headers.get("set-cookie");
    console.log("Set-Cookie headers:", cookies);

    // Parse response
    const responseText = await response.text();
    console.log("Response text:", responseText);

    try {
      const data = JSON.parse(responseText);
      console.log("Response data:", data);

      if (data.success) {
        console.log("Login successful!");

        // Get token from cookies
        const tokenMatch = cookies?.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (token) {
          console.log(
            "Token extracted from cookies:",
            token.substring(0, 20) + "..."
          );

          // Try to get user data with the token
          console.log("\nFetching user data with token...");
          const userResponse = await fetch(
            "http://localhost:3000/api/auth/me",
            {
              headers: {
                Cookie: `token=${token}`,
              },
            }
          );

          console.log("User data response status:", userResponse.status);
          const userData = await userResponse.text();
          console.log("User data response:", userData);
        } else {
          console.log("No token found in cookies");
        }
      } else {
        console.log("Login failed:", data.message);
      }
    } catch (parseError) {
      console.error("Error parsing response JSON:", parseError);
    }
  } catch (error) {
    console.error("Error testing admin login:", error);
  }
}

// Run the test
testAdminLogin();
