import express from 'express';
import cors from 'cors';
import { query } from './lib/db.js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Mobile login endpoint
app.post('/api/mobile/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    // Hardcoded test user for mobile app testing (fallback)
    if (email === "test@mobile.com" && password === "password123") {
      // Try to get the user from database first with health data
      try {
        const [user] = await query(
          `SELECT mu.id, mu.name, mu.email, mu.phone, mu.date_of_birth, mu.gender, 
                  mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
                  MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
                  MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
           FROM mobile_users mu
           LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
           WHERE mu.email = ?
           GROUP BY mu.id`,
          [email]
        );
        
        if (user) {
          // Create a JWT token with database user ID
          const token = await new SignJWT({
            userId: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: "MOBILE_USER",
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d") // Longer expiration for mobile
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));

          // Create refresh token
          const refreshToken = await new SignJWT({
            userId: user.id,
            type: "refresh",
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("30d")
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));

          return res.json({
            success: true,
            message: "Login berhasil",
            data: {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                ktp_number: user.ktp_number,
                address: user.address,
                insurance: user.insurance,
                insurance_card_number: user.insurance_card_number,
                role: "MOBILE_USER",
              },
              accessToken: token,
              refreshToken: refreshToken,
            },
          });
        }
      } catch (dbError) {
        console.error("Database error during test user login:", dbError);
      }
    }

    // Try database authentication for mobile users
    try {
      // Cari user di database mobile_users with health data
      let sql = `
        SELECT mu.id, mu.name, mu.email, mu.password, mu.phone, mu.date_of_birth, mu.gender, 
               mu.is_active, mu.ktp_number, mu.address, mu.insurance, mu.insurance_card_number,
               MAX(CASE WHEN hd.data_type = 'height' THEN hd.value END) as height,
               MAX(CASE WHEN hd.data_type = 'weight' THEN hd.value END) as weight
        FROM mobile_users mu
        LEFT JOIN health_data hd ON mu.id = hd.user_id AND hd.data_type IN ('height', 'weight')
        WHERE mu.email = ?
        GROUP BY mu.id
      `;
      let [user] = await query(sql, [email]);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email atau password salah",
        });
      }

      // Cek apakah user aktif
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Akun anda tidak aktif. Silahkan hubungi administrator.",
        });
      }

      // Verifikasi password menggunakan bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email atau password salah",
        });
      }

      // Create a JWT token
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "MOBILE_USER",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d") // Longer expiration for mobile
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Create refresh token
      const refreshToken = await new SignJWT({
        userId: user.id,
        type: "refresh",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Format response user
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        ktp_number: user.ktp_number,
        address: user.address,
        insurance: user.insurance,
        insurance_card_number: user.insurance_card_number,
        role: "MOBILE_USER",
      };

      return res.json({
        success: true,
        message: "Login berhasil",
        data: {
          user: userData,
          accessToken: token,
          refreshToken: refreshToken,
        },
      });
    } catch (dbError) {
      console.error("Database error during mobile login:", dbError);

      return res.status(500).json({
        success: false,
        message: "Database error: " + (dbError.message || "Unknown error"),
      });
    }
  } catch (error) {
    console.error("Mobile login error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on https://dash.doctorphc.id:${PORT}`);
  console.log(`🔐 Login endpoint: https://dash.doctorphc.id:${PORT}/api/mobile/auth/login`);
  console.log(`🏥 Health check: https://dash.doctorphc.id:${PORT}/health`);
});
