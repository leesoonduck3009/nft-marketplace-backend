const express = require('express');
const router = express.Router();
const {addPrivateKeyToAccount} = require('../controller/PrivateKeyController')
router.route('/create').post(addPrivateKeyToAccount);
module.exports = router;