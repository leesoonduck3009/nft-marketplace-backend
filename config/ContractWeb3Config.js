require('dotenv').config();
const ethers = require('ethers');
const BASE_PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_BSC_BLOCKCHAIN = process.env.API_URL_BLOCKCHAIN;
const baseProvider = new ethers.JsonRpcProvider(API_URL_BLOCKCHAIN);
