const { default: Moralis } = require("moralis")
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
        res.status(200).json({data: response.result, error: null})
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
module.exports = {getNFTOwnByProject, getNFTOwnByWallet}