// Authentication Handler

// Check if user is already logged in - if so, redirect to dashboard
function checkExistingAuth() {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        unsubscribe(); // Unsubscribe after first check
        if (user) {
            // User is already logged in, send them to dashboard
            console.log('User already logged in, redirecting to dashboard');
            window.location.href = 'dashboard.html';
        }
    });
}

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
            document.getElementById('loginError') && (document.getElementById('loginError').textContent = '❌ Firebase failed to load');
            document.getElementById('signupError') && (document.getElementById('signupError').textContent = '❌ Firebase failed to load');
        }
    }, 100);
}

waitForFirebase(() => {
    // Check if user is already logged in
    checkExistingAuth();
    
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('loginError');
            const submitButton = loginForm.querySelector('button[type="submit"]');

            try {
                errorElement.textContent = '';
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';
                
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                
                // Show success message
                errorElement.textContent = '✅ Login successful! Redirecting...';
                errorElement.style.color = '#11998e';
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } catch (error) {
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
                errorElement.textContent = '❌ ' + error.message;
                errorElement.style.color = '#f5576c';
            }
        });
    }

    // Signup
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const referralCode = document.getElementById('referralCode').value;
            const errorElement = document.getElementById('signupError');
            const submitButton = signupForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                errorElement.textContent = 'Passwords do not match';
                return;
            }

            if (password.length < 6) {
                errorElement.textContent = 'Password must be at least 6 characters';
                return;
            }

            try {
                errorElement.textContent = '';
                errorElement.style.color = '#11998e';
                errorElement.classList.remove('error');
                
                // Disable button to prevent multiple submissions
                submitButton.disabled = true;
                submitButton.textContent = 'Creating account...';
                
                // Create user account
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;

                // Generate referral code
                const referralCodeGenerated = 'SKP' + uid.substring(0, 8).toUpperCase();

                // Generate unique user ID for display
                const displayUserID = uid.substring(0, 8) + uid.substring(uid.length - 8);

                // Create user profile in database
                const userData = {
                    uid: uid,
                    fullName: fullName,
                    email: email,
                    displayUserID: displayUserID,
                    referralCode: referralCodeGenerated,
                    referredBy: referralCode || null,
                    balance: 0,
                    totalRevenue: 0,
                    commissionToday: 0,
                    todayEarning: 0,
                    rechargeAmount: 0,
                    withdrawableAmount: 0,
                    tierClaimedToday: 0,
                    totalTierEarnings: 0,
                    friendsInvited: 0,
                    commissionEarned: 0,
                    createdAt: new Date().toISOString(),
                    status: 'active'
                };

                await firebase.database().ref('users/' + uid).set(userData);

                // If user was referred by someone, add them to referrer's list
                if (referralCode) {
                    try {
                        // Find user by referral code
                        const snapshot = await firebase.database().ref('users').orderByChild('referralCode').equalTo(referralCode).once('value');
                        if (snapshot.exists()) {
                            const referrerId = Object.keys(snapshot.val())[0];
                            
                            // Add referral relationship
                            await firebase.database().ref('referrals/' + referrerId + '/' + uid).set({
                                dateReferred: new Date().toISOString(),
                                status: 'active'
                            });

                            // Increment friends invited count
                            const referrerData = await firebase.database().ref('users/' + referrerId).once('value');
                            const currentFriendsInvited = referrerData.val().friendsInvited || 0;
                            await firebase.database().ref('users/' + referrerId).update({
                                friendsInvited: currentFriendsInvited + 1
                            });
                        }
                    } catch (referralError) {
                        console.warn('Referral code error:', referralError);
                        // Continue anyway - account is created
                    }
                }

                // Show success message
                errorElement.textContent = '✅ Account created successfully! Redirecting to dashboard...';
                errorElement.style.color = '#11998e';
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } catch (error) {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Account';
                errorElement.textContent = '❌ ' + error.message;
                errorElement.style.color = '#f5576c';
            }
        });
    }
});
