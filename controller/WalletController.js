const FirebaseTable = require("../ultil/FirebaseTable");
const {db} = require('../config/FirebaseConfig');
const { setDoc } = require("firebase/firestore");
const createWallet = async(req,res) =>{
    try{
        const data =req.body;
        const respone = await Moralis.EvmApi.balance.getNativeBalance({
            "chain": data.chain === 'bsc' ?  "0x61": '0xaa36a7',
            "address": data.address
          });
        const docRef = await setDoc(doc(db, FirebaseTable.WALLET, data.address), {
            accountId: data.accountId,
            chain: data.chain,
            numOfCoin: respone.balance
          });

        return res.status(200).json({data: "success", error: null})
    }
    catch(e){
        console.log("error: ", e);
        res.status(500).json({data: null, error: "Server error"});
    }
}
const getBalanceWallet = async(req,res)=>{

}
module.exports = {createWallet,getBalanceWallet}
