const express = require('express');
const router = express.Router();
const {PurchaseItem, MakeAnItemInMarketplace, CancelItem} = require('../controller/MarkeplaceController')

router.route('/make-item').post(MakeAnItemInMarketplace);
router.route('/purchase-item').post(PurchaseItem);
router.route('/cancel-item').post(CancelItem);
module.exports = router;