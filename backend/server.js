const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

const db = admin.database();

// Import routes
const adminRoutes = require('./routes/admin');
const depositsRoutes = require('./routes/deposits');
const withdrawalsRoutes = require('./routes/withdrawals');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const tasksRoutes = require('./routes/tasks');
const emailRoutes = require('./routes/email');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend server is running', timestamp: new Date() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/deposits', depositsRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/email', emailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   💎 SIKAPA Backend Server Started     ║
    ╚════════════════════════════════════════╝
    
    🚀 Server running on: http://localhost:${PORT}
    📝 Environment: ${process.env.NODE_ENV}
    🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}
    
    Available endpoints:
    - GET  /api/health
    - POST /api/admin/approve-deposit
    - POST /api/admin/reject-deposit
    - GET  /api/analytics/dashboard
    - GET  /api/users/list
    - POST /api/email/send
    
    `);
});

module.exports = app;
