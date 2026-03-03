const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configure email transporter
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
} catch (error) {
    console.log('Email service not configured - email notifications disabled');
}

// Send deposit approval notification
router.post('/deposit-approved', async (req, res) => {
    try {
        const { userEmail, userName, amount, depositId } = req.body;

        if (!transporter) {
            return res.status(400).json({ error: 'Email service not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@sikapa.com',
            to: userEmail,
            subject: '✅ Your Deposit has been Approved!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #667eea;">Deposit Approved</h2>
                    <p>Hi ${userName},</p>
                    <p>Great news! Your deposit request has been approved.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Deposit Details:</strong></p>
                        <p>Amount: <strong>₵ ${amount}</strong></p>
                        <p>Deposit ID: ${depositId}</p>
                        <p>Status: <span style="color: #11998e; font-weight: bold;">APPROVED</span></p>
                    </div>
                    
                    <p>Your account balance has been updated. You can now use these funds for withdrawals or tier rewards.</p>
                    <p><a href="https://sikapa.com/dashboard" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2026 SIKAPA. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Email sent successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send deposit rejection notification
router.post('/deposit-rejected', async (req, res) => {
    try {
        const { userEmail, userName, amount, depositId, reason } = req.body;

        if (!transporter) {
            return res.status(400).json({ error: 'Email service not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@sikapa.com',
            to: userEmail,
            subject: '❌ Your Deposit Request was Rejected',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #f5576c;">Deposit Rejected</h2>
                    <p>Hi ${userName},</p>
                    <p>Unfortunately, your deposit request could not be approved.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Deposit Details:</strong></p>
                        <p>Amount: <strong>₵ ${amount}</strong></p>
                        <p>Deposit ID: ${depositId}</p>
                        <p>Status: <span style="color: #dc3545; font-weight: bold;">REJECTED</span></p>
                        <p>Reason: ${reason || 'Please contact support for more information'}</p>
                    </div>
                    
                    <p>If you believe this is an error, please contact our support team.</p>
                    <p><a href="https://sikapa.com/support" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contact Support</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2026 SIKAPA. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Rejection email sent successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send withdrawal approved notification
router.post('/withdrawal-approved', async (req, res) => {
    try {
        const { userEmail, userName, amount, withdrawalId, mobile } = req.body;

        if (!transporter) {
            return res.status(400).json({ error: 'Email service not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@sikapa.com',
            to: userEmail,
            subject: '✅ Your Withdrawal has been Approved!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #667eea;">Withdrawal Approved</h2>
                    <p>Hi ${userName},</p>
                    <p>Your withdrawal request has been approved and processed!</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Withdrawal Details:</strong></p>
                        <p>Amount: <strong>₵ ${amount}</strong></p>
                        <p>Withdrawal ID: ${withdrawalId}</p>
                        <p>Mobile: ${mobile}</p>
                        <p>Status: <span style="color: #11998e; font-weight: bold;">APPROVED</span></p>
                    </div>
                    
                    <p>The funds will be transferred to your mobile money account shortly. Please allow 2-5 minutes for the transaction to complete.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2026 SIKAPA. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Withdrawal approval email sent successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send welcome email
router.post('/welcome', async (req, res) => {
    try {
        const { userEmail, userName, referralCode } = req.body;

        if (!transporter) {
            return res.status(400).json({ error: 'Email service not configured' });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@sikapa.com',
            to: userEmail,
            subject: '🎉 Welcome to SIKAPA!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #667eea;">Welcome to SIKAPA! 💎</h2>
                    <p>Hi ${userName},</p>
                    <p>Thank you for joining SIKAPA. We're excited to have you on board!</p>
                    
                    <h3>Get Started:</h3>
                    <ul>
                        <li><strong>Make Your First Deposit:</strong> Start earning rewards immediately</li>
                        <li><strong>Claim Daily Tiers:</strong> Earn ₵0.5 to ₵100 per day</li>
                        <li><strong>Invite Friends:</strong> Earn 5% commission from their deposits</li>
                    </ul>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Your Referral Code:</strong></p>
                        <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea;">${referralCode}</p>
                        <p>Share this code with friends to earn commissions!</p>
                    </div>
                    
                    <p><a href="https://sikapa.com/dashboard" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">© 2026 SIKAPA. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Welcome email sent successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
