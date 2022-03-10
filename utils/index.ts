// Import any additional classes and/or functions needed from Solana's web3.js library as you go along:
import { Cluster, clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { message } from "antd";

// *Step 3*: implement a function that gets an account's balance
const refreshBalance = async (network: Cluster | undefined, account: Keypair | null) => {
  // if no account set, return 0
  if (!account) return 0;

  try {

    // connect to active network
    const connection = new Connection(clusterApiUrl(network), "confirmed");

    // public key of account
    const publicKey = account.publicKey;

    // get balance
    const balance = await connection.getBalance(publicKey);

    return balance / LAMPORTS_PER_SOL;
  } 
  catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Error";
    message.error(`Balance refresh failed: ${errorMessage}`);
    return 0;
  }
};

// *Step 4*: implement a function that airdrops SOL into devnet account
const handleAirdrop = async (network: Cluster, account: Keypair | null) => {
  // This line ensures the function returns before running if no account has been set
  if (!account) return;

  try {
    const connection = new Connection(clusterApiUrl(network), "confirmed");
    const publicKey = account.publicKey;
    const confirmation = await connection.requestAirdrop(
      publicKey,
      LAMPORTS_PER_SOL
    );
    const result = await connection.confirmTransaction(confirmation, "confirmed");

    // This line returns the balance after the airdrop so the UI can be refreshed
    return await refreshBalance(network, account);
  } 
  catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Error";
    message.error(`Airdrop failed: ${errorMessage}`);
  }
};

export { refreshBalance, handleAirdrop };
