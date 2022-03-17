import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button, Tooltip, Drawer, Typography } from "antd";
import { connection, useGlobalState } from "../context";
import { useRouter } from "next/router";
import TransactionLayout from "../components/TransactionLayout";
import { refreshBalance } from "../utils";
import { ArrowRightOutlined, LoadingOutlined } from "@ant-design/icons";
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { AccountLayout, AuthorityType, createMint, createSetAuthorityInstruction, getMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, transfer } from "@solana/spl-token";
import { Dashboard } from "../styles/StyledComponents.styles";

const { Paragraph } = Typography;

const Nft: NextPage = () => {
    
    const { network, account, balance, setBalance } = useGlobalState();
    const [visible, setVisible] = useState<boolean>(false);
    const [airdropLoading, setAirdropLoading] = useState<boolean>(false);

    const router = useRouter();

    useEffect(() => {
        if (!account) {
          router.push("/");
          return;
        }
        refreshBalance(network, account)
          .then((updatedBalance) => {
            setBalance(updatedBalance);
          })
          .catch((err) => {
            console.log(err);
          });
      }, [account, router, network]);

    const getTokenList = async () => {

        try {
          
          if (!account) return null;
          
          const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
          let tokens: { mint: PublicKey; balance: bigint; }[] = [];
    
          const tokenAccounts = await connection.getTokenAccountsByOwner(account.publicKey, {programId: TOKEN_PROGRAM_ID});
    
          tokenAccounts.value.forEach(element => {
            let accountInfo = AccountLayout.decode(element.account.data);
            tokens.push({
              mint: new PublicKey(accountInfo.mint),
              balance: accountInfo.amount
            });
          });
    
          console.log(tokens);
          return tokens;
        }
    
        catch(error) {
          console.log(error);
        }
    }
    
    const mintNFT = async () => {
    
        if (!account) return;
    
        try {
          const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
          //create new token mint
          let mint = await createMint(
            connection,
            account,
            account.publicKey,
            account.publicKey,
            0
          );
    
          // get token account of address
          let associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            account,
            mint,
            account.publicKey
          );
    
          // mint 1 token to wallet address, set address as mint authority
          await mintTo(
            connection,
            account,
            mint,
            associatedTokenAccount.address,
            account,
            1
          );
    
          // Add token transfer instructions to transaction
          let transaction = new Transaction().add(
            createSetAuthorityInstruction(
              mint,
              account.publicKey,
              AuthorityType.MintTokens,
              null
            ),
          );
    
          // Sign transaction, broadcast, and confirm
          var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [account],
            {commitment: 'confirmed'},
          );
    
          const mintInfo = await getMint(connection, mint);
    
          console.log(mintInfo);
    
        }
    
        catch(error) {
          console.log(error);
        }
    }
    
    const transferNFT = async () => {
    
        try {
          
          if (!account) return;
    
          // Connect to cluster
          const connection = new Connection(clusterApiUrl("devnet"), 'confirmed');
    
          let toWallet = new PublicKey("oQATGGH9usURe18mTQx61EmXNRTT9cTDdCUFFpw8XbC");
    
          const tokenAccounts = await connection.getTokenAccountsByOwner(account.publicKey, {programId: TOKEN_PROGRAM_ID});
          const mint = AccountLayout.decode(tokenAccounts.value[0].account.data).mint;
    
          // Get the token account of the fromWallet address, and if it does not exist, create it
          const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            account,
            mint,
            account.publicKey
          );
    
          // Get the token account of the toWallet address, and if it does not exist, create it
          const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, account, mint, toWallet);
    
          const signature = await transfer(
            connection,
            account,
            fromTokenAccount.address,
            toTokenAccount.address,
            account.publicKey,
            1
          );
        }
        
        catch (error) {
          console.log(error);
        }
    }

    return (
        <>
        {account && (
            <Dashboard>
                <h1>NFT Gallery</h1>
                <br/>
                <Button type="primary" onClick={mintNFT}>
                    Mint NFT <ArrowRightOutlined />
                </Button>
            </Dashboard>
        )}
        </>
    );
}

export default Nft;
