const {  collection, where, getDocs, query } = require("firebase/firestore");
const { default: Moralis } = require("moralis");
const FirebaseTable = require("../ultil/FirebaseTable");
const { db } = require("../config/FirebaseConfig");
require('dotenv').config();
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const getNFTOwnByProject = async(req,res)=>{
    try{
        const response = await Moralis.EvmApi.nft.getWalletNFTs({
            "chain": '0x61',
            "format": "decimal",
            "mediaItems": false,
            "address": MARKETPLACE_ADDRESS
          });
          var count = 0;
          const result = [];
          for (const item of response.result) {
            console.log(item.tokenAddress.checksum);
            const q = query(
              collection(db, FirebaseTable.MARKETPLACE),
              where("nftAddress", "==", item.tokenAddress.lowercase),
              where("tokenId", "==", item.tokenId),
              where("isSold", "==", false),
              where("isCancel", "==", false)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const d = snapshot.docs[0].data();
              const temp = {
                ...item._data,
                price: d.price,
                itemId: d.itemId,
                seller: d.seller
              }
              result.push(temp);
            }
          }
        res.status(200).json({data: result, error: null})
    }
    catch(e){
        console.log(e);
        res.status(500).json({data: null, error: "Server error"})

    }
}
const getNFTOwnByWallet = async(req,res)=>{
    try{
        const wallet =req.params.id;
        const response = await Moralis.EvmApi.nft.getWalletNFTs({
            "chain": '0x61',
            "format": "decimal",
            "mediaItems": false,
            "address": wallet
          });
        res.status(200).json({data: response.result.filter(item=>item.contractType==='ERC721'), error: null})
    }
    catch(e){
        console.log(e);
        res.status(500).json({data: null, error: "Server error"})

    }
}
const getHello = (req,res)=>{
  console.log(req.body);
  res.status(200).json({data: req.body});
}
module.exports = {getNFTOwnByProject, getNFTOwnByWallet,getHello}