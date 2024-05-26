const express = require('express');
const router = express.Router();
const {addPrivateKeyToAccount, decrypPrivateKey} = require('../controller/PrivateKeyController')
router.route('/create').post(addPrivateKeyToAccount);4
router.route('/test-decrypt').post(decrypPrivateKey);

module.exports = router;