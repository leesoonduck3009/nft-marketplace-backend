require('dotenv').config();
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const FirebaseTable = require('../ultil/FirebaseTable');
const { doc, collection, where, query, getDocs, limit, addDoc, setDoc, getDoc, updateDoc } = require('firebase/firestore')
const { default: Moralis } = require('moralis')
const {db} = require('../config/FirebaseConfig')
const {decrypt} = require('../config/HashingData');
const ethers = require('ethers');
const API_BSC_BLOCKCHAIN = process.env.API_BSC_BLOCKCHAIN;
const {contractMarketplaceInstanceListener, abiMarketplace,bscProvider, contractMarketplaceCallContract, nftERC721Abi} = require('../config/ContractWeb3Config');
const MakeAnItemInMarketplace = async(req,res)=>{
    try{
    // get PrivateKey
    const data = req.body;
    const privateKey = await decodePrivateKey(data.accountId, data.walletAddress);
    // Create provider and signer
    console.log(API_BSC_BLOCKCHAIN);
    const bscProvider = new ethers.JsonRpcProvider(API_BSC_BLOCKCHAIN);
    const signer = new ethers.Wallet(privateKey, bscProvider);
    const contractMarketplaceInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
    const contractNFTInstance = new ethers.Contract(data.nftAddress, nftERC721Abi,signer);
    // request accept the marketplace is can trad the nft
    const isApprovalOfNFT = await contractNFTInstance.isApprovedForAll(data.walletAddress, MARKETPLACE_ADDRESS);
    if(!isApprovalOfNFT)
        await contractNFTInstance.setApprovalForAll(MARKETPLACE_ADDRESS, true);
    const marketplaceTradeId =  await contractMarketplaceInstance.makeItem(data.nftAddress,data.tokenId, data.price);
    // make a contract 

    res.status(200).json({data: "Success", error:null})
    }
    catch(e){
        console.log(e);
        res.status(500).json({data: null, error: "server error"})
    }
}   
const PurchaseItem = async(req,res)=>{
    try{
        // get PrivateKey
        const data = req.body;
        const privateKey = await decodePrivateKey(data.accountId, data.walletAddress);    
        // Create provider and signer
        const signer = new ethers.Wallet(privateKey, bscProvider);
        const contractMarketplaceInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
        // check number of coin in wallet
        const respone = await Moralis.EvmApi.balance.getNativeBalance({
            "chain": data.chain === 'bsc' ?  "0x61": '0xaa36a7',
            "address": data.walletAddress
          });
        const item = await getDoc(doc(db,FirebaseTable.MARKETPLACE,data.marketplaceId))
        const itemData =item.data();
        console.log(itemData)
        const walletBalance = respone.jsonResponse.balance;
        console.log(`wallet balance: ${walletBalance}`)
        if((walletBalance/Math.pow(10,18))> (itemData.price/Math.pow(10,18)) && !itemData.isSold && !item.isCancel){
            // trade
            const options = { value: itemData.price };
            const marketplaceTradeId =  await contractMarketplaceInstance.purchaseItem(data.itemId,options);
            await updateDoc(doc(db,FirebaseTable.MARKETPLACE,data.marketplaceId),{
                buyer: data.walletAddress,
                isSold: true
            })
            return res.status(200).json({data: "success", error: null});
        }
        else{
            return res.status(404).json({data: null, error: "not have enough coin"})
        }
    }
    catch(e){
        console.log("error", e);
        return res.status(500).json({data: null, error: "not have enough coin"})

    }
}
const listenMakeItem = async()=>{
    contractMarketplaceInstanceListener.addListener("Offered",async (itemId,nft,tokenId,price,seller)=>{
        try{
            const docRef = await addDoc(collection(db,FirebaseTable.MARKETPLACE),{
                price: price,
                isSold: false,
                isCancel: false,
                nftAddress: nft,
                tokenId: tokenId,
                itemId: itemId,
                seller: seller,
                buyer: null,
                chain: 'bsc'
            })
        }
        catch(e){
            console.log("error: ", e);
        }
    });
}
const listenBoughtItem = ()=>{
    contractMarketplaceInstanceListener.addListener("Bought",async (itemId,nft,tokenId,price,seller,buyer)=>{
        try{
        const q = query(collection(db,FirebaseTable.MARKETPLACE), where('itemId', '==', itemId));
        const querySnapshot = await getDocs(q)
        if(!querySnapshot.empty){
            const item = querySnapshot.docs[0];
            await updateDoc(doc(db,FirebaseTable.MARKETPLACE,item.id),{
                isSold: true,
                buyer: buyer
            });
        }
        else{
            console.log("No matching documents.");
        }
        // update wallet seller
        const responeSeller = await Moralis.EvmApi.balance.getNativeBalance({
            "chain":   "0x61",
            "address": seller
          });
        const docRefSeller = await updateDoc(doc(db, FirebaseTable.WALLET, seller), {
            numOfCoin: responeSeller.jsonResponse.balance
          });
        // update wallet buyer
        const responeBuyer = await Moralis.EvmApi.balance.getNativeBalance({
            "chain":   "0x61",
            "address": buyer
          });
        const docRefBuyer = await updateDoc(doc(db, FirebaseTable.WALLET, buyer), {
            numOfCoin: responeBuyer.jsonResponse.balance
          });       
        }
        catch(e){
              console.log("error: ", e);
          }
    })
}
const listenCancelItem = ()=>{
    contractMarketplaceInstanceListener.addListener('Cancel', async(itemId,nft,tokenId,seller)=>{
        const q = query(collection(db,FirebaseTable.MARKETPLACE), where('itemId', '==', itemId));
        const querySnapshot = await getDocs(q)
        if(!querySnapshot.empty){
            const item = querySnapshot.docs[0];
            await updateDoc(doc(db,FirebaseTable.MARKETPLACE,item.id),{
                isCancel: true,
                buyer: buyer
            });
        }
        else{
            console.log("No matching documents.");
        }
    })
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
const CancelItem = async(req,res)=>{
    // get PrivateKey
    const data = req.body;
    const privateKey = await decodePrivateKey(data.accountId, data.walletAddress); 
    // Create provider and signer
    const signer = new ethers.Wallet(privateKey, bscProvider);
    const contractMarketplaceInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
    const marketplaceTradeId =  await contractMarketplaceInstance.cancelItem(data.itemId);
    await updateDoc(doc(db,FirebaseTable.MARKETPLACE,req.marketplaceId),{
        isCancel: true,
    })
}

module.exports = {listenMakeItem, PurchaseItem, MakeAnItemInMarketplace, listenBoughtItem, CancelItem}