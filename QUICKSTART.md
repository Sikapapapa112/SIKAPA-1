# SIKAPA Quick Start Guide

Get SIKAPA up and running in 5 minutes!

## Step 1: Set Up Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com
2. Click "Add project" or select existing project
3. Fill in project name and create
4. Once created, go to project settings:
   - Click the gear icon (top left)
   - Select "Project settings"
   - Copy your Firebase config values

### Enable Authentication
1. Go to "Authentication" in left menu
2. Click "Get started"
3. Select "Email/Password" provider
4. Enable it and save

### Create Realtime Database
1. Go to "Realtime Database" in left menu
2. Click "Create database"
3. Start in "Test mode" (for development)
4. Choose a location close to you
5. Click "Enable"

## Step 2: Update Configuration (1 minute)

1. Open `firebase-config.js` in your text editor
2. Find the `firebaseConfig` object
3. Replace each value with corresponding Firebase value:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // Example: AIzaSyC_JdG...
    authDomain: "YOUR_AUTH_DOMAIN",      // Example: myproject.firebaseapp.com
    databaseURL: "YOUR_DATABASE_URL",    // Example: https://myproject.firebaseio.com
    projectId: "YOUR_PROJECT_ID",        // Example: myproject
    storageBucket: "YOUR_STORAGE_BUCKET", // Example: myproject.appspot.com
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Example: 123456789
    appId: "YOUR_APP_ID"                 // Example: 1:123456789:web:abc123...
};
```

4. Update the admin email:
```javascript
const ADMIN_EMAIL = "your-email@gmail.com";
```

## Step 3: Run the Application (1 minute)

### Option A: Using Python (Recommended)
```bash
# Open terminal/command prompt in the SIKAPA folder
python -m http.server 8000

# Then open browser to: http://localhost:8000
```

### Option B: Using Node.js
```bash
# Install http-server (first time only)
npm install -g http-server

# Run from SIKAPA folder
http-server

# Then open browser to: http://localhost:8000
```

### Option C: Direct File Opening
- Double-click `index.html` to open in browser
- Note: Some features may be limited

## Step 4: Create Admin Account (30 seconds)

1. Open http://localhost:8000 in browser
2. Click "Sign up" to create account
3. Use the email you set as ADMIN_EMAIL
4. Complete registration
5. Login with your credentials
6. You'll now see the "Admin" button on your profile!

## Step 5: Create Test User Account (optional)

1. Open browser in incognito/private mode (or different browser)
2. Go to http://localhost:8000
3. Click "Sign up"
4. Create a test account (any email)
5. Login and explore features

## Now You're Ready!

### Default Test Features

**For Regular Users:**
- View dashboard with balance stats
- Submit deposit requests
- Submit withdrawal requests
- Claim daily tier rewards (24-hour cooldown)
- Invite friends with referral code
- View profile and account info

**For Admin:**
- View all analytics
- Approve/reject deposits
- Approve/reject withdrawals
- View all users
- View all transactions
- Monitor platform statistics

## Common First Steps

1. **As Admin**: Log in and go to Profile → Click Admin button
2. **Create a test deposit**: Submit $50 deposit request
3. **As Admin**: Go to Admin → Deposits → Review and Approve
4. **As User**: Watch balance update in real-time
5. **Test referrals**: Share your referral link with test users

## Troubleshooting Quick Fixes

### "Cannot find firebaseConfig"
- ✓ Check firebase-config.js exists in same folder as HTML files
- ✓ Verify you replaced placeholder values

### "Authentication Error"
- ✓ Check email format is correct
- ✓ Check password has at least 6 characters
- ✓ Verify Firebase Authentication is enabled

### Cannot access Admin Portal
- ✓ Verify admin email in firebase-config.js matches account
- ✓ Log out and log back in
- ✓ Check browser console (F12) for errors

### No data appears
- ✓ Check Network tab (F12) for Firebase errors
- ✓ Verify Firebase Database Rules are set correctly
- ✓ Wait a moment and refresh page

### 404 or page not loading
- ✓ Make sure running local server (not opening files directly)
- ✓ Verify all files are in same directory
- ✓ Check correct URL in browser

## Firebase Database Rules (Copy & Paste)

Go to Firebase Console → Realtime Database → Rules and paste:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

## Next Steps

1. Customize colors in `styles.css` if desired
2. Add more payment methods in deposit/withdrawal forms
3. Extend with email notifications
4. Deploy to production with Firebase Hosting

## Files Checklist

Before running, verify you have these files:
- ✓ index.html (login page)
- ✓ signup.html (registration)
- ✓ dashboard.html (main app)
- ✓ admin.html (admin portal)
- ✓ firebase-config.js (YOUR CONFIG - must be updated!)
- ✓ auth.js (login/signup logic)
- ✓ database.js (Firebase database operations)
- ✓ app.js (dashboard logic)
- ✓ admin.js (admin logic)
- ✓ styles.css (styling)
- ✓ README.md (documentation)

## Support

If you get stuck:
1. Check browser console (F12 → Console tab) for error messages
2. Read the error message carefully - it usually tells you what's wrong
3. Verify all configuration values are correct
4. Check Firebase console to ensure services are enabled
5. Try in a different browser or incognito mode

## You're All Set! 🎉

Login to http://localhost:8000 and start earning rewards on SIKAPA!

Need help? Check README.md for detailed documentation.
