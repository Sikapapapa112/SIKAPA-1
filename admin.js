// Admin Portal Logic

let currentAdmin = null;
let currentDepositFilter = 'all';
let currentWithdrawalFilter = 'all';
let currentCashoutFilter = 'all';
let currentApprovalRequest = null;
let currentApprovalType = null;

// Wait for Firebase to load
function waitForFirebase(callback, maxWait = 10000) {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
        if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
            clearInterval(checkInterval);
            callback();
        } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkInterval);
            console.error('Firebase failed to load');
            alert('Firebase failed to load. Please refresh the page.');
        }
    }, 100);
}

waitForFirebase(() => {
    document.addEventListener('DOMContentLoaded', async () => {
        const user = firebase.auth().currentUser;
        if (!user || user.email !== ADMIN_EMAIL) {
            alert('Unauthorized access');
            window.location.href = 'index.html';
            return;
        }

        currentAdmin = user;
        document.getElementById('adminUserName').textContent = user.email;

        // Load dashboard data
        loadAdminDashboard();

        // Setup navigation
        setupAdminNavigation();

        // Setup filters
        setupFilters();

        // Setup user search
        setupUserSearch();
    });
});

// Setup Admin Navigation
function setupAdminNavigation() {
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.adminTab;
            switchAdminTab(tabName);
        });
    });
}

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).style.display = 'block';
    document.querySelector('.admin-nav-btn[data-admin-tab="' + tabName + '"]').classList.add('active');

    // Load data for tab
    if (tabName === 'deposits') {
        loadDepositsTable('all');
    } else if (tabName === 'withdrawals') {
        loadWithdrawalsTable('all');
    } else if (tabName === 'cashouts') {
        loadCashoutsTable('all');
    } else if (tabName === 'users') {
        loadUsersTable('');
    } else if (tabName === 'transactions') {
        loadTransactionsTable();
    }
}

// Load Admin Dashboard
async function loadAdminDashboard() {
    const deposits = await getAllDeposits();
    const withdrawals = await getAllWithdrawals();
    const users = await getAllUsers();

    // Calculate stats
    const totalDeposits = deposits.length;
    const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
    const totalDepositsAmount = deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0);
    const pendingDepositsAmount = deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

    const totalWithdrawals = withdrawals.length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    const totalWithdrawalsAmount = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawalsAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

    // Total cashouts (placeholder for now)
    const totalCashouts = 0;
    const pendingCashouts = 0;
    const totalCashoutsAmount = 0;
    const pendingCashoutsAmount = 0;

    const totalUsers = users.length;

    // Update UI
    document.getElementById('totalDeposits').textContent = totalDeposits;
    document.getElementById('totalDepositsAmount').textContent = totalDepositsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('pendingDeposits').textContent = pendingDeposits;
    document.getElementById('pendingDepositsAmount').textContent = pendingDepositsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('totalWithdrawals').textContent = totalWithdrawals;
    document.getElementById('totalWithdrawalsAmount').textContent = totalWithdrawalsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('pendingWithdrawals').textContent = pendingWithdrawals;
    document.getElementById('pendingWithdrawalsAmount').textContent = pendingWithdrawalsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('totalCashouts').textContent = totalCashouts;
    document.getElementById('totalCashoutsAmount').textContent = totalCashoutsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('pendingCashouts').textContent = pendingCashouts;
    document.getElementById('pendingCashoutsAmount').textContent = pendingCashoutsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('totalUsers').textContent = totalUsers;
}

// Setup Filters
function setupFilters() {
    // Deposits filters
    document.querySelectorAll('#depositsTable .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#depositsTable .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            currentDepositFilter = filter;
            loadDepositsTable(filter);
        });
    });

    // Withdrawals filters
    document.querySelectorAll('#withdrawalsTable .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#withdrawalsTable .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            currentWithdrawalFilter = filter;
            loadWithdrawalsTable(filter);
        });
    });

    // Cashouts filters
    document.querySelectorAll('#cashoutsTable .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#cashoutsTable .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            currentCashoutFilter = filter;
            loadCashoutsTable(filter);
        });
    });
}

// Load Deposits Table
async function loadDepositsTable(filter) {
    const deposits = await getAllDeposits(filter);
    const tbody = document.getElementById('depositsTableBody');

    if (deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No deposits found</td></tr>';
        return;
    }

    let html = '';
    deposits.forEach(deposit => {
        const date = new Date(deposit.createdAt).toLocaleDateString();
        const statusClass = 'status-' + deposit.status;
        html += '<tr>';
        html += '<td>' + deposit.userName + '</td>';
        html += '<td>' + deposit.email + '</td>';
        html += '<td>₵ ' + deposit.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + deposit.method.toUpperCase() + '</td>';
        html += '<td>' + date + '</td>';
        html += '<td><span class="' + statusClass + '">' + deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1) + '</span></td>';
        html += '<td>';
        if (deposit.status === 'pending') {
            html += '<button class="btn btn-sm btn-success" onclick="openApprovalModal(\'deposit\', \'' + deposit.depositId + '\')">Review</button>';
        }
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

// Load Withdrawals Table
async function loadWithdrawalsTable(filter) {
    const withdrawals = await getAllWithdrawals(filter);
    const tbody = document.getElementById('withdrawalsTableBody');

    if (withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No withdrawals found</td></tr>';
        return;
    }

    let html = '';
    withdrawals.forEach(withdrawal => {
        const date = new Date(withdrawal.createdAt).toLocaleDateString();
        const statusClass = 'status-' + withdrawal.status;
        html += '<tr>';
        html += '<td>' + withdrawal.userName + '</td>';
        html += '<td>' + withdrawal.email + '</td>';
        html += '<td>₵ ' + withdrawal.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + withdrawal.method.toUpperCase() + '</td>';
        html += '<td>' + withdrawal.mobileNumber + '</td>';
        html += '<td>' + date + '</td>';
        html += '<td><span class="' + statusClass + '">' + withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1) + '</span></td>';
        html += '<td>';
        if (withdrawal.status === 'pending') {
            html += '<button class="btn btn-sm btn-success" onclick="openApprovalModal(\'withdrawal\', \'' + withdrawal.withdrawalId + '\')">Review</button>';
        }
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

// Load Cashouts Table
async function loadCashoutsTable(filter) {
    // Placeholder for cashouts
    const tbody = document.getElementById('cashoutsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No cashouts yet</td></tr>';
}

// Load Users Table
async function loadUsersTable(searchQuery) {
    const users = await getAllUsers();
    const tbody = document.getElementById('usersTableBody');

    let filteredUsers = users;
    if (searchQuery) {
        filteredUsers = users.filter(user => 
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No users found</td></tr>';
        return;
    }

    let html = '';
    filteredUsers.forEach(user => {
        const memberDate = new Date(user.createdAt).toLocaleDateString();
        html += '<tr>';
        html += '<td>' + user.fullName + '</td>';
        html += '<td>' + user.email + '</td>';
        html += '<td>' + user.displayUserID + '</td>';
        html += '<td>₵ ' + (user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + memberDate + '</td>';
        html += '<td><span class="status-active">' + user.status + '</span></td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

// Load Transactions Table
async function loadTransactionsTable() {
    const transactions = await getAllTransactions();
    const tbody = document.getElementById('transactionsTableBody');

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No transactions found</td></tr>';
        return;
    }

    let html = '';
    transactions.slice(0, 50).forEach(transaction => {
        const date = new Date(transaction.createdAt).toLocaleDateString();
        const statusClass = 'status-' + transaction.status;
        
        // Get user data to display name
        firebase.database().ref('users/' + transaction.uid).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const userName = snapshot.val().fullName;
                // Update the row with user name (simplified approach)
            }
        });

        html += '<tr>';
        html += '<td>' + transaction.uid.substring(0, 8) + '</td>';
        html += '<td>' + transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) + '</td>';
        html += '<td>₵ ' + transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td><span class="' + statusClass + '">' + transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) + '</span></td>';
        html += '<td>' + date + '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

// Setup User Search
function setupUserSearch() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadUsersTable(e.target.value);
        });
    }
}

// Open Approval Modal
async function openApprovalModal(type, id) {
    currentApprovalType = type;
    
    if (type === 'deposit') {
        const snapshot = await firebase.database().ref('deposits/' + id).once('value');
        currentApprovalRequest = snapshot.val();
        currentApprovalRequest.id = id;
        
        const detailsHtml = `
            <div class="approval-details">
                <p><strong>Name:</strong> ${currentApprovalRequest.userName}</p>
                <p><strong>Email:</strong> ${currentApprovalRequest.email}</p>
                <p><strong>Amount:</strong> ₵ ${currentApprovalRequest.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><strong>Method:</strong> ${currentApprovalRequest.method.toUpperCase()}</p>
                <p><strong>Date:</strong> ${new Date(currentApprovalRequest.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${currentApprovalRequest.status}</p>
            </div>
        `;
        
        document.getElementById('approvalTitle').textContent = 'Review Deposit Request';
        document.getElementById('approvalDetails').innerHTML = detailsHtml;
    } else if (type === 'withdrawal') {
        const snapshot = await firebase.database().ref('withdrawals/' + id).once('value');
        currentApprovalRequest = snapshot.val();
        currentApprovalRequest.id = id;
        
        const detailsHtml = `
            <div class="approval-details">
                <p><strong>Name:</strong> ${currentApprovalRequest.userName}</p>
                <p><strong>Email:</strong> ${currentApprovalRequest.email}</p>
                <p><strong>Amount:</strong> ₵ ${currentApprovalRequest.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><strong>Method:</strong> ${currentApprovalRequest.method.toUpperCase()}</p>
                <p><strong>Mobile:</strong> ${currentApprovalRequest.mobileNumber}</p>
                <p><strong>Date:</strong> ${new Date(currentApprovalRequest.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${currentApprovalRequest.status}</p>
            </div>
        `;
        
        document.getElementById('approvalTitle').textContent = 'Review Withdrawal Request';
        document.getElementById('approvalDetails').innerHTML = detailsHtml;
    }
    
    document.getElementById('approvalModal').style.display = 'block';
}

// Approve Request
async function approveRequest() {
    try {
        if (currentApprovalType === 'deposit') {
            await approveDeposit(currentApprovalRequest.id);
            alert('Deposit approved successfully!');
            loadAdminDashboard();
            loadDepositsTable(currentDepositFilter);
        } else if (currentApprovalType === 'withdrawal') {
            await approveWithdrawal(currentApprovalRequest.id);
            alert('Withdrawal approved successfully!');
            loadAdminDashboard();
            loadWithdrawalsTable(currentWithdrawalFilter);
        }
        closeApprovalModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Reject Request
async function rejectRequest() {
    try {
        if (currentApprovalType === 'deposit') {
            await rejectDeposit(currentApprovalRequest.id);
            alert('Deposit rejected successfully!');
            loadAdminDashboard();
            loadDepositsTable(currentDepositFilter);
        } else if (currentApprovalType === 'withdrawal') {
            await rejectWithdrawal(currentApprovalRequest.id);
            alert('Withdrawal rejected successfully!');
            loadAdminDashboard();
            loadWithdrawalsTable(currentWithdrawalFilter);
        }
        closeApprovalModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Close Approval Modal
function closeApprovalModal() {
    document.getElementById('approvalModal').style.display = 'none';
    currentApprovalRequest = null;
    currentApprovalType = null;
}

// Admin Logout
async function adminLogout() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const approvalModal = document.getElementById('approvalModal');
    if (e.target === approvalModal) {
        closeApprovalModal();
    }
});
