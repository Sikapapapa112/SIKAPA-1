// Firebase Configuration
// Replace these values with your Firebase project configuration

const firebaseConfig = {
    apiKey: "AIzaSyCQNN5DBQYoXrUXDkX1Zrf_iuR1NzeEgqA",
    authDomain: "sikapa-99bbd.firebaseapp.com",
    databaseURL: "https://sikapa-99bbd-default-rtdb.firebaseio.com",
    projectId: "sikapa-99bbd",
    storageBucket: "sikapa-99bbd.firebasestorage.app",
    messagingSenderId: "31318762319",
    appId: "1:31318762319:web:e2b19e66eb6221b8645b3a"
};

// Admin email address - Only this account will have admin access
const ADMIN_EMAIL = "admin@sikapa.com";

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Firebase is now initialized
// Each page (app.js, auth.js, admin.js) will handle its own auth checks and redirects
// This prevents redirect loops by centralizing logic in one place per page
