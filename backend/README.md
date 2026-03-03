# SIKAPA Backend Server

A Node.js/Express backend server for the SIKAPA platform with Firebase Admin SDK integration. Handles admin operations, email notifications, automated tasks, and analytics.

## Features

✅ **Admin Operations**
- Approve/reject deposits
- Approve/reject withdrawals  
- User management
- Transaction approvals

✅ **Automated Tasks (Cron Jobs)**
- Daily reset (midnight) - Resets daily commission and tier claims
- Deposit processing (every 4 hours) - Monitors pending deposits
- Tier expiry check (every 12 hours) - Handles tier cooldown expirations

✅ **Email Notifications**
- Deposit approval/rejection emails
- Withdrawal approval emails
- Welcome emails with referral codes
- HTML formatted professional emails

✅ **Analytics & Reporting**
- Dashboard statistics
- Revenue analytics
- User growth tracking
- Financial metrics

## Project Structure

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env.example        # Environment template
├── routes/
│   ├── admin.js        # Admin operations
│   ├── deposits.js     # Deposit analytics
│   ├── withdrawals.js  # Withdrawal analytics
│   ├── users.js        # User management
│   ├── analytics.js    # Dashboard analytics
│   ├── tasks.js        # Automated tasks
│   └── email.js        # Email notifications
└── README.md           # This file
```

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:

```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=sikapa-99bbd
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
# ... other Firebase config values

PORT=5000
NODE_ENV=development

# Email configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. For Email Notifications (Optional)

If using Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in `.env` as `EMAIL_PASSWORD`

## Running the Server

### Development Mode (with auto-reload)

```bash
npm install -g nodemon
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if server is running

### Admin Operations
- **GET** `/api/admin/list?status=all|pending|approved` - List deposits
- **POST** `/api/admin/approve/:depositId` - Approve deposit
- **POST** `/api/admin/reject/:depositId` - Reject deposit

### Deposits Analytics
- **GET** `/api/deposits/stats` - Deposit statistics
- **GET** `/api/deposits/user/:uid` - User deposit history
- **GET** `/api/deposits/pending/count` - Pending deposits count

### Withdrawals Analytics
- **GET** `/api/withdrawals/stats` - Withdrawal statistics
- **GET** `/api/withdrawals/user/:uid` - User withdrawal history
- **GET** `/api/withdrawals/pending/count` - Pending withdrawals count

### Users Management
- **GET** `/api/users/list` - All users
- **GET** `/api/users/:uid` - User details
- **GET** `/api/users/:uid/stats` - User statistics
- **GET** `/api/users/search/:query` - Search users

### Analytics
- **GET** `/api/analytics/dashboard` - Dashboard statistics
- **GET** `/api/analytics/revenue` - Revenue analytics
- **GET** `/api/analytics/growth` - User growth metrics

### Tasks (Automated)
- **GET** `/api/tasks/status` - View scheduled tasks
- **POST** `/api/tasks/run-daily-reset` - Manually trigger daily reset (admin token required)

### Email Notifications
- **POST** `/api/email/deposit-approved` - Send deposit approval email
- **POST** `/api/email/deposit-rejected` - Send deposit rejection email
- **POST** `/api/email/withdrawal-approved` - Send withdrawal approval email
- **POST** `/api/email/welcome` - Send welcome email

## Example API Calls

### Check Server Health
```bash
curl http://localhost:5000/api/health
```

### Get Dashboard Analytics
```bash
curl http://localhost:5000/api/analytics/dashboard
```

### Get All Users
```bash
curl http://localhost:5000/api/users/list
```

### Send Deposit Approval Email
```bash
curl -X POST http://localhost:5000/api/email/deposit-approved \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "amount": 100,
    "depositId": "deposit123"
  }'
```

### Get Revenue Analytics
```bash
curl http://localhost:5000/api/analytics/revenue
```

## Automated Tasks (Cron Jobs)

### Daily Reset (00:00 - Midnight)
Automatically resets for each user:
- `commissionToday: 0`
- `tierClaimedToday: 0`
- `todayEarning: 0`

### Deposit Processing (Every 4 hours)
Monitors pending deposits and sends alerts if:
- Deposit pending for more than 24 hours
- Can trigger admin notifications

### Tier Expiry Check (Every 12 hours)
Processes tier claim cooldowns:
- Checks if 24 hours have passed since last tier claim
- Marks tiers as available again

## Security Considerations

1. **Firebase Admin SDK** - Keep private key secure, never commit to git
2. **Environment Variables** - Use `.env` file, never expose in code
3. **API Authentication** - Add token verification for sensitive endpoints
4. **Rate Limiting** - Consider adding rate limiting for production
5. **CORS** - Currently allows all origins, restrict in production

## Connecting to Frontend

Update your frontend `firebase-config.js` to reference the backend:

```javascript
// Optional: Point to backend for admin operations
const BACKEND_URL = 'http://localhost:5000';

// Use in your frontend when calling admin endpoints
async function approveBankDeposit(depositId, token) {
    const response = await fetch(`${BACKEND_URL}/api/admin/approve/${depositId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}
```

## Troubleshooting

### Firebase Connection Error
- Verify all Firebase config values in `.env`
- Check Firebase project is active
- Ensure Realtime Database is created

### Email Not Sending
- Verify email service is configured
- Check EMAIL_USER and EMAIL_PASSWORD
- Ensure Gmail app password is correct (not regular password)
- Check email service is enabled

### Tasks Not Running
- Verify Node.js process is running
- Check `node-cron` is installed
- Monitor server logs for errors

### CORS Issues
- Update CORS origin in frontend API calls
- Ensure backend is running when frontend makes requests

## Production Deployment

For production deployment:

1. **Set NODE_ENV to production**
   ```bash
   export NODE_ENV=production
   ```

2. **Use a process manager** (PM2, Forever, etc.)
   ```bash
   npm install -g pm2
   pm2 start server.js -i max
   ```

3. **Use HTTPS** with a reverse proxy (Nginx, Apache)

4. **Restrict CORS** to your domain
   ```javascript
   const cors = require('cors');
   app.use(cors({
       origin: 'https://yourdomain.com'
   }));
   ```

5. **Add rate limiting**
   ```bash
   npm install express-rate-limit
   ```

6. **Use environment-specific configs**

## Dependencies

- **express** - Web framework
- **firebase-admin** - Firebase Admin SDK
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **nodemailer** - Email sending
- **node-cron** - Task scheduling
- **axios** - HTTP client

## Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Verify all environment variables in `.env`
3. Test with curl commands
4. Check Firebase console for data

## License

MIT

---

**Version**: 1.0.0
**Last Updated**: March 2, 2026
