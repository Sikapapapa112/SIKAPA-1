const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.database();

// Get all users
router.get('/list', async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};

        const usersList = Object.values(users).map(user => ({
            uid: user.uid,
            fullName: user.fullName,
            email: user.email,
            balance: user.balance || 0,
            totalRevenue: user.totalRevenue || 0,
            createdAt: user.createdAt,
            status: user.status || 'active'
        }));

        res.json({
            success: true,
            count: usersList.length,
            data: usersList
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user details
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.ref(`users/${uid}`).once('value');
        const user = snapshot.val();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user statistics
router.get('/:uid/stats', async (req, res) => {
    try {
        const { uid } = req.params;
        const userRef = await db.ref(`users/${uid}`).once('value');
        const user = userRef.val();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user transactions
        const transSnapshot = await db.ref('transactions').orderByChild('uid').equalTo(uid).once('value');
        const transactions = transSnapshot.val() || {};
        const transactionsList = Object.values(transactions);

        // Get referrals
        const refSnapshot = await db.ref(`referrals/${uid}`).once('value');
        const referrals = refSnapshot.val() || {};

        res.json({
            success: true,
            stats: {
                balance: user.balance || 0,
                totalRevenue: user.totalRevenue || 0,
                totalTransactions: transactionsList.length,
                referralCount: Object.keys(referrals).length,
                memberSince: user.createdAt,
                commissionEarned: user.commissionEarned || 0,
                tierEarnings: user.totalTierEarnings || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search users
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};

        const results = Object.values(users).filter(user =>
            user.fullName.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
