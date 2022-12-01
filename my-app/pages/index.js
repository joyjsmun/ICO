import {BigNumber,Contract, providers,utils} from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import {NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,TOKEN_CONTRACT_ADDRESS} from "../constants";

export default function Home(){
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading,setLoading] = useState(false);
  //keep track of the number of tokens can be claimed
  //based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  //amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  //the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted,setTokensMinted] = useState(zero);
  // gets the owner of the current contract through the singned address
  const [isOwner,setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true);
      //get the address associated to the signer which is connected to Metamask
      const address = await signer.getAddress();
      //get the balanceOf from the NFT contract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      if (balance === zero){
        setTokensToBeClaimed(zero)
      }else{
        var amount = 0;
        for(var i = 0; i < balance; i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address,i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if(!claimed){
            amount++;
          }
        }
        //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount to a big number and then set its value
        setTokensToBeClaimed(BigNumber.from(amount));
      }
      
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  }


  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      // balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfCryptoDevTokens(balance);

    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  // mints `amount` number of tokens to given address
  const mintCryptoDevToken = async (amount)  => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount,{
        //value signifies the cost of one crypto dev token which is `0.001` eth.
        //we are parsing `0.001` string to ether using the utils library from ether.js
        value: utils.parseEther(value.toString())
      });
      setLoading(true);
      //wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
      
    } catch (err) {
      console.log(err);

    }
  }

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract (
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx  = await tokenContract.claim();
      setLoading(true);
      //wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Successfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
      
    } catch (err) {
      console.log(err)
    }
  }


  // Retrieves how many tokens have been minted till now out of the total supply
  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.log(err)
    }
  }

  //gets the contract owner by connected address
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
        //call the owner function from the contract
        const _owner = await tokenContract.owner();
        //we get the signer to extract address of currently connected Metamask account
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        if(address.toLowerCase() === _owner.toLowerCase()){
          setIsOwner(true);
        } 

    } catch (err) {
      console.log(err)
    }
  }

  // withdraws ether and tokens by calling the withdraw function in the contract
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
      
    } catch (err) {
      console.error(err)
    }
  }

  // Returns a provider or signer object representing the Ethereum RPC with or without the signing capabilities of metamask attahced
  // @param {*} needSigner - True if you need the signer, default false otherwise

  const getProviderOrSigner = async (needSigner = false)  => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 5){
      window.alert("Change the network to Goerli");
      throw new Error("Chnage the network to Goerli");
    }
    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      
    } catch (err) {
      console.error(err);
    }
  }


  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"goerli",
        providerOptions:{},
        disableInjectedProvider:false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
  
    }
  },[walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }

    //if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
        <button className={styles.button} onClick={withdrawCoins}>Withdraw Coins</button>
      </div>
      )
    }

    // If tokens to be claimed are greater than 0, Return a claim button
    if(tokensToBeClaimed > 0) {
      return(
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      )
    }

    // if user doenst have any tokens to claim, show the mint button
      return (
      <div style={{display:"flex-col"}}>
        <div>
          <input 
            type="number"
            placeholder="Amount of Tokens"
            //BigNumber.from converts the `e.target.value` to a BigNumber
            onChange ={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button 
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() =>  mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description"  content="ICO-Dapp" />
        <link rel="icon" href="/favicon" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Joy Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} CryptoDev Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) :(
            <button onClick={connectWallet} className={styles.button}>Connect your wallet</button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      
    </div>
  )
}