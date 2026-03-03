// Database Operations and API Endpoints

// Get current user data
async function getCurrentUserData() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        const snapshot = await firebase.database().ref('users/' + user.uid).once('value');
        return snapshot.val() || {
            uid: user.uid,
            email: user.email,
            fullName: user.email.split('@')[0],
            balance: 0,
            totalRevenue: 0,
            commissionToday: 0,
            todayEarning: 0,
            referralCode: 'N/A',
            friendsInvited: 0,
            commissionEarned: 0
        };
    } catch (error) {
        console.error('Database error reading user data:', error);
        // Return default user data on error
        const user = firebase.auth().currentUser;
        if (!user) return null;
        return {
            uid: user.uid,
            email: user.email,
            fullName: user.email.split('@')[0],
            balance: 0,
            totalRevenue: 0,
            commissionToday: 0,
            todayEarning: 0,
            referralCode: 'N/A',
            friendsInvited: 0,
            commissionEarned: 0
        };
    }
}

// Update user balance
async function updateUserBalance(uid, amount) {
    const userData = await firebase.database().ref('users/' + uid).once('value');
    const currentBalance = userData.val().balance || 0;
    
    await firebase.database().ref('users/' + uid).update({
        balance: currentBalance + amount
    });
}

// Create deposit request endpoint
async function createDepositRequest(amount, method) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const userData = await getCurrentUserData();
    const depositId = firebase.database().ref().child('deposits').push().key;

    const depositRequest = {
        depositId: depositId,
        uid: user.uid,
        userName: userData.fullName,
        email: user.email,
        amount: amount,
        method: method,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null
    };

    await firebase.database().ref('deposits/' + depositId).set(depositRequest);
    
    // Add to user's transactions
    const transactionId = firebase.database().ref().child('transactions').push().key;
    await firebase.database().ref('transactions/' + transactionId).set({
        transactionId: transactionId,
        uid: user.uid,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    return depositId;
}

// Create withdrawal request endpoint
async function createWithdrawalRequest(amount, method, mobileNumber) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const withdrawalId = firebase.database().ref().child('withdrawals').push().key;
    const userData = await getCurrentUserData();

    // Check if user has sufficient balance
    if (userData.balance < amount) {
        throw new Error('Insufficient balance');
    }

    const withdrawalRequest = {
        withdrawalId: withdrawalId,
        uid: user.uid,
        userName: userData.fullName,
        email: user.email,
        amount: amount,
        method: method,
        mobileNumber: mobileNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null
    };

    await firebase.database().ref('withdrawals/' + withdrawalId).set(withdrawalRequest);
    
    // Add to user's transactions
    const transactionId = firebase.database().ref().child('transactions').push().key;
    await firebase.database().ref('transactions/' + transactionId).set({
        transactionId: transactionId,
        uid: user.uid,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    return withdrawalId;
}

// Approve deposit endpoint (Admin only)
async function approveDeposit(depositId) {
    const adminUser = firebase.auth().currentUser;
    if (adminUser.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
    }

    const depositSnapshot = await firebase.database().ref('deposits/' + depositId).once('value');
    const deposit = depositSnapshot.val();

    if (!deposit) throw new Error('Deposit not found');

    // Update deposit status
    await firebase.database().ref('deposits/' + depositId).update({
        status: 'approved',
        approvedBy: adminUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Add amount to user's balance
    await updateUserBalance(deposit.uid, deposit.amount);

    // Update user's revenue
    const userData = await firebase.database().ref('users/' + deposit.uid).once('value');
    const currentRevenue = userData.val().totalRevenue || 0;
    await firebase.database().ref('users/' + deposit.uid).update({
        totalRevenue: currentRevenue + deposit.amount,
        rechargeAmount: (userData.val().rechargeAmount || 0) + deposit.amount
    });

    // Update transaction status
    const transactionSnapshot = await firebase.database().ref('transactions').orderByChild('uid').equalTo(deposit.uid).once('value');
    if (transactionSnapshot.exists()) {
        const transactions = transactionSnapshot.val();
        const transactionKey = Object.keys(transactions).find(key => 
            transactions[key].type === 'deposit' && transactions[key].createdAt === deposit.createdAt
        );
        if (transactionKey) {
            await firebase.database().ref('transactions/' + transactionKey).update({
                status: 'approved'
            });
        }
    }
}

// Reject deposit endpoint (Admin only)
async function rejectDeposit(depositId) {
    const adminUser = firebase.auth().currentUser;
    if (adminUser.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
    }

    const depositSnapshot = await firebase.database().ref('deposits/' + depositId).once('value');
    const deposit = depositSnapshot.val();

    if (!deposit) throw new Error('Deposit not found');

    await firebase.database().ref('deposits/' + depositId).update({
        status: 'rejected',
        approvedBy: adminUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Update transaction status
    const transactionSnapshot = await firebase.database().ref('transactions').orderByChild('uid').equalTo(deposit.uid).once('value');
    if (transactionSnapshot.exists()) {
        const transactions = transactionSnapshot.val();
        const transactionKey = Object.keys(transactions).find(key => 
            transactions[key].type === 'deposit' && transactions[key].createdAt === deposit.createdAt
        );
        if (transactionKey) {
            await firebase.database().ref('transactions/' + transactionKey).update({
                status: 'rejected'
            });
        }
    }
}

// Approve withdrawal endpoint (Admin only)
async function approveWithdrawal(withdrawalId) {
    const adminUser = firebase.auth().currentUser;
    if (adminUser.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
    }

    const withdrawalSnapshot = await firebase.database().ref('withdrawals/' + withdrawalId).once('value');
    const withdrawal = withdrawalSnapshot.val();

    if (!withdrawal) throw new Error('Withdrawal not found');

    // Update withdrawal status
    await firebase.database().ref('withdrawals/' + withdrawalId).update({
        status: 'approved',
        approvedBy: adminUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Deduct amount from user's balance
    const userData = await firebase.database().ref('users/' + withdrawal.uid).once('value');
    const currentBalance = userData.val().balance || 0;
    await firebase.database().ref('users/' + withdrawal.uid).update({
        balance: currentBalance - withdrawal.amount
    });

    // Update transaction status
    const transactionSnapshot = await firebase.database().ref('transactions').orderByChild('uid').equalTo(withdrawal.uid).once('value');
    if (transactionSnapshot.exists()) {
        const transactions = transactionSnapshot.val();
        const transactionKey = Object.keys(transactions).find(key => 
            transactions[key].type === 'withdrawal' && transactions[key].createdAt === withdrawal.createdAt
        );
        if (transactionKey) {
            await firebase.database().ref('transactions/' + transactionKey).update({
                status: 'approved'
            });
        }
    }
}

// Reject withdrawal endpoint (Admin only)
async function rejectWithdrawal(withdrawalId) {
    const adminUser = firebase.auth().currentUser;
    if (adminUser.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
    }

    const withdrawalSnapshot = await firebase.database().ref('withdrawals/' + withdrawalId).once('value');
    const withdrawal = withdrawalSnapshot.val();

    if (!withdrawal) throw new Error('Withdrawal not found');

    await firebase.database().ref('withdrawals/' + withdrawalId).update({
        status: 'rejected',
        approvedBy: adminUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Update transaction status
    const transactionSnapshot = await firebase.database().ref('transactions').orderByChild('uid').equalTo(withdrawal.uid).once('value');
    if (transactionSnapshot.exists()) {
        const transactions = transactionSnapshot.val();
        const transactionKey = Object.keys(transactions).find(key => 
            transactions[key].type === 'withdrawal' && transactions[key].createdAt === withdrawal.createdAt
        );
        if (transactionKey) {
            await firebase.database().ref('transactions/' + transactionKey).update({
                status: 'rejected'
            });
        }
    }
}

// Get recent transactions for user
async function getUserRecentTransactions(uid, limit = 10) {
    const snapshot = await firebase.database().ref('transactions').orderByChild('uid').equalTo(uid).limitToLast(limit).once('value');
    
    if (!snapshot.exists()) return [];
    
    const transactions = snapshot.val();
    return Object.values(transactions).reverse();
}

// Get all deposits (Admin only)
async function getAllDeposits(filterStatus = 'all') {
    const snapshot = await firebase.database().ref('deposits').once('value');
    
    if (!snapshot.exists()) return [];
    
    const deposits = snapshot.val();
    let result = Object.values(deposits);
    
    if (filterStatus !== 'all') {
        result = result.filter(d => d.status === filterStatus);
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get all withdrawals (Admin only)
async function getAllWithdrawals(filterStatus = 'all') {
    const snapshot = await firebase.database().ref('withdrawals').once('value');
    
    if (!snapshot.exists()) return [];
    
    const withdrawals = snapshot.val();
    let result = Object.values(withdrawals);
    
    if (filterStatus !== 'all') {
        result = result.filter(w => w.status === filterStatus);
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get all users (Admin only)
async function getAllUsers() {
    const snapshot = await firebase.database().ref('users').once('value');
    
    if (!snapshot.exists()) return [];
    
    const users = snapshot.val();
    return Object.values(users).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get all transactions (Admin only)
async function getAllTransactions() {
    const snapshot = await firebase.database().ref('transactions').once('value');
    
    if (!snapshot.exists()) return [];
    
    const transactions = snapshot.val();
    return Object.values(transactions).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Claim tier reward (24-hour cooldown)
async function claimTierReward(tierId) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const userData = await getCurrentUserData();
    const lastClaimKey = 'lastTierClaim_' + tierId;
    const lastClaimTime = userData[lastClaimKey];

    // Check 24-hour cooldown
    if (lastClaimTime) {
        const timeDiff = Date.now() - new Date(lastClaimTime).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
            throw new Error('You can claim this tier again in ' + Math.ceil(24 - hoursDiff) + ' hours');
        }
    }

    const tiers = {
        tier0: { name: 'Starter', reward: 0.5, requiredBalance: 0 },
        tier1: { name: 'Silver', reward: 8, requiredBalance: 30 },
        tier2: { name: 'Gold', reward: 21, requiredBalance: 100 },
        tier3: { name: 'Platinum', reward: 60, requiredBalance: 250 },
        tier4: { name: 'Diamond', reward: 100, requiredBalance: 500 }
    };

    const tier = tiers[tierId];
    
    // Check if user has required balance
    if (userData.balance < tier.requiredBalance) {
        throw new Error('Insufficient balance. Required: ₵' + tier.requiredBalance);
    }

    // Add reward to balance and tier earnings
    const newBalance = userData.balance + tier.reward;
    const newWithdrawableAmount = (userData.withdrawableAmount || 0) + tier.reward;
    const newTierEarnings = (userData.totalTierEarnings || 0) + tier.reward;

    const updateData = {
        balance: newBalance,
        withdrawableAmount: newWithdrawableAmount,
        totalTierEarnings: newTierEarnings,
        tierClaimedToday: (userData.tierClaimedToday || 0) + 1,
        [lastClaimKey]: new Date().toISOString()
    };

    await firebase.database().ref('users/' + user.uid).update(updateData);

    // Add claim record
    const claimId = firebase.database().ref().child('tierClaims').push().key;
    await firebase.database().ref('tierClaims/' + claimId).set({
        claimId: claimId,
        uid: user.uid,
        tierId: tierId,
        tierName: tier.name,
        reward: tier.reward,
        claimedAt: new Date().toISOString()
    });

    return { success: true, reward: tier.reward };
}

// Get tier claim status
async function getTierClaimStatus(tierId) {
    const userData = await getCurrentUserData();
    if (!userData) return { canClaim: false, secondsRemaining: 0 };

    const lastClaimKey = 'lastTierClaim_' + tierId;
    const lastClaimTime = userData[lastClaimKey];

    if (!lastClaimTime) {
        return { canClaim: true, secondsRemaining: 0 };
    }

    const timeDiff = Date.now() - new Date(lastClaimTime).getTime();
    const secondsDiff = timeDiff / 1000;
    const secondsInDay = 86400; // 24 hours in seconds

    if (secondsDiff >= secondsInDay) {
        return { canClaim: true, secondsRemaining: 0 };
    }

    return { canClaim: false, secondsRemaining: Math.ceil(secondsInDay - secondsDiff) };
}

// Get user's referral information
async function getUserReferralInfo() {
    const userData = await getCurrentUserData();
    if (!userData) return null;

    const referralsSnapshot = await firebase.database().ref('referrals/' + userData.uid).once('value');
    let referredUsers = [];

    if (referralsSnapshot.exists()) {
        const referralIds = Object.keys(referralsSnapshot.val());
        
        for (const refId of referralIds) {
            const refUserSnapshot = await firebase.database().ref('users/' + refId).once('value');
            if (refUserSnapshot.exists()) {
                referredUsers.push(refUserSnapshot.val());
            }
        }
    }

    return {
        referralCode: userData.referralCode,
        friendsInvited: userData.friendsInvited || 0,
        commissionEarned: userData.commissionEarned || 0,
        referredUsers: referredUsers
    };
}

// Add referral commission when referred user deposits
async function addReferralCommission(referrerId, amount) {
    const commissionRate = 0.05; // 5% commission
    const commission = amount * commissionRate;

    const referrerData = await firebase.database().ref('users/' + referrerId).once('value');
    if (!referrerData.exists()) return;

    const userData = referrerData.val();
    const newBalance = (userData.balance || 0) + commission;
    const newCommissionEarned = (userData.commissionEarned || 0) + commission;

    await firebase.database().ref('users/' + referrerId).update({
        balance: newBalance,
        commissionEarned: newCommissionEarned,
        commissionToday: (userData.commissionToday || 0) + commission
    });

    // Reset commission today at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeToMidnight = midnight - now;

    setTimeout(() => {
        firebase.database().ref('users/' + referrerId).update({
            commissionToday: 0,
            tierClaimedToday: 0
        });
    }, timeToMidnight);
}

// Daily reset at midnight
function setupDailyReset() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    let timeToMidnight = midnight - now;

    const resetDaily = () => {
        const usersSnapshot = firebase.database().ref('users').once('value', (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                Object.keys(users).forEach(uid => {
                    firebase.database().ref('users/' + uid).update({
                        commissionToday: 0,
                        tierClaimedToday: 0,
                        todayEarning: 0
                    });
                });
            }
        });

        // Schedule next reset
        const nextMidnight = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 0, 0, 0);
        timeToMidnight = nextMidnight - new Date();
        setTimeout(resetDaily, timeToMidnight);
    };

    setTimeout(resetDaily, timeToMidnight);
}

// Change password
async function changePassword(currentPassword, newPassword) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);

        // Update password
        await user.updatePassword(newPassword);

        return { success: true, message: 'Password changed successfully' };
    } catch (error) {
        throw error;
    }
}

// Initialize daily reset
if (firebase.auth().currentUser) {
    setupDailyReset();
}
