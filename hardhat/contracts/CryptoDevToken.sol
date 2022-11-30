// SPDX-License-Identifier : MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CrytoDevToken is ERC20, Ownable {
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant tokensPerNFT = 10 * 10**18;
    //the max total supply is 10000 for crypto dev tokens
    uint256 public constant maxTotalSupply = 10000 * 10**18;
    ICryptoDevs CryptoDevsNFT;
    //Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Joy Token","CDJ"){
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    // msg.value should be equal or greater than the tokenPrice

    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect");
        //Total tokens + amount <= 10000, otherwise revert the transaction
        uint256 amountWithDecimals = amount * 10 ** 18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply available");

            _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        address sender = msg.sender;
        //Get the number of CryptoDev NFT's held by a given sender address
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require(balance > 0, "You dont own any Crypto Devs NFT");
        uint256 amount = 0;
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender,i);
            //if the tokenId has not been claimed, increase the amount 
            if(!tokenIdsClaimed[tokenId]){
                amount +=1;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        //If all the token Ids have been claimed, revert the transaction
        require(amount > 0, "You have already claimed all the tokens");
        // call the internal function from openzeppelin's ERC20
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // withdraw all ETH and tokens sent to the contract
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    //Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

}