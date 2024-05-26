require('dotenv').config;
const { setDoc, collection, addDoc } = require('firebase/firestore');
const {encrypt, decrypt} = require('../config/HashingData')
const {db} = require('../config/FirebaseConfig');
const FirebaseTable = require('../ultil/FirebaseTable');
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
const addPrivateKeyToAccount = async(req,res)=>{
    try{
        const data = req.body;
        const hashedPrivateKey = encrypt(data.privateKey,KEY_PRIVATE_HASH);
        const docRef = await addDoc(collection(db, FirebaseTable.PRIVATE_KEY), {
            privateKey: hashedPrivateKey,
            accountId: data.accountId,
            walletAddress: data.walletAddress
          });
        return res.status(200).json({data: "Add private key success", error: null});
    }
    catch(e){
        console.log(e);
        return res.status(500).json({data: null, error: "Server is error"});
    }
    
}
const decrypPrivateKey = (req,res)=>{
    const privatekey = decrypt(req.body.privateKey, KEY_PRIVATE_HASH);
    res.json({data: privatekey})
}
module.exports = {addPrivateKeyToAccount,decrypPrivateKey}
