const ethers = require('ethers');
require('dotenv').config();
const API_BSC_BLOCKCHAIN = process.env.API_BSC_BLOCKCHAIN;
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH


// const decodePrivateKey = async(accountId,address)=>{
//     const q = query(co(db, FirebaseTable.PRIVATE_KEY), where('accountId', '==', accountId), where('walletAddress', '==', address), limit(1));
//     const querySnapshot = await getDocs(q);
//     if (querySnapshot.empty) {
//         console.log('No matching documents.');
//       }
//     const dataPrivateKeyRes = querySnapshot.docs[0].data();
//     console.log(dataPrivateKeyRes)
//     // decode private key
//     const privateKey = decrypt(dataPrivateKeyRes.privateKey,KEY_PRIVATE_HASH);
//     return privateKey;
// }
module.exports = {};