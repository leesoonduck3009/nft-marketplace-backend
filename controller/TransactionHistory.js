const {abiMarketplace,bscProvider, contractMarketplaceCallContract} = require('../config/ContractWeb3Config');
const KEY_PRIVATE_HASH = process.env.KEY_PRIVATE_HASH
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const FirebaseTable = require('../ultil/FirebaseTable');
const { doc, collection, where, query, getDocs, limit, addDoc, setDoc, getDoc, updateDoc } = require('firebase/firestore')
const { default: Moralis } = require('moralis')
const {db} = require('../config/FirebaseConfig')
const {decrypt} = require('../config/HashingData');
const addTransactionHistory = async (req,res)=>{
    const data =req.body;
    try{

        // get private key
        const privateKey = await decodePrivateKey(data.accountId, data.sellerAddress);
        // bid auction on block chain
        const signer = new ethers.Wallet(privateKey, bscProvider);
        const contractInstance = new ethers.Contract( MARKETPLACE_ADDRESS, abiMarketplace.abi,signer);
        const auctionRef = doc(db,FirebaseTable.AUCTION,data.auctionId);
        const auction = await getDoc(auctionRef);
        try{
            // get auction data
            const auctionData = auction.data();
            if(!auctionData.isSold && !auctionData.isCancel ){
                // get coin of wallet
                const coin = await Moralis.EvmApi.balance.getNativeBalance({
                    "chain": chain === 'BSC' ? "0x61": "0xaa36a7",
                    "address": data.buyer
                });
                    // check balance of coin    
                    if(coin.balance>=data.newPrice){
                        const options = { value: ethers.parseEther(data.newPrice)};
                        if(auctionData.buyerAddress!=='0x0')
                        {
                            await contractInstance.BiddingAuction(auctionData.auctionId,data.newPrice,options);
                        }
                        else{
                            await contractInstance.FirstBiddingAuction(auctionData.auctionId);
                        }
                        await addDoc(collection(db,FirebaseTable.TRANSACTION),{
                            auctionId: data.auctionId,
                            lastPrice: auctionData.price,
                            lastBuyer: auctionData.buyer,
                            newPrice: data.newPrice,
                            newBuyer: data.newBuyer
                        });
                        await setDoc(doc(db,FirebaseTable.AUCTION,data.auctionId),{
                            price: data.newPrice
                        });
                        return res.status(200).json({data: "Success", error: null})
                    }
                    else{
                        return res.status(500).json({data: null, error: "you don't have enough coin"});
                    }
                }
            }    
            catch(e){
                console.log("error", e);
                res.status(500).json({data: null, error: e})
            }
        }
    catch(e){
        console.log("error", e);
        res.status(500).json({data: null, error: "server error"})
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
module.exports = {addTransactionHistory}
