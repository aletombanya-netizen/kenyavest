const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllTransactions,
  updateTransactionStatus,
  updateUserBalance,
  getContactMessages,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.route('/users').get(protect, admin, getAllUsers);
router.route('/users/:id/balance').put(protect, admin, updateUserBalance);
router.route('/transactions').get(protect, admin, getAllTransactions);
router.route('/transactions/:id').put(protect, admin, updateTransactionStatus);
router.route('/contacts').get(protect, admin, getContactMessages);

module.exports = router;
