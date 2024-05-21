// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ReentrancyGuard, Ownable{
    ////// Struct 
    struct BidTransaction {
        uint256 bidTransactionId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        address payable buyer;
        bool sold;
        bool isCancel;
    }
    ////// Variable
    address payable public immutable ownerAddress;
    uint256 public immutable feePercent;
    uint256 public immutable minumunBidUpPercent;
    uint256 public immutable compensationFeePercent;
    uint256 public transactionCount;
    
    mapping (uint256 => BidTransaction) public transactionRegistry;
    ////// Event
    event CancelAuctionBuy(
        uint256 bidTransactionId,
        address indexed nft,
        uint tokenId,
        uint price,
        uint256 compensation,
        address indexed seller,
        address indexed buyer
    );
    event AuctionStarted(
        uint256 bidTransactionId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );
    event AuctionBidding(
        uint256 bidTransactionId,
        address indexed nft,
        uint tokenId,
        uint oldPrice,
        uint newPrice,
        address indexed seller,
        address indexed buyer
    );
    event soldNFT(
        uint256 bidTransactionId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );
    event cancelAuction(
        uint256 bidTransactionId,
        address indexed nft,
        uint tokenId,
        address indexed lastBuyer,
        address indexed seller,
        uint compensationPrice
    );
    ///// modifier 
    modifier checkItemExist(uint256 _transactionId){
        require(_transactionId >= 0 && _transactionId <= transactionCount, "item doesn't exist");
        _;
    }
    modifier checkItemSoldOrCancel(uint256 _transactionId){
        require(!transactionRegistry[_transactionId].isCancel, "transaction have been cancel");
        require(!transactionRegistry[_transactionId].sold, "item already sold");
        _;
    }
    ///// Constructor
    constructor(uint256 _feePercent, uint256 _minumunBidUpPercent, uint256 _compensationFeePercent) Ownable(msg.sender)
    {
        ownerAddress = payable(msg.sender);
        feePercent = _feePercent;
        compensationFeePercent = _compensationFeePercent;
        minumunBidUpPercent = _minumunBidUpPercent;
    }
    function startAuctionNFT(IERC721 _nft, uint256 _tokenId, uint256 _price) external {
        require(_price > 0, "Price must be greater than zero");
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        transactionRegistry[transactionCount] = BidTransaction (
            transactionCount, _nft, _tokenId, _price, payable(msg.sender),
            payable(address(0)), false, false
        );
        emit AuctionStarted(
            transactionCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
        transactionCount++;
    }
    function transferMoneyToLastBuyer(address payable _buyer, uint256 _totalPrice) internal  {
        require(_buyer != address(0), "Invalid buyer address");
        require(_totalPrice > 0, "Total price must be greater than 0");
        // Kiểm tra số dư của người mua trước khi chuyển tiền
        require(address(this).balance >= _totalPrice, "Insufficient contract balance");

        // Chuyển tiền cho người mua
        _buyer.transfer(_totalPrice);
    }
    function FirstBiddingAuction(uint256 _transactionId) external payable checkItemExist(_transactionId) checkItemSoldOrCancel(_transactionId) 
    {
        BidTransaction storage transaction = transactionRegistry[_transactionId];
        require(transaction.buyer == address(0x0), "Not first auction");
        require(msg.value >= transaction.price, "Not enough value");
        transaction.buyer = payable (msg.sender);
        payable (msg.sender).transfer(msg.value-transaction.price);
    }
    function BiddingAuction(uint256 _transactionId,uint256 _price) external payable checkItemExist(_transactionId) checkItemSoldOrCancel(_transactionId)
    {
        uint256 _minumunNewPrice = getMinumumNewPrice(_transactionId);
        require(msg.value >= _minumunNewPrice, "not enough ether to bid item price and market fee");
        BidTransaction storage transaction = transactionRegistry[_transactionId];
        require(!transaction.isCancel, "transaction have been cancel");
        require(!transaction.sold, "item already sold");
        ///// transfer money to last buyer
        transferMoneyToLastBuyer(transaction.buyer,transaction.price);
        // emit auction event 
        emit AuctionBidding(_transactionId, 
            address(transaction.nft), 
            transaction.tokenId, 
            transaction.price, _price, 
            transaction.seller, msg.sender);
        /// update buyer and price
        transaction.buyer = payable (msg.sender);
        transaction.price = _price;
        /// transfer money back for buyer if higher
        payable (msg.sender).transfer(msg.value-_price);
    }
    // sold NFT
    function sellNFTToLastPerson(uint256 _transactionId) external onlyOwner checkItemExist(_transactionId) checkItemSoldOrCancel(_transactionId)
    {
        BidTransaction storage transaction = transactionRegistry[_transactionId];
        require(transaction.buyer != address(0x0),"dont have buyer");
        uint256 totalAmount = getTotalPrice(_transactionId);
        /// change to transaction success
        transaction.sold = true;
        /// transfer money from contract to seller
        transaction.seller.transfer(transaction.price-getCostPay(_transactionId));
        /// transfer percent money to owner
        ownerAddress.transfer(totalAmount-transaction.price);
        /// transfer NFT from contract to buyer
        transaction.nft.transferFrom(address(this),transaction.buyer,transaction.tokenId);
    }
    function transferNFTBackToSeller(uint256 _transactionId) external checkItemExist(_transactionId) checkItemSoldOrCancel(_transactionId)
    {
        BidTransaction storage transaction = transactionRegistry[_transactionId];
        require(transaction.buyer == address(0x0),"Already have buyer");
        transaction.isCancel = true;
        transaction.nft.transferFrom(address(this),transaction.seller,transaction.tokenId);
    }

    function cancelAuctionFrom(uint256 _transactionId) payable  external checkItemExist(_transactionId) checkItemSoldOrCancel(_transactionId)
    {
        BidTransaction storage transaction = transactionRegistry[_transactionId];
        require(msg.sender == transaction.seller, "You are not the owner of this transaction");
        if(transaction.buyer!=address(0x0))
        {
            require(msg.value>=getCompensationPrice(_transactionId), "You dont have enough coin to cancel");
            uint256 pricePayback = transaction.price + getCompensationPrice(_transactionId);
            transaction.buyer.transfer(pricePayback);
            payable(msg.sender).transfer(msg.value - getCompensationPrice(_transactionId));
        }
        transaction.nft.transferFrom(address(this),msg.sender, transaction.tokenId);
        transaction.isCancel =true;
    }
    function getCompensationPrice(uint256 _transactionId) view public returns(uint256){
        return((transactionRegistry[_transactionId].price*(compensationFeePercent))/100);
    }
    function getTotalPrice(uint _transactionId) view public returns(uint){
        return((transactionRegistry[_transactionId].price*(100 + feePercent))/100);
    }
    ///// Minimum money of new bid the nft
    function getMinumumNewPrice(uint _transactionId) view public returns(uint){
        return((transactionRegistry[_transactionId].price*(100 + minumunBidUpPercent ))/100);
    }
    function getCostPay(uint _transactionId) view public returns(uint){
        return((transactionRegistry[_transactionId].price*( minumunBidUpPercent ))/100);
    }
    ///// Minimum money of new bid the nft
    function caculateNewPrice(uint256 _price) view internal  returns(uint){
        return((_price*(100 + feePercent))/100);
    }
    //// withDraw;
    function moneyInContract() view external  onlyOwner  returns (uint256){
        uint256 balance = address(this).balance;
        return balance;
    }
}