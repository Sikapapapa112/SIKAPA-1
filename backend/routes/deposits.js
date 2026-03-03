const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.database();

// Get all deposits with analytics
router.get('/stats', async (req, res) => {
    try {
        const snapshot = await db.ref('deposits').once('value');
        const deposits = snapshot.val() || {};
        
        const depositsList = Object.values(deposits);
        const approved = depositsList.filter(d => d.status === 'approved');
        const pending = depositsList.filter(d => d.status === 'pending');
        const rejected = depositsList.filter(d => d.status === 'rejected');

        const totalAmount = approved.reduce((sum, d) => sum + d.amount, 0);
        const pendingAmount = pending.reduce((sum, d) => sum + d.amount, 0);

        res.json({
            success: true,
            stats: {
                total: depositsList.length,
                approved: approved.length,
                pending: pending.length,
                rejected: rejected.length,
                totalAmount: totalAmount,
                pendingAmount: pendingAmount,
                averageAmount: depositsList.length > 0 ? 
                    depositsList.reduce((sum, d) => sum + d.amount, 0) / depositsList.length : 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deposits by user
router.get('/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.ref('deposits').orderByChild('uid').equalTo(uid).once('value');
        const deposits = snapshot.val() || {};

        res.json({
            success: true,
            count: Object.keys(deposits).length,
            data: Object.values(deposits)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending deposits count
router.get('/pending/count', async (req, res) => {
    try {
        const snapshot = await db.ref('deposits').once('value');
        const deposits = snapshot.val() || {};
        
        const pending = Object.values(deposits).filter(d => d.status === 'pending');

        res.json({
            success: true,
            pendingCount: pending.length,
            pendingAmount: pending.reduce((sum, d) => sum + d.amount, 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
