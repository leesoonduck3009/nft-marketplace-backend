const express = require('express');
const router = express.Router();
const {createWallet,getBalanceWallet} = require('../controller/WalletController');
router.route('/get-balance').get(getBalanceWallet);
router.route('/create-wallet').post(getBalanceWallet);
module.exports = router;
