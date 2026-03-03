const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.database();

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No authorization token' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userRef = await db.ref(`users/${decodedToken.uid}`).once('value');
        const userData = userRef.val();

        // Check if user is admin (you can add custom claims in Firebase)
        if (!decodedToken.admin && process.env.ADMIN_EMAIL !== decodedToken.email) {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token: ' + error.message });
    }
};

// Get all deposits
router.get('/list', verifyAdmin, async (req, res) => {
    try {
        const snapshot = await db.ref('deposits').once('value');
        const deposits = snapshot.val() || {};
        
        const filterStatus = req.query.status || 'all';
        let result = Object.values(deposits);

        if (filterStatus !== 'all') {
            result = result.filter(d => d.status === filterStatus);
        }

        res.json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve deposit
router.post('/approve/:depositId', verifyAdmin, async (req, res) => {
    try {
        const { depositId } = req.params;
        
        const depositRef = db.ref(`deposits/${depositId}`);
        const snapshot = await depositRef.once('value');
        const deposit = snapshot.val();

        if (!deposit) {
            return res.status(404).json({ error: 'Deposit not found' });
        }

        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Deposit is not pending' });
        }

        // Update deposit status
        await depositRef.update({
            status: 'approved',
            approvedBy: req.user.uid,
            approvedAt: new Date().toISOString()
        });

        // Add amount to user's balance
        const userRef = db.ref(`users/${deposit.uid}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();

        const newBalance = (userData.balance || 0) + deposit.amount;
        const newRevenue = (userData.totalRevenue || 0) + deposit.amount;

        await userRef.update({
            balance: newBalance,
            totalRevenue: newRevenue,
            rechargeAmount: (userData.rechargeAmount || 0) + deposit.amount
        });

        // Update transaction status
        const transactionsRef = db.ref('transactions');
        const transSnapshot = await transactionsRef.orderByChild('uid').equalTo(deposit.uid).once('value');
        if (transSnapshot.exists()) {
            const transactions = transSnapshot.val();
            // Find and update the matching transaction
            for (const key in transactions) {
                if (transactions[key].type === 'deposit' && 
                    new Date(transactions[key].createdAt).getTime() === new Date(deposit.createdAt).getTime()) {
                    await db.ref(`transactions/${key}`).update({ status: 'approved' });
                    break;
                }
            }
        }

        res.json({
            success: true,
            message: 'Deposit approved successfully',
            depositId: depositId,
            amount: deposit.amount,
            userBalance: newBalance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject deposit
router.post('/reject/:depositId', verifyAdmin, async (req, res) => {
    try {
        const { depositId } = req.params;
        const { reason } = req.body;

        const depositRef = db.ref(`deposits/${depositId}`);
        const snapshot = await depositRef.once('value');
        const deposit = snapshot.val();

        if (!deposit) {
            return res.status(404).json({ error: 'Deposit not found' });
        }

        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Deposit is not pending' });
        }

        // Update deposit status
        await depositRef.update({
            status: 'rejected',
            rejectedBy: req.user.uid,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason || 'No reason provided'
        });

        // Update transaction status
        const transactionsRef = db.ref('transactions');
        const transSnapshot = await transactionsRef.orderByChild('uid').equalTo(deposit.uid).once('value');
        if (transSnapshot.exists()) {
            const transactions = transSnapshot.val();
            for (const key in transactions) {
                if (transactions[key].type === 'deposit' && 
                    new Date(transactions[key].createdAt).getTime() === new Date(deposit.createdAt).getTime()) {
                    await db.ref(`transactions/${key}`).update({ status: 'rejected' });
                    break;
                }
            }
        }

        res.json({
            success: true,
            message: 'Deposit rejected successfully',
            depositId: depositId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
