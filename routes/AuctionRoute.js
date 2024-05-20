const express = require('express');
const router = express.Router();
const {cancelAuction,createAuction,stopAuction,bidAuction} =require('../controller/AuctionController')

router.route('/bid-auction').post(bidAuction);
router.route('/start').post(createAuction);
router.route('/stop').post(stopAuction);
router.route('/cancel').post(cancelAuction);

module.exports = router;