const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.database();

// Get all withdrawals with analytics
router.get('/stats', async (req, res) => {
    try {
        const snapshot = await db.ref('withdrawals').once('value');
        const withdrawals = snapshot.val() || {};
        
        const withdrawalsList = Object.values(withdrawals);
        const approved = withdrawalsList.filter(w => w.status === 'approved');
        const pending = withdrawalsList.filter(w => w.status === 'pending');
        const rejected = withdrawalsList.filter(w => w.status === 'rejected');

        const totalAmount = approved.reduce((sum, w) => sum + w.amount, 0);
        const pendingAmount = pending.reduce((sum, w) => sum + w.amount, 0);

        res.json({
            success: true,
            stats: {
                total: withdrawalsList.length,
                approved: approved.length,
                pending: pending.length,
                rejected: rejected.length,
                totalAmount: totalAmount,
                pendingAmount: pendingAmount,
                averageAmount: withdrawalsList.length > 0 ? 
                    withdrawalsList.reduce((sum, w) => sum + w.amount, 0) / withdrawalsList.length : 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get withdrawals by user
router.get('/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.ref('withdrawals').orderByChild('uid').equalTo(uid).once('value');
        const withdrawals = snapshot.val() || {};

        res.json({
            success: true,
            count: Object.keys(withdrawals).length,
            data: Object.values(withdrawals)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending withdrawals
router.get('/pending/count', async (req, res) => {
    try {
        const snapshot = await db.ref('withdrawals').once('value');
        const withdrawals = snapshot.val() || {};
        
        const pending = Object.values(withdrawals).filter(w => w.status === 'pending');

        res.json({
            success: true,
            pendingCount: pending.length,
            pendingAmount: pending.reduce((sum, w) => sum + w.amount, 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
