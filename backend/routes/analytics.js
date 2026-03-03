const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

const db = admin.database();

// Dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        // Get all data
        const usersSnapshot = await db.ref('users').once('value');
        const depositsSnapshot = await db.ref('deposits').once('value');
        const withdrawalsSnapshot = await db.ref('withdrawals').once('value');
        const transactionsSnapshot = await db.ref('transactions').once('value');

        const users = Object.values(usersSnapshot.val() || {});
        const deposits = Object.values(depositsSnapshot.val() || {});
        const withdrawals = Object.values(withdrawalsSnapshot.val() || {});
        const transactions = Object.values(transactionsSnapshot.val() || {});

        // Calculate statistics
        const totalUsers = users.length;
        const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
        const totalRevenue = users.reduce((sum, u) => sum + (u.totalRevenue || 0), 0);

        const approvedDeposits = deposits.filter(d => d.status === 'approved');
        const pendingDeposits = deposits.filter(d => d.status === 'pending');
        const totalDeposited = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);
        const pendingDepositAmount = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);

        const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
        const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
        const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

        // Get last 7 days stats
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentDeposits = deposits.filter(d => new Date(d.createdAt) > sevenDaysAgo);
        const recentWithdrawals = withdrawals.filter(w => new Date(w.createdAt) > sevenDaysAgo);

        res.json({
            success: true,
            dashboard: {
                users: {
                    total: totalUsers,
                    active: users.filter(u => u.status === 'active').length
                },
                deposits: {
                    total: deposits.length,
                    pending: pendingDeposits.length,
                    approved: approvedDeposits.length,
                    totalAmount: totalDeposited,
                    pendingAmount: pendingDepositAmount
                },
                withdrawals: {
                    total: withdrawals.length,
                    pending: pendingWithdrawals.length,
                    approved: approvedWithdrawals.length,
                    totalAmount: totalWithdrawn,
                    pendingAmount: pendingWithdrawalAmount
                },
                financial: {
                    totalBalance: totalBalance,
                    totalRevenue: totalRevenue,
                    netFlow: totalDeposited - totalWithdrawn
                },
                transactions: {
                    total: transactions.length,
                    last7Days: recentDeposits.length + recentWithdrawals.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Revenue analytics
router.get('/revenue', async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        const users = Object.values(snapshot.val() || {});

        const totalRevenue = users.reduce((sum, u) => sum + (u.totalRevenue || 0), 0);
        const totalCommission = users.reduce((sum, u) => sum + (u.commissionEarned || 0), 0);
        const totalTierEarnings = users.reduce((sum, u) => sum + (u.totalTierEarnings || 0), 0);

        res.json({
            success: true,
            revenue: {
                totalRevenue: totalRevenue,
                totalCommission: totalCommission,
                totalTierEarnings: totalTierEarnings,
                topEarners: users
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .slice(0, 10)
                    .map(u => ({
                        name: u.fullName,
                        email: u.email,
                        revenue: u.totalRevenue || 0
                    }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User growth analytics
router.get('/growth', async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        const users = Object.values(snapshot.val() || {});

        // Group by date
        const usersByDate = {};
        users.forEach(user => {
            const date = new Date(user.createdAt).toISOString().split('T')[0];
            usersByDate[date] = (usersByDate[date] || 0) + 1;
        });

        // Get last 30 days
        const growthData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            growthData.push({
                date: dateStr,
                newUsers: usersByDate[dateStr] || 0
            });
        }

        res.json({
            success: true,
            growth: {
                totalUsers: users.length,
                last30Days: growthData,
                dailyAverage: Math.round(users.length / 30)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
