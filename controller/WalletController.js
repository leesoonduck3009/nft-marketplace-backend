require('dotenv').config();
const ethers = require('ethers');
const FirebaseTable = require("../ultil/FirebaseTable");
const {db} = require('../config/FirebaseConfig');
const { setDoc, doc, getDoc, updateDoc, query, collection, where, limit ,getDocs} = require("firebase/firestore");
const { default: Moralis } = require('moralis');
const {decrypt} = require('../config/HashingData');
const API_BSC_BLOCKCHAIN = process.env.API_BSC_BLOCKCHAIN;
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
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
        console.log('hello')
        const docRef = await updateDoc(doc(db, FirebaseTable.WALLET, data.address), {
            numOfCoin: respone.jsonResponse.balance
          });
          return res.status(200).json({data: respone.jsonResponse.balance, error: null})
    }
    catch(e){
        return res.status(500).json({data: null, error: "Server error"})
    }
}
const TransferCoin = async(req, res)=>{
    try{
    // get PrivateKey
    const data = req.body;
    console.log(data.amount);
    const privateKey = await decodePrivateKey(data.accountId, data.from);
    const bscProvider = new ethers.JsonRpcProvider(API_BSC_BLOCKCHAIN);
    const wallet = new ethers.Wallet(privateKey, bscProvider);
    console.log(typeof data.amount);
    const amountInWei = ethers.parseEther(data.amount);
    const tx = {
        to: data.to,
        value: amountInWei
    }
    await wallet.sendTransaction(tx);
    // update data respone from
    const responeFrom = await Moralis.EvmApi.balance.getNativeBalance({
        "chain":  "0x61",
        "address": data.from
      });
    await updateDoc(doc(db, FirebaseTable.WALLET, data.from), {
        numOfCoin: responeFrom.jsonResponse.balance
      });
    // update data respone to
    const responeTo = await Moralis.EvmApi.balance.getNativeBalance({
        "chain":   "0x61",
        "address": data.to
    });
    console.log(responeTo.jsonResponse.balance);
    console.log(responeFrom.jsonResponse.balance);

    await updateDoc(doc(db, FirebaseTable.WALLET, data.to), {
            numOfCoin: responeTo.jsonResponse.balance
        });
    res.status(200).json({data: "Success", error: null});
    }
    catch(e){
        console.log(e);
        res.status(500).json({data: null, error: "Transfer coin failed"});
    }
}
const decodePrivateKey = async(accountId,address)=>{
    const q = query(collection(db, FirebaseTable.PRIVATE_KEY), where('accountId', '==', accountId), where('walletAddress', '==', address), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        console.log('No matching documents.');
      }
    const dataPrivateKeyRes = querySnapshot.docs[0].data();
    console.log(dataPrivateKeyRes)
    // decode private key
    const privateKey = decrypt(dataPrivateKeyRes.privateKey,KEY_PRIVATE_HASH);
    return privateKey;
}
module.exports = {createWallet,getBalanceWallet,TransferCoin}
