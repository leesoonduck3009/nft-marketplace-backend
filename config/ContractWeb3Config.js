require('dotenv').config();
const ethers = require('ethers');
const abiMarketplace = require('../contract/MarketplaceAbi.json')

const BASE_PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_BSC_BLOCKCHAIN = process.env.API_URL_BLOCKCHAIN;
const bscProvider = new ethers.JsonRpcProvider(API_BSC_BLOCKCHAIN);
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const baseSigner = new ethers.Wallet( BASE_PRIVATE_KEY, bscProvider);
const contractMarketplaceCallContract = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,baseSigner);
const contractMarketplaceInstanceListener = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,  bscProvider);

module.exports = {abiMarketplace,bscProvider,baseSigner,contractMarketplaceCallContract,contractMarketplaceInstanceListener}
