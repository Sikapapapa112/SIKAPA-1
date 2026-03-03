# 💎 SIKAPA - Earn Rewards Platform

A comprehensive Firebase-based platform with authentication, dashboard, task/tier system, referral program, profile management, and admin portal.

## Features

### User Features
- **Authentication**: Secure login and signup with email and password
- **Dashboard**: View balance, recent transactions, and key statistics
- **Task/Tier System**: Complete tiers with 24-hour cooldown periods to earn rewards
  - Starter Tier (₵0.5) - No balance required
  - Silver Tier (₵8) - Requires ₵30 balance
  - Gold Tier (₵21) - Requires ₵100 balance
  - Platinum Tier (₵60) - Requires ₵250 balance
  - Diamond Tier (₵100) - Requires ₵500 balance
- **Deposit Requests**: Submit deposit requests (pending admin approval)
- **Withdrawal Requests**: Submit withdrawal requests with mobile number
- **Referral Program**: Earn 5% commission from referred users' deposits
- **Profile Management**: View account information, change password
- **Daily Reset**: Commission and tier claims reset at midnight

### Admin Features
- **Dashboard**: View key statistics (pending deposits, withdrawals, total users)
- **Deposit Management**: Approve/reject deposit requests
- **Withdrawal Management**: Approve/reject withdrawal requests
- **Cashout Management**: View cashout requests
- **Users Management**: View all users and their information
- **Transactions History**: View all platform transactions
- **Filtering**: Filter requests by status

## Setup Instructions

### 1. Firebase Configuration

Before running the application, you need to set up Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication (Email/Password method)
4. Create a Realtime Database
5. Copy your Firebase configuration

### 2. Update Firebase Credentials

Edit `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Set your admin email
const ADMIN_EMAIL = "your-admin@email.com";
```

### 3. Setup Admin Account

After updating the configuration:
1. Open `signup.html` in your browser
2. Create an account with the admin email specified in `ADMIN_EMAIL`
3. This account will have access to the admin portal

### 4. Firebase Security Rules

Add these rules to your Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "deposits": {
      ".read": "root.child('users').child(auth.uid).exists() || root.child('admins').child(auth.uid).exists()",
      ".write": "root.child('users').child(auth.uid).exists()"
    },
    "withdrawals": {
      ".read": "root.child('users').child(auth.uid).exists() || root.child('admins').child(auth.uid).exists()",
      ".write": "root.child('users').child(auth.uid).exists()"
    },
    "transactions": {
      ".read": "root.child('users').child(auth.uid).exists() || root.child('admins').child(auth.uid).exists()",
      ".write": true
    },
    "referrals": {
      ".read": true,
      ".write": true
    },
    "tierClaims": {
      ".read": true,
      ".write": true
    }
  }
}
```

## File Structure

```
sikapa/
├── index.html          # Login page
├── signup.html         # Registration page
├── dashboard.html      # Main app with tabs
├── admin.html          # Admin portal
├── firebase-config.js  # Firebase configuration (UPDATE THIS)
├── auth.js            # Authentication logic
├── database.js        # Database operations and endpoints
├── app.js             # Main app logic
├── admin.js           # Admin portal logic
├── styles.css         # Application styles
└── README.md          # This file
```

## How to Run

1. **Local Server** (Recommended for development):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

2. **Direct File Access**:
   - Open `index.html` directly in your browser
   - Note: Some features may not work due to browser security restrictions

3. **Access the Application**:
   - User Dashboard: `http://localhost:8000/dashboard.html`
   - Admin Portal: `http://localhost:8000/admin.html`
   - Login Page: `http://localhost:8000/index.html`

## Core Features Explained

### Tier System
Users can claim their daily tier rewards based on their balance:
- Tiers become available based on user balance
- Each tier can be claimed once per 24 hours
- Rewards are added to the user's balance

### Referral Program
- Each user gets a unique referral code
- Users can share their referral link via WhatsApp, Facebook, or Twitter
- When referred users deposit, the referrer earns 5% commission
- Commission earnings are displayed in real-time

### Deposit & Withdrawal System
- Users submit deposit requests which are reviewed by admin
- Admin can approve or reject requests
- Approved deposits are added to user balance
- Withdrawal requests require valid balance and mobile number
- Admin approves withdrawal and amount is deducted from balance

### Transaction History
- All deposits, withdrawals, and tier claims are tracked
- Users can view their recent transactions
- Admins can view all transactions across the platform

## API Endpoints (Firebase Database)

### User Data Structure
```
users/{uid}
├── fullName
├── email
├── balance
├── totalRevenue
├── commissionToday
├── todayEarning
├── rechargeAmount
├── withdrawableAmount
├── referralCode
├── friendsInvited
├── commissionEarned
└── lastTierClaim_tier{n}
```

### Deposit Requests
```
deposits/{depositId}
├── depositId
├── uid
├── userName
├── email
├── amount
├── method (momo/bank/card)
├── status (pending/approved/rejected)
├── createdAt
└── approvedAt
```

### Withdrawal Requests
```
withdrawals/{withdrawalId}
├── withdrawalId
├── uid
├── userName
├── email
├── amount
├── method
├── mobileNumber
├── status
├── createdAt
└── approvedAt
```

## Troubleshooting

### Firebase Connection Issues
- Verify Firebase configuration is correct
- Check that Firebase project is active
- Ensure Realtime Database is created
- Check browser console for error messages

### Authentication Failures
- Verify email format is correct
- Check password meets requirements (minimum 6 characters)
- Ensure no duplicate accounts exist

### Admin Access Denied
- Verify the account email matches `ADMIN_EMAIL` in firebase-config.js
- Make sure the admin account was created after updating the config

### Tier Claims Not Working
- Check user has sufficient balance for tier
- Verify 24 hours have passed since last claim
- Check browser console for error messages

## Color Scheme

The application uses a beautiful gradient color scheme:
- Primary: `#667eea` (Purple Blue)
- Secondary: `#764ba2` (Purple)
- Success: `#11998e` - `#38ef7d` (Green)
- Warning: `#f093fb` - `#f5576c` (Pink/Red)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- Firebase Authentication handles password security
- Database rules restrict user access to their own data only
- Admin operations are verified server-side
- Always use HTTPS in production

## Future Enhancements

- Email verification for new accounts
- Password reset functionality
- KYC verification system
- Mobile app version
- Advanced analytics dashboard
- Multiple payment gateways
- Notification system

## Support

For issues or questions, please check the browser console (F12) for error messages and refer to the Firebase documentation at https://firebase.google.com/docs

## License

This project is licensed under the MIT License.

---

**Version**: 1.0.0
**Last Updated**: March 2, 2026
