const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); 
// ✅ FIXED: Destructure 'protect' and 'admin' from the middleware object
const { protect, admin } = require('../middleware/authMiddleware'); 
const paymentController = require('../controllers/paymentController');

// 🔓 User Route: Submit Receipt
// We use 'protect' here to ensure the user is logged in
router.post('/submit', 
    protect, 
    upload.single('screenshot'), 
    paymentController.uploadReceipt
);

// 🔐 Admin Routes: Manage Payments
// We use 'protect' THEN 'admin' to ensure the user is an authorized admin
router.get('/pending', protect, admin, paymentController.getPendingPayments);
router.patch('/approve/:paymentId', protect, admin, paymentController.approvePayment);

module.exports = router;