const express = require('express');
const router = express.Router();
const {ađdTransactionHistory} = require('../controller/TransactionHistory')
router.route('/add').post(ađdTransactionHistory);
module.exports = router;
