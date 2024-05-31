const express = require('express');
const router = express.Router();
const {createWallet,getBalanceWallet,TransferCoin} = require('../controller/WalletController');
router.route('/get-balance').post(getBalanceWallet);
router.route('/create-wallet').post(createWallet);
router.route('/send-transaction').post(TransferCoin);
module.exports = router;
