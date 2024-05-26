const express = require('express');
const router = express.Router();
const {getNFTOwnByProject} = require('../controller/NFTController')

router.route("/get-balance").get(getNFTOwnByProject);

module.exports = router;