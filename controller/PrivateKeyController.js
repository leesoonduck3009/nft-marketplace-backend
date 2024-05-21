const { setDoc, collection, addDoc } = require('firebase/firestore');
const {encrypt} = require('../config/HashingData')
const {db} = require('../config/FirebaseConfig');
const FirebaseTable = require('../ultil/FirebaseTable');
const addPrivateKeyToAccount = async(req,res)=>{
    try{
        const data = req.body;
        const hashedPrivateKey = encrypt(data.privateKey);
        const docRef = await addDoc(collection(db, FirebaseTable.PRIVATE_KEY), {
            private_key: hashedPrivateKey,
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
module.exports = {addPrivateKeyToAccount}
