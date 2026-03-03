// Main Application Logic

let currentUser = null;
let currentUserData = null;

// Initialize app
async function initializeApp() {
    try {
        console.log('Initializing dashboard...');
        
        // Wait for auth state to load from Firebase server
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe(); // Unsubscribe after first check
                console.log('Auth state loaded. Current user:', user?.email);
                
                if (!user) {
                    console.log('No user found, redirecting to login');
                    window.location.href = 'index.html';
                    resolve();
                    return;
                }

        currentUser = user;
                
                (async () => {
                    try {
                        console.log('Loading user data...');
                        currentUserData = await getCurrentUserData();
                        console.log('User data loaded:', currentUserData);
                    } catch (error) {
                        console.error('Error loading user data:', error);
                        // Continue with empty data
                        currentUserData = {
                            fullName: user.email.split('@')[0],
                            balance: 0,
                            totalRevenue: 0,
                            commissionToday: 0,
                            todayEarning: 0,
                            referralCode: 'N/A',
                            friendsInvited: 0,
                            commissionEarned: 0,
                            rechargeAmount: 0,
                            withdrawableAmount: 0,
                            tierClaimedToday: 0,
                            totalTierEarnings: 0,
                            uid: user.uid,
                            email: user.email
                        };
                    }

                    // Update UI
                    console.log('Updating dashboard UI...');
                    try {
                        updateDashboardUI();
                    } catch (e) { console.error('updateDashboardUI error:', e); }
                    
                    try {
                        loadRecentTransactions();
                    } catch (e) { console.error('loadRecentTransactions error:', e); }
                    
                    try {
                        loadTaskTiers();
                    } catch (e) { console.error('loadTaskTiers error:', e); }
                    
                    try {
                        loadReferralInfo();
                    } catch (e) { console.error('loadReferralInfo error:', e); }
                    
                    try {
                        updateProfileUI();
                    } catch (e) { console.error('updateProfileUI error:', e); }

                    // Setup tab navigation
                    setupTabNavigation();

                    // Setup modal handlers
                    setupModalHandlers();

                    // Setup daily reset
                    setupDailyReset();

                    // Setup logout
                    const logoutBtn = document.getElementById('logoutBtn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', logout);
                    }
                    
                    // Show dashboard
                    console.log('Showing dashboard content...');
                    const dashboardContent = document.getElementById('dashboardContent');
                    if (dashboardContent) {
                        dashboardContent.style.opacity = '1';
                    }
                    const loadingSpinner = document.getElementById('loadingSpinner');
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'none';
                    }
                    
                    console.log('Dashboard initialized successfully!');
                    resolve();
                })();
            });
        });
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Error loading dashboard: ' + error.message);
    }
}

// Wait for Firebase to be ready, then start app
function startWhenReady() {
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
        // Firebase is ready
        console.log('Firebase ready, waiting for DOM...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            // DOM already ready
            initializeApp();
        }
    } else {
        // Firebase not ready yet, try again
        setTimeout(startWhenReady, 100);
    }
}

// Start the app
startWhenReady();

// Tab Navigation
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    document.querySelector('.tab-btn[data-tab="' + tabName + '"]').classList.add('active');

    // Refresh data when switching to different tabs
    if (tabName === 'tasks') {
        loadTaskTiers();
    } else if (tabName === 'referrals') {
        loadReferralInfo();
    } else if (tabName === 'profile') {
        updateProfileUI();
    }
}

// Update Dashboard UI
async function updateDashboardUI() {
    try {
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = 'Welcome, ' + (currentUserData?.fullName || 'User');
        
        const userFullName = document.getElementById('userFullName');
        if (userFullName) userFullName.textContent = currentUserData?.fullName || 'User';
        
        const totalBalance = document.getElementById('totalBalance');
        if (totalBalance) totalBalance.textContent = '₵ ' + (currentUserData?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const totalRevenue = document.getElementById('totalRevenue');
        if (totalRevenue) totalRevenue.textContent = '₵ ' + (currentUserData?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const commissionToday = document.getElementById('commissionToday');
        if (commissionToday) commissionToday.textContent = '₵ ' + (currentUserData?.commissionToday || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const todayEarning = document.getElementById('todayEarning');
        if (todayEarning) todayEarning.textContent = '₵ ' + (currentUserData?.todayEarning || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const rechargeAmount = document.getElementById('rechargeAmount');
        if (rechargeAmount) rechargeAmount.textContent = '₵ ' + (currentUserData?.rechargeAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Show admin button if user is admin
        if (currentUser?.email === ADMIN_EMAIL) {
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) adminBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error updating dashboard UI:', error);
    }
}

// Load Recent Transactions
async function loadRecentTransactions() {
    try {
        const container = document.getElementById('recentTransactions');
        if (!container) return;
        
        if (!currentUser?.uid) {
            container.innerHTML = '<p class="empty-state">Unable to load transactions</p>';
            return;
        }
        
        const transactions = await getUserRecentTransactions(currentUser.uid, 5);

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }

        let html = '<table class="transactions-table">';
        html += '<thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>';
        html += '<tbody>';

        transactions.forEach(transaction => {
            const date = new Date(transaction.createdAt).toLocaleDateString();
            const statusClass = 'status-' + transaction.status;
            html += '<tr>';
            html += '<td>' + transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) + '</td>';
            html += '<td>₵ ' + transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
            html += '<td><span class="' + statusClass + '">' + transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) + '</span></td>';
            html += '<td>' + date + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading recent transactions:', error);
        const container = document.getElementById('recentTransactions');
        if (container) {
            container.innerHTML = '<p class="empty-state">Error loading transactions</p>';
        }
    }
}

// Load Task Tiers
async function loadTaskTiers() {
    try {
        const userData = await getCurrentUserData();
        const container = document.getElementById('tiersContainer');
        if (!container) return;

        const withdrawableAmount = document.getElementById('withdrawableAmount');
        if (withdrawableAmount) withdrawableAmount.textContent = '₵ ' + (userData?.withdrawableAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const tierClaimedToday = document.getElementById('tierClaimedToday');
        if (tierClaimedToday) tierClaimedToday.textContent = userData?.tierClaimedToday || 0;
        
        const totalTierEarnings = document.getElementById('totalTierEarnings');
        if (totalTierEarnings) totalTierEarnings.textContent = '₵ ' + (userData?.totalTierEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const tiers = [
            { id: 'tier0', name: 'Starter', level: 'Tier 0', requiredBalance: 0, reward: 0.5 },
            { id: 'tier1', name: 'Silver', level: 'Tier 1', requiredBalance: 30, reward: 8 },
            { id: 'tier2', name: 'Gold', level: 'Tier 2', requiredBalance: 100, reward: 21 },
            { id: 'tier3', name: 'Platinum', level: 'Tier 3', requiredBalance: 250, reward: 60 },
            { id: 'tier4', name: 'Diamond', level: 'Tier 4', requiredBalance: 500, reward: 100 }
        ];

        let html = '';

        for (const tier of tiers) {
            const claimStatus = await getTierClaimStatus(tier.id);
            const isLocked = userData.balance < tier.requiredBalance;
            const canClaim = claimStatus.canClaim && !isLocked;

            let statusText = isLocked ? 'LOCKED' : 'READY';
            let statusClass = isLocked ? 'status-locked' : 'status-ready';
            let lockMessage = isLocked ? `LOCKED - Need ₵${tier.requiredBalance - userData.balance}` : '';

            if (!canClaim && !isLocked) {
                statusText = 'ON COOLDOWN';
                statusClass = 'status-cooldown';
                lockMessage = '';
            }

        html += `
            <div class="tier-card">
                <div class="tier-header">
                    <h3>${tier.name}</h3>
                    <span class="tier-level">${tier.level}</span>
                </div>
                <div class="tier-status ${statusClass}">${statusText}</div>
                <div class="tier-details">
                    <p>Required Balance: ₵${tier.requiredBalance}</p>
                    <p>Daily Reward: ₵${tier.reward}</p>
                </div>
                ${canClaim ? 
                    `<button class="btn btn-success btn-block" onclick="claimReward('${tier.id}', ${tier.reward})">CLAIM ₵${tier.reward} REWARD</button>` :
                    `<button class="btn btn-outline btn-block" disabled id="countdown-${tier.id}">${lockMessage ? lockMessage : `Available in ${formatCountdown(claimStatus.secondsRemaining)}`}</button>`
                }
            </div>
        `;
        }

        container.innerHTML = html;
        startCountdownTimers();
    } catch (error) {
        console.error('Error loading task tiers:', error);
        const container = document.getElementById('tiersContainer');
        if (container) {
            container.innerHTML = '<p class="empty-state">Error loading tiers</p>';
        }
    }
}

// Format seconds to HH:MM:SS
function formatCountdown(seconds) {
    if (!seconds || seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Start countdown timers for all tiers
function startCountdownTimers() {
    const countdownElements = document.querySelectorAll('[id^="countdown-"]');
    
    countdownElements.forEach(element => {
        const tierId = element.id.replace('countdown-', '');
        let remaining = parseInt(element.textContent.split(' ')[2]) || 0;
        
        // Parse HH:MM:SS format
        const timeParts = element.textContent.split(' ').slice(2).join(' ');
        if (timeParts.includes(':')) {
            const [hours, minutes, secs] = timeParts.split(':').map(Number);
            remaining = hours * 3600 + minutes * 60 + secs;
        }
        
        if (remaining > 0) {
            // Update every second
            const interval = setInterval(() => {
                remaining--;
                element.textContent = `Available in ${formatCountdown(remaining)}`;
                
                if (remaining <= 0) {
                    clearInterval(interval);
                    loadTaskTiers(); // Reload to show claim button
                }
            }, 1000);
        }
    });
}

// Claim Tier Reward
async function claimReward(tierId, reward) {
    try {
        const result = await claimTierReward(tierId);
        alert('Successfully claimed ₵' + reward + ' reward!');
        loadTaskTiers();
        updateDashboardUI();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Load Referral Info
async function loadReferralInfo() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const userData = await getCurrentUserData();
        const referralInfo = await getUserReferralInfo();

        const referralCodeDisplay = document.getElementById('referralCodeDisplay');
        if (referralCodeDisplay) referralCodeDisplay.value = referralInfo?.referralCode || 'N/A';
        
        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/signup.html?ref=';
        const referralLink = baseUrl + (referralInfo?.referralCode || '');
        
        const referralLinkDisplay = document.getElementById('referralLinkDisplay');
        if (referralLinkDisplay) referralLinkDisplay.value = referralLink;

        const friendsInvited = document.getElementById('friendsInvited');
        if (friendsInvited) friendsInvited.textContent = referralInfo?.friendsInvited || 0;
        
        const commissionEarned = document.getElementById('commissionEarned');
        if (commissionEarned) commissionEarned.textContent = '₵ ' + (referralInfo?.commissionEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Load invited friends list
        loadInvitedFriendsList(referralInfo?.referredUsers || []);
    } catch (error) {
        console.error('Error loading referral info:', error);
    }
}

// Load Invited Friends List
function loadInvitedFriendsList(referredUsers) {
    const container = document.getElementById('invitedFriendsListContainer');

    if (referredUsers.length === 0) {
        container.innerHTML = '<p class="empty-state">No referrals yet</p>';
        return;
    }

    let html = '<table class="friends-table">';
    html += '<thead><tr><th>Name</th><th>Email</th><th>Balance</th><th>Status</th></tr></thead>';
    html += '<tbody>';

    referredUsers.forEach(user => {
        html += '<tr>';
        html += '<td>' + user.fullName + '</td>';
        html += '<td>' + user.email + '</td>';
        html += '<td>₵ ' + (user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td><span class="status-active">Active</span></td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Copy Referral Code
function copyReferralCode() {
    const input = document.getElementById('referralCodeDisplay');
    input.select();
    document.execCommand('copy');
    alert('Referral code copied!');
}

// Copy Referral Link
function copyReferralLink() {
    const input = document.getElementById('referralLinkDisplay');
    input.select();
    document.execCommand('copy');
    alert('Referral link copied!');
}

// Share on WhatsApp
function shareWhatsApp() {
    const link = document.getElementById('referralLinkDisplay').value;
    const message = `Join SIKAPA and start earning rewards! Use my referral link: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Share on Facebook
function shareFacebook() {
    const link = document.getElementById('referralLinkDisplay').value;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(facebookUrl, '_blank');
}

// Share on Twitter
function shareTwitter() {
    const link = document.getElementById('referralLinkDisplay').value;
    const text = `Join SIKAPA and start earning rewards! ${link}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
}

// Update Profile UI
async function updateProfileUI() {
    const userData = await getCurrentUserData();

    document.getElementById('profileName').textContent = userData.fullName;
    document.getElementById('profileEmail').textContent = userData.email;
    document.getElementById('profileTotalRevenue').textContent = '₵ ' + (userData.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('profileCommissionToday').textContent = '₵ ' + (userData.commissionToday || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('profileTodayEarning').textContent = '₵ ' + (userData.todayEarning || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('profileRechargeAmount').textContent = '₵ ' + (userData.rechargeAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('accountEmail').textContent = userData.email;
    document.getElementById('accountUserID').textContent = userData.displayUserID || userData.uid || '-';
    
    // Format account creation date
    if (userData.createdAt) {
        try {
            const createdDate = new Date(userData.createdAt);
            const formattedDate = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('accountMemberDate').textContent = formattedDate + ' at ' + formattedTime;
        } catch (e) {
            document.getElementById('accountMemberDate').textContent = userData.createdAt;
        }
    } else {
        document.getElementById('accountMemberDate').textContent = '-';
    }

    // Show admin button if user is admin
    if (currentUser.email === ADMIN_EMAIL) {
        document.getElementById('adminBtn').style.display = 'block';
    }
}

// Go to Admin Portal
function goToAdmin() {
    window.location.href = 'admin.html';
}

// Modal Handlers
function setupModalHandlers() {
    // Deposit form
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const senderName = document.getElementById('senderName').value;
            const senderNumber = document.getElementById('senderNumber').value;
            const screenshot = document.getElementById('depositScreenshot').files[0];

            try {
                if (!screenshot) {
                    throw new Error('Please upload a screenshot of the payment');
                }
                if (screenshot.size > 5 * 1024 * 1024) {
                    throw new Error('Screenshot must be less than 5MB');
                }

                // Create FormData to handle file upload
                const formData = new FormData();
                formData.append('amount', amount);
                formData.append('senderName', senderName);
                formData.append('senderNumber', senderNumber);
                formData.append('screenshot', screenshot);

                // Send to backend
                const response = await fetch('/api/deposits', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${currentUser.getIdToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to submit deposit request');
                }

                alert('Deposit request submitted successfully! Your deposit will be credited within 1-5 minutes.');
                depositForm.reset();
                closeDepositModal();
                loadRecentTransactions();
            } catch (error) {
                document.getElementById('depositError').textContent = error.message;
            }
        });
    }

    // Withdraw form
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            const momoNumber = document.getElementById('withdrawMomoNumber').value;
            const momoName = document.getElementById('withdrawMomoName').value;
            const network = document.getElementById('networkProvider').value;

            try {
                // Get current withdrawable amount to validate
                const userData = await getAdminData(currentUser.uid);
                const withdrawableAmount = userData.withdrawableAmount || 0;

                if (amount > withdrawableAmount) {
                    throw new Error(`Insufficient funds. Available: ₵${withdrawableAmount.toFixed(2)}`);
                }
                if (amount < 1) {
                    throw new Error('Minimum withdrawal amount is ₵1');
                }

                // Create withdrawal request
                const withdrawalData = {
                    userId: currentUser.uid,
                    amount: amount,
                    momoNumber: momoNumber,
                    momoName: momoName,
                    network: network,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };

                // Send to backend
                const response = await fetch('/api/withdrawals', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await currentUser.getIdToken()}`
                    },
                    body: JSON.stringify(withdrawalData)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit withdrawal request');
                }

                alert('Withdrawal request submitted successfully!');
                withdrawForm.reset();
                closeWithdrawModal();
                loadRecentTransactions();
            } catch (error) {
                document.getElementById('withdrawError').textContent = error.message;
            }
        });
    }

    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                document.getElementById('changePasswordError').textContent = 'New passwords do not match';
                return;
            }

            try {
                await changePassword(currentPassword, newPassword);
                alert('Password changed successfully!');
                changePasswordForm.reset();
                closeChangePasswordModal();
            } catch (error) {
                document.getElementById('changePasswordError').textContent = error.message;
            }
        });
    }
}

// Modal Functions
function showDepositModal() {
    document.getElementById('depositModal').style.display = 'block';
    document.getElementById('depositForm').reset();
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
    document.getElementById('depositForm').reset();
}

function setDepositAmount(amount) {
    document.getElementById('depositAmount').value = amount;
    // Highlight the selected button
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function showWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'block';
    document.getElementById('withdrawForm').reset();
    
    // Update withdrawable amount display
    if (currentUser) {
        getAdminData(currentUser.uid).then(userData => {
            const withdrawableAmount = userData.withdrawableAmount || 0;
            document.getElementById('withdrawableDisplay').textContent = '₵ ' + withdrawableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        });
    }
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
    document.getElementById('withdrawForm').reset();
}

function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const depositModal = document.getElementById('depositModal');
    const withdrawModal = document.getElementById('withdrawModal');
    const changePasswordModal = document.getElementById('changePasswordModal');

    if (e.target === depositModal) {
        closeDepositModal();
    }
    if (e.target === withdrawModal) {
        closeWithdrawModal();
    }
    if (e.target === changePasswordModal) {
        closeChangePasswordModal();
    }
});

// File upload handler
document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('depositScreenshot');
    if (fileUpload) {
        const fileUploadArea = fileUpload.parentElement;
        
        // Handle file selection
        fileUpload.addEventListener('change', () => {
            if (fileUpload.files.length > 0) {
                const fileName = fileUpload.files[0].name;
                const fileSize = (fileUpload.files[0].size / (1024 * 1024)).toFixed(2);
                const fileInfo = fileUploadArea.querySelector('.file-info');
                fileInfo.textContent = `✓ ${fileName} (${fileSize}MB)`;
                fileInfo.style.color = '#00d4aa';
            }
        });
        
        fileUploadArea.addEventListener('click', () => fileUpload.click());
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.style.background = 'rgba(138, 43, 226, 0.3)';
        });
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.style.background = 'rgba(138, 43, 226, 0.05)';
        });
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.style.background = 'rgba(138, 43, 226, 0.05)';
            if (e.dataTransfer.files.length > 0) {
                fileUpload.files = e.dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileUpload.dispatchEvent(event);
            }
        });
    }
});

// Logout
async function logout() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
}
