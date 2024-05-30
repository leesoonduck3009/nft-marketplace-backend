const FirebaseTable = require("../ultil/FirebaseTable");
const {db} = require('../config/FirebaseConfig');
const { setDoc, doc, getDoc, updateDoc } = require("firebase/firestore");
const { default: Moralis } = require('moralis');

const createWallet = async(req,res) =>{
    try{
        const data =req.body;
        const wallet = await getDoc(doc(db,FirebaseTable.WALLET,data.address))
        console.log(wallet.data());
        if(wallet.data() ===null || wallet.data() === undefined)
        {
            const respone = await Moralis.EvmApi.balance.getNativeBalance({
                "chain": data.chain === 'bsc' ?  "0x61": '0xaa36a7',
                "address": data.address
                });
            await setDoc(doc(db, FirebaseTable.WALLET, data.address), {
                accountId: data.accountId,
                chain: data.chain,
                numOfCoin: respone.jsonResponse.balance
                });
        }
        return res.status(200).json({data: "Success", error: null})

    }
    catch(e){
        console.log("error: ", e);
        res.status(500).json({data: null, error: "Server error"});
    }
}
const getBalanceWallet = async(req,res)=>{
    try{
        const data = req.body
        const respone = await Moralis.EvmApi.balance.getNativeBalance({
            "chain": data.chain === 'bsc' ?  "0x61": '0xaa36a7',
            "address": data.address
          });
        const docRef = await updateDoc(doc(db, FirebaseTable.WALLET, data.address), {
            numOfCoin: respone.jsonResponse.balance
          });
          return res.status(200).json({data: respone.jsonResponse.balance, error: null})
    }
    catch(e){
        return res.status(500).json({data: null, error: "Server error"})
    }
}
module.exports = {createWallet,getBalanceWallet}
