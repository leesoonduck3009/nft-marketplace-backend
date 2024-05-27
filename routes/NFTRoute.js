const express = require('express');
const router = express.Router();
const {getNFTOwnByProject, getNFTOwnByWallet,getHello} = require('../controller/NFTController')

router.route("/get-balance").get(getNFTOwnByProject);
router.route('/hello').post(getHello);
router.route("/:id").get(getNFTOwnByWallet);
module.exports = router;