const express = require('express');
const admin = require('firebase-admin');
const cron = require('node-cron');
const router = express.Router();

const db = admin.database();

// Daily reset - runs every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running daily reset task...');
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};

        // Reset daily counters for all users
        for (const uid in users) {
            await db.ref(`users/${uid}`).update({
                commissionToday: 0,
                tierClaimedToday: 0,
                todayEarning: 0
            });
        }

        console.log('Daily reset completed');
    } catch (error) {
        console.error('Error in daily reset:', error);
    }
});

// Process pending deposits (optional - auto-approve after X hours)
cron.schedule('0 */4 * * *', async () => {
    try {
        console.log('Checking pending deposits for auto-processing...');
        const snapshot = await db.ref('deposits').once('value');
        const deposits = snapshot.val() || {};

        // Deposits pending for more than 24 hours (can be auto-approved)
        const now = new Date();
        for (const depositId in deposits) {
            const deposit = deposits[depositId];
            if (deposit.status === 'pending') {
                const createdTime = new Date(deposit.createdAt);
                const hoursDiff = (now - createdTime) / (1000 * 60 * 60);

                // Alert if pending for more than 24 hours
                if (hoursDiff > 24) {
                    console.log(`Alert: Deposit ${depositId} pending for ${Math.round(hoursDiff)} hours`);
                    // You can send email notification here
                }
            }
        }
    } catch (error) {
        console.error('Error checking deposits:', error);
    }
});

// Process tier claims expiry
cron.schedule('0 */12 * * *', async () => {
    try {
        console.log('Processing tier claim expirations...');
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};

        // Check tier claim cooldowns
        const now = new Date();
        for (const uid in users) {
            const user = users[uid];
            
            // Check each tier for cooldown expiry
            for (let i = 0; i < 5; i++) {
                const tierKey = `lastTierClaim_tier${i}`;
                if (user[tierKey]) {
                    const lastClaim = new Date(user[tierKey]);
                    const hoursDiff = (now - lastClaim) / (1000 * 60 * 60);

                    if (hoursDiff >= 24) {
                        // Tier is now available again (frontend will show it as READY)
                        console.log(`Tier ${i} available for user ${user.fullName}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing tier claims:', error);
    }
});

// Get all scheduled tasks status
router.get('/status', async (req, res) => {
    try {
        res.json({
            success: true,
            tasks: {
                dailyReset: {
                    name: 'Daily Reset',
                    schedule: '0 0 * * * (Every day at midnight)',
                    description: 'Resets daily commission and tier claims for all users',
                    status: 'active'
                },
                depositProcessing: {
                    name: 'Deposit Processing',
                    schedule: '0 */4 * * * (Every 4 hours)',
                    description: 'Checks for pending deposits and sends alerts',
                    status: 'active'
                },
                tierExpiry: {
                    name: 'Tier Expiry Check',
                    schedule: '0 */12 * * * (Every 12 hours)',
                    description: 'Processes tier claim cooldown expirations',
                    status: 'active'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual trigger for daily reset (admin only)
router.post('/run-daily-reset', async (req, res) => {
    try {
        const adminToken = req.headers['x-admin-token'];
        if (adminToken !== process.env.ADMIN_SECRET_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};
        let resetCount = 0;

        for (const uid in users) {
            await db.ref(`users/${uid}`).update({
                commissionToday: 0,
                tierClaimedToday: 0,
                todayEarning: 0
            });
            resetCount++;
        }

        res.json({
            success: true,
            message: `Daily reset completed for ${resetCount} users`,
            usersReset: resetCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
