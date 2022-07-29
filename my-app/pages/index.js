import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {BigNumber,Contract,providers,utils} from "ethers"
import {Web3Modal} from "web3modal"
import { useEffect, useRef, useState } from 'react'
import {NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,TOKEN_CONTRACT_ADDRESS} from "../constants"
import { getJsonWalletAddress } from 'ethers/lib/utils'


export default function Home() {
  //Create a BigNumber '0'
  const zero = BigNumber.from(0);

  //Keep track the user's wallet is connected or not
  const [walletConnected,setWalletConnected] = useState(false);

  //loading is set to true when waiting for the transaction to get mined
  const [loading,setLoading] = useState(false);

  //It keeps track of the number of tokens that can be claimed
  //based on the Crypto Dev NFT's held by the user for which they haven't claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  //it keeps track of number of CryptoDevTokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);

  //amount of the token that the use wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);

  //it is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);

  //isOwner gets the owner of the contract through the signed address
  const [isOwner, setIsOwner] = useState(false);

  //create a reference to the Web3Modal(used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  

  //Check the balance of tokens that can be claimed by the user
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      
      //create an instance of nftContract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )

      //create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true);
      //Get the address associated to the singer which is connected to Metamask
      const address = signer.getAddress();
      //call the balanceOf from the NFTContract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      
      //balance is Big number and thus it needs to compare it with Big number's zero
      if(balance === zero){
        setTokensToBeClaimed(zero)
      } else{
        //amount keeps track of the number of unclaimed tokens
        var amount = 0;


        //For all the NFT's, check if the tokens have already been claimed
        //Only increase the amount if the tokens have not been claimed for a an NFT(for a give tokenId)
        for(var i = 0; i< balance; i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address,i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed){
            amount ++;
          }
        }
        //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
        //to a big number and then set its value
        // 큰숫자로 변환한 다음 값을 설정(초기에 큰숫자로 초기화 되어서 설정되었으므로..)
        setTokensToBeClaimed(BigNumber.from(amount));
      }

      
    } catch (err) {
      console.error(err)
    }
  }


  // Retrievers how many tokens have been minted till now out of the total supply
  const getTotalTokensMinted = async () => {
    try {
      //Get the provider from web3Modal, which is Metamask
      //No need for the Signer here,as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      //Create an instance of token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      //Get all the tokens that have been minted;
      const _tokenMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokenMinted);

    } catch (err) {
      console.error(err)
    }
  }

  //check the balance of Crypto Dev Token's held by an address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      
      //Get the signer now to extract the address of the currently connected Metamask account
      const signer = await getProviderOrSigner(true);
      //Get the address associated to the signer wichi is connected to metamask
      const address = await signer.getAddress();
      //Call the balance of the token contract to get the number of tokens held by the user
      const balance = await tokenContract.balanceOf(address);
      //balance is already a big number, so we don't need to convert it before setting it
      setBalanceOfCryptoDevTokens(balance);

    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  }
  
  

  //Get the contract owner by connected address
  const getOwner = async () => {
    try {
      const provider = getProviderOrSigner();
      const nftContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,provider);

      //call the owner function from the contract
      const _owner = await tokenContract.owner();
      const signer = await getProviderOrSigner(true);
      //Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();

      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
      
    } catch (err) {
      console.error(err.message);
    }
  };

  //Withdraw ether and tokens by calling the withdraw function in the contract
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
      
    } catch (err) {
      console.error(err)
      
    }
  }
  
  //Returns a Provider or Signer object representing the Ethereum RPC with or without the signing capabilities of Metamask attached
  //@param needSigner - True if you need the signer, default false otherwise

  const getProviderOrSigner = async (needSigner = false) => {

    //connect to Metamask
    //Since it stores 'web3Modal' as a reference, it needs to access the 'current' value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const {chainId} = await web3Provider.getNetwork();
      if(chainId !== 4){
        window.alert("Change the network to Rinkedby");
        throw new Error("Change network to Rinkeby");
      }

      if(needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
  } 



  const connectWallet = async () => {
    try {
      //Get the provider from the Web3Modal,which is Metamask
      //When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
      
    } catch (err) {
      console.error(err);
    }
  }


  //whenever the value of 'walletConnected' changes - this effect will be called
  useEffect(() => {
    //if wallet is not connected, create a new instance of Web3Modal and connect the Metamask wallet
  if (!walletConnected) {
    // Assign the Web3Modal class to the reference object by setting its 'current' value
    //The 'current' value is persisted throughout as long as this page is open
    web3ModalRef.current = new Web3Modal({
      network:"rinkeby",
      providerOptions:{},
      disableInjectedProvider:false
    });
    connectWallet();
    getTotalTokensMinted();
    getBalanceOfCryptoDevTokens();
    getTokensToBeClaimed();
    withdrawCoins();

  }

  },[walletConnected])

  return (
   <div>

   </div>
  )
}
