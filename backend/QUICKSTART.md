# Backend Quick Start

Get the SIKAPA backend server running in 5 minutes!

## Prerequisites

- Node.js 14+ installed
- Your Firebase service account credentials (you have this!)
- Gmail account (optional, for email notifications)

## Quick Setup

### Step 1: Install Dependencies (1 minute)

```powershell
cd backend
npm install
```

This installs:
- Express (web server)
- Firebase Admin SDK (database access)
- Nodemailer (email sending)
- Node-cron (automated tasks)

### Step 2: Create `.env` File (1 minute)

Copy the example file:

```powershell
cp .env.example .env
```

Edit `.env` and paste your Firebase credentials:

```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=sikapa-99bbd
FIREBASE_PRIVATE_KEY_ID=0a1da72bf3cc51228a8c7bb2945c55e403e58d80
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...YOUR_KEY...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sikapa-99bbd.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=112307212202734047527
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs

PORT=5000
NODE_ENV=development
```

### Step 3: Run the Server (30 seconds)

```powershell
npm run dev
```

You should see:

```
╔════════════════════════════════════════╗
║   💎 SIKAPA Backend Server Started     ║
╚════════════════════════════════════════╝

🚀 Server running on: http://localhost:5000
📝 Environment: development
🔥 Firebase Project: sikapa-99bbd

Available endpoints:
- GET  /api/health
- POST /api/admin/approve-deposit
- POST /api/admin/reject-deposit
- GET  /api/analytics/dashboard
- GET  /api/users/list
- POST /api/email/send
```

## Test It Works

### 1. Check Health

```powershell
curl http://localhost:5000/api/health
```

Response:
```json
{"status":"Backend server is running","timestamp":"2026-03-02T..."}
```

### 2. Get All Users

```powershell
curl http://localhost:5000/api/users/list
```

Response:
```json
{"success":true,"count":2,"data":[...users...]}
```

### 3. Get Dashboard Analytics

```powershell
curl http://localhost:5000/api/analytics/dashboard
```

Response:
```json
{"success":true,"dashboard":{...statistics...}}
```

## What's Working

✅ **Admin Operations**
- Approve deposits
- Reject deposits
- View all deposits/withdrawals

✅ **User Management**
- List all users
- Get user details
- Search users
- User statistics

✅ **Analytics**
- Dashboard stats
- Revenue analytics
- User growth

✅ **Automated Tasks** (Running in background)
- Daily reset (midnight)
- Deposit processing (every 4 hours)
- Tier expiry check (every 12 hours)

✅ **Email Notifications** (Optional)
- Deposit approval emails
- Withdrawal emails
- Welcome emails

## Optional: Enable Email Notifications

### Using Gmail:

1. Enable 2FA on Gmail
2. Get App Password: https://support.google.com/accounts/answer/185833
3. Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@sikapa.com
```

4. Test sending an email:

```powershell
curl -X POST http://localhost:5000/api/email/welcome ^
  -H "Content-Type: application/json" ^
  -d "{\"userEmail\":\"test@example.com\",\"userName\":\"John\",\"referralCode\":\"SKP123\"}"
```

## Useful Commands

### Start in Development (Auto-reload)
```powershell
npm run dev
```

### Start in Production
```powershell
npm start
```

### Install a package
```powershell
npm install package-name
```

## Common Issues

### "Cannot find module 'express'"
```powershell
npm install
```

### "ENOENT: no such file or directory, open '.env'"
Create `.env` file from `.env.example`

### Firebase authentication error
- Verify all Firebase config in `.env`
- Check private key has proper `\n` newlines
- Ensure Firebase URL is correct

### Email not sending
- Verify Gmail app password (not regular password)
- Enable 2FA on Gmail
- Check email service is configured in `.env`

## Next Steps

1. **Frontend Integration**: Update frontend to call backend endpoints
2. **Email Notifications**: Configure Gmail for email alerts
3. **Production Deploy**: Use PM2 or similar for 24/7 uptime
4. **API Documentation**: Full docs in `README.md`

## Keep Both Servers Running

You now have TWO servers:

**Frontend Server** (Port 8000):
```powershell
# In SIKAPA root folder
python -m http.server 8000
```

**Backend Server** (Port 5000):
```powershell
# In backend folder
npm run dev
```

Both run independently. Frontend works standalone, backend adds admin features!

## Architecture

```
Frontend (http://localhost:8000)
    ↓
Firebase SDK (direct)
    ↓
Firebase Realtime Database

Frontend (Admin Operations)
    ↓
Backend Server (http://localhost:5000)
    ↓
Firebase Admin SDK (server-side)
    ↓
Firebase Realtime Database
```

## You're Ready! 🚀

Your backend is now running with:
- ✅ Real-time database access
- ✅ Admin API endpoints
- ✅ Automated tasks
- ✅ Email notifications
- ✅ Analytics & reporting

Open http://localhost:5000/api/health to confirm!

Need help? Check `README.md` for detailed documentation.
