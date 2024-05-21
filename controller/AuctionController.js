require('dotenv').config();
const {db} = require('../config/FirebaseConfig')
const {contractMarketplaceInstanceListener, contractMarketplaceCallContract} = require('../config/ContractWeb3Config')
const { doc, collection, where, query, getDocs, limit, addDoc, setDoc, getDoc, updateDoc } = require('firebase/firestore')
const {encrypt, decrypt} = require('../config/HashingData');
const ethers = require('ethers');
const {abiMarketplace,bscProvider, contractMarketplaceCallContract} = require('../config/ContractWeb3Config');
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const FirebaseTable = require('../ultil/FirebaseTable');
const { default: Moralis } = require('moralis');
const createAuction = async(req,res)=>{
    const data = req.body;
    try{

    // get private key
    const privateKey = await decodePrivateKey(data.accountId, data.sellerAddress);
    
    // create auction on block chain
    const signer = new ethers.Wallet(privateKey, bscProvider);
    const contractInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
    const auctionId = 0; // await contractInstance.startAuctionNFT(data.nftAddress, data.tokenId, data.price);
    
    // create auction on firebase
    const docAuctionRef = doc(collection(db,FirebaseTable.AUCTION));
    const docAuctionRes = await setDoc(docAuctionRef,{
        auctionId: auctionId,
        accountId:data.accountId,
        price: data.price,
        nftAddress: data.nftAddress,
        isSold: false,
        isCancel: false,
        tokenId: data.tokenId, 
        nameNFTL: data.price,
        NFTUrl: data.NFTUrl,
        sellerAddress: data.sellerAddress,
        buyerAddress: "0x0"
    });
        return res.status(200).json({data: docAuctionRes.data(), error: null});
    }
    catch(e){
        res.status(500).json({data: null, error: "Server error"});
        console.log(e);
    }
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
const cancelAuction = async(req,res)=>{
    const data = req.body;
    try{

    // get private key
    const privateKey = await decodePrivateKey(data.accountId, data.sellerAddress);
    // create auction on block chain
    const signer = new ethers.Wallet(privateKey, bscProvider);
    const contractInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
    // find auction
    const auctionRef = doc(db,FirebaseTable.AUCTION,data.auctionId);
    const auction = await getDoc(auctionRef);
    const auctionData = auction.data();
    // cancel auction on block chain

    if(!auctionData.isSold && !auctionData.isCancel ){
        if(auctionData.buyerAddress!=='0x0')
        {
            const coin = await Moralis.EvmApi.balance.getNativeBalance({
                "chain": chain === 'BSC' ? "0x61": "0xaa36a7",
                "address": data.owner
              });
            if(coin >= (auction.price*0.2) ){
                try{
                    const options = { value: ethers.parseEther(auction.price*0.21)};
                    await contractInstance.cancelAuctionFrom(auctionData.auctionId,options);
                }
                catch(e){
                    console.log("error transaction: ", e);
                    return res.status(500).json({data: null, error: "Transaction failed"});
                }
            }
            else{
                return res.status(500).json({data: null, error: "Not have enough coin"})
            }
        }
        else{
            const options = { value: ethers.parseEther(0)};
            await contractInstance.cancelAuctionFrom(auctionData.auctionId,options);
        }
        // update on firebase 
        await updateDoc(auctionRef, {
            isCancel: true
          });
        return res.status(200).json({data: "Cancel Success", error: null});
    }
    
    }
    catch(e){
        res.status(500).json({data: null, error: "Server error"});
        console.log("error: ", e);
    }
}
const stopAuction = async(req,res)=>{
    const data = req.body;
    try{

    // get private key
    const privateKey = await decodePrivateKey(data.accountId, data.sellerAddress);
    // create auction on block chain
    const signer = new ethers.Wallet(privateKey, bscProvider);
    const contractInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
    // find auction
    const auctionRef =doc(db,FirebaseTable.AUCTION,data.auctionId);
    const auction = await getDoc(auctionRef);
    const auctionData = auction.data();
    // stop auction on block chain
    if(!auctionData.isSold && !auctionData.isCancel ){
        if(auctionData.buyerAddress!=='0x0')
        {
            try{
                await contractMarketplaceCallContract.sellNFTToLastPerson(auctionData.auctionId);
            }
            catch(e){
                console.log("error transaction: ", e);
                return res.status(500).json({data: null, error: "Transaction failed"});
            }
        }
        else{
            try{
                await contractMarketplaceCallContract.transferNFTBackToSeller(auctionData.auctionId);
            }
            catch(e){
                console.log("error transaction: ", e);
                return res.status(500).json({data: null, error: "Transaction failed"});
            }
        }
        // update sold on firebase
        await updateDoc(auctionRef,{
            isSold: true
        });
        return res.status(200).json({data: "Stop Success", error: null});
    }
    
    }
    catch(e){
        res.status(500).json({data: null, error: "Server error"});
        console.log("error: ", e);
    }
}

const listenCancelRequestAuction = () =>{
    contractMarketplaceInstanceListener.addListener('CancelAuctionBuy',async(bidTransactionId,nft,tokenId,price,compensation,seller,lastBuyer,event)=>{
        console.log('cancelAuctionBuyer');
        if(lastBuyer!=='0x0'){
            const moneyBuyer = await Moralis.EvmApi.balance.getNativeBalance({
                "chain": "0x61",
                "address": lastBuyer
              });
            const walletRefBuyer = doc(db,FirebaseTable.WALLET, lastBuyer);
            await updateDoc(walletRefBuyer, {
                numOfCoin: moneyBuyer.balance
            });
            
        }
        const moneySeller = await Moralis.EvmApi.balance.getNativeBalance({
            "chain":  "0x61",
            "address": seller
          });
        const walletRefSeller = doc(db,FirebaseTable.WALLET, seller);
          await updateDoc(walletRefSeller, {
              numOfCoin: moneySeller.balance
          });
    })
}
const listenAuctionStartRequestAuction = async() =>{
    contractMarketplaceInstanceListener.addListener('AuctionStarted',(bidTransactionId,nft,tokenId,price,seller,event)=>{
        console.log(`auction ${bidTransactionId}`);
        
    })
}
const listenAuctionBiddingRequestAuction = async() =>{
    contractMarketplaceInstanceListener.addListener('AuctionBidding',async(bidTransactionId,nft,tokenId,oldPrice,newPrice,seller, buyer,event)=>{
        const moneyBuyer = await Moralis.EvmApi.balance.getNativeBalance({
            "chain": "0x61",
            "address": buyer
          });
        const walletRefBuyer = doc(db,FirebaseTable.WALLET, buyer);
        await updateDoc(walletRefBuyer, {
            numOfCoin: moneyBuyer.balance
        });
    })
}
const listenSoldRequestAuction = async() =>{
    contractMarketplaceInstanceListener.addListener('soldNFT',async(bidTransactionId,nft,tokenId,price,compensation,seller,lastBuyer,event)=>{
        const moneyBuyer = await Moralis.EvmApi.balance.getNativeBalance({
            "chain": "0x61",
            "address": buyer
          });
        const walletRefBuyer = doc(db,FirebaseTable.WALLET, seller);
        await updateDoc(walletRefBuyer, {
            numOfCoin: moneyBuyer.balance
        });
    })
}
module.exports = {createAuction, cancelAuction, stopAuction,listenCancelRequestAuction,listenAuctionStartRequestAuction,listenAuctionBiddingRequestAuction, listenSoldRequestAuction}