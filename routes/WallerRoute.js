const express = require('express');
const router = express.Router();
const {createWallet,getBalanceWallet} = require('../controller/WalletController');
router.route('/get-balance').post(getBalanceWallet);
router.route('/create-wallet').post(createWallet);
module.exports = router;
