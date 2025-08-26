# Email Configuration untuk Reset Password

## Overview

Fitur reset password menggunakan sistem email untuk mengirim kode OTP atau link reset. Berikut adalah panduan konfigurasi email.

## Environment Variables

Tambahkan variabel berikut ke file `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@phc.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Konfigurasi Gmail

### 1. Aktifkan 2-Factor Authentication
- Buka Google Account Settings
- Aktifkan 2-Step Verification

### 2. Generate App Password
- Buka Security Settings
- Pilih "App passwords"
- Generate password untuk aplikasi
- Gunakan password ini sebagai `SMTP_PASS`

### 3. Konfigurasi SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your_email@gmail.com",
    pass: "your_app_password",
  },
});
```

## Provider Email Lainnya

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_mailgun_username
SMTP_PASS=your_mailgun_password
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_access_key
SMTP_PASS=your_ses_secret_key
```

## Testing Email

Untuk testing tanpa mengirim email nyata, gunakan Mailtrap:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
```

## Troubleshooting

### Error: Authentication failed
- Pastikan 2FA aktif di Gmail
- Gunakan App Password, bukan password biasa
- Periksa username dan password

### Error: Connection timeout
- Periksa firewall settings
- Pastikan port 587 tidak diblokir
- Coba gunakan port 465 dengan SSL

### Error: Invalid sender
- Pastikan `SMTP_FROM` sesuai dengan email yang dikonfigurasi
- Untuk Gmail, gunakan email yang sama dengan `SMTP_USER`
