const {abiMarketplace,bscProvider, contractMarketplaceCallContract} = require('../config/ContractWeb3Config');
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const FirebaseTable = require('../ultil/FirebaseTable');
const { doc, collection, where, query, getDocs, limit, addDoc, setDoc, getDoc, updateDoc } = require('firebase/firestore')
const { default: Moralis } = require('moralis')
const {decrypt} = require('../config/HashingData');
const addTransactionHistory = async (req,res)=>{
    const data =req.body;
    const 
} 
const decodePrivateKey = async(accountId,address)=>{
    const q = query(collection(db, FirebaseTable.PRIVATE_KEY), where('accountId', '==', accountId), where('walletAddress', '==', address), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        console.log('No matching documents.');
        return res.status(404).json({data: null, error: "not found wallet address"});
      }
    const dataPrivateKeyRes = querySnapshot.docs[0].data();
    // decode private key
    const privateKey = decrypt(dataPrivateKeyRes.privateKey,KEY_PRIVATE_HASH);
    return privateKey;
}
module.exports = {addTransactionHistory}
