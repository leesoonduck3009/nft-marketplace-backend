const express = require('express');
const router = express.Router();
const {addTransactionHistory} = require('../controller/TransactionHistory')
router.route('/add').post(addTransactionHistory);
module.exports = router;
