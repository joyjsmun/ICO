const {ethers} = require("hardhat");
require("dotenv").config({path:".env"});
const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constants");

async function main(){
  //Address of the nft contract
  const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  // A ContractFactory in ehters.js is an abstraction used to deploy new smart contracts,
  //so cryptoDevsTokenConctract here is a factory for instance of our CryptoDevToken contract
  const cryptoDevsTokenContract = await ethers.getContractFactory(
    "CryptoDevToken"
  );
  
  //deploy the contract
    const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
      cryptoDevsNFTContract
    )

    console.log(
      "CryptoDevs Token Contract Address :",
      deployedCryptoDevsTokenContract.address
    );

}

main()
  .then(( ) => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })