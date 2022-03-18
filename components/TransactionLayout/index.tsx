import React, { useState, ReactElement } from "react";
import { message } from "antd";
import { useGlobalState } from "../../context";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
const converter = require("number-to-words");
import { LoadingOutlined } from "@ant-design/icons";
import { refreshBalance } from "../../utils";
import {
  CheckContainer,
  CheckImage,
  CheckFrom,
  Processed,
  CheckDate,
  RecipientInput,
  AmountInput,
  SignatureInput,
  AmountText,
  RatioText,
} from "../../styles/StyledComponents.styles";
import { AccountLayout, AuthorityType, createMint, createMultisig, createSetAuthorityInstruction, getAccount, getMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, transfer } from "@solana/spl-token";

type FormT = {
  from: string;
  to: string;
  amount: string;
  isSigned: boolean;
};

const defaultForm: FormT = {
  from: "",
  to: "",
  amount: "0",
  isSigned: false,
};

const TransactionModal = (): ReactElement => {
  const { network, account, balance, setBalance } = useGlobalState();
  const [form, setForm] = useState<FormT>(defaultForm);
  const [sending, setSending] = useState<boolean>(false);
  const [transactionSig, setTransactionSig] = useState<string>("");

  const onFieldChange = (field: string, value: string) => {
    //if (field === "amount" && !!value.match(/\D+/)) {
      //console.log(value);
      //return;
    //}

    setForm({
      ...form,
      [field]: value,
    });
  };

  const createMultiSigAddress = async () => {
    
    try {

      if (!account) return null;
      
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
      let signer1 = new PublicKey("FvR2WWjqgakMvNVGVXtFPgpvQMdLomtLqY3X3fccdB8E");
      let signer2 = new PublicKey("Dx8QUUhQbgDzMA3yrHWXzEBKzLVk6HxuyAc3sECJfkmL");
      let signer3 = new PublicKey("AepndZsGxzkwqttgUVCdbpMU8VEP8hKviKggTaT2Wn6y");

      const multiSigKey = await createMultisig(
        connection,
        account,
        [signer1, signer2, signer3],
        2);

      console.log(multiSigKey);

      return multiSigKey;
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
      setTransactionSig("");

      //let toWallet = new PublicKey("oQATGGH9usURe18mTQx61EmXNRTT9cTDdCUFFpw8XbC");

      const tokenAccounts = await connection.getTokenAccountsByOwner(account.publicKey, {programId: TOKEN_PROGRAM_ID});
      console.log(tokenAccounts);
      const mint = new PublicKey(form.amount);
      console.log(mint);

      // Get the token account of the fromWallet address, and if it does not exist, create it
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, account, mint, account.publicKey);

      // Get the token account of the toWallet address, and if it does not exist, create it
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, account, mint, new PublicKey(form.to));

      const signature = await transfer(connection, account, fromTokenAccount.address, toTokenAccount.address, account.publicKey, 1);

      setTransactionSig(signature);
    }
    
    catch (error) {
      console.log(error);
    }
  }


  const send = async () => {
    // This line ensures the function returns before running if no account has been set
    if (!account) return;

    try {
      const connection = new Connection(clusterApiUrl(network), "confirmed");
      setTransactionSig("");
      
      // create transfer instructions with account public key, public key from sender field, and amount

      const instructions = SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey: new PublicKey(form.to),
        lamports: Number(form.amount)
      });

      // create transaction object and add instructions
      const transaction = new Transaction().add(instructions);

      // use account to create a signers interface
      const signers = [
        {
          publicKey: account.publicKey,
          secretKey: account.secretKey,
        },
      ];

      setSending(true);
      
      // send transaction and await confirmation
      const confirmation = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers
      );
      setTransactionSig(confirmation);
      setSending(false);

      if (network) {
        const updatedBalance = await refreshBalance(network, account);
        setBalance(updatedBalance);
        message.success(`Transaction confirmed`);
      }
    } 
    catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown Error";
      message.error(
        `Transaction failed, please check your inputs: ${errorMessage}`
      );
      setSending(false);
    }
  };

  return (
    <>
      <CheckContainer>
        <CheckImage src="/check.jpeg" alt="Check" />
        <CheckFrom>{`FROM: ${account?.publicKey}`}</CheckFrom>

        {transactionSig && (
          <Processed
            href={`https://explorer.solana.com/tx/${transactionSig}?cluster=devnet`}
            target="_blank"
          >
            Processed - Review on Solana Block Explorer
          </Processed>
        )}

        <CheckDate>
          {new Date().toString().split(" ").slice(1, 4).join(" ")}
        </CheckDate>
        <RecipientInput
          value={form.to}
          onChange={(e) => onFieldChange("to", e.target.value)}
        />
        <AmountInput
          value={form.amount}
          onChange={(e) => onFieldChange("amount", e.target.value)}
        />
        {sending ? (
          <LoadingOutlined
            style={{
              fontSize: 24,
              position: "absolute",
              top: "69%",
              left: "73%",
            }}
            spin
          />
        ) : (
          <SignatureInput
            onClick={isNaN(Number(form.amount)) ? transferNFT : send}
            disabled={
              !balance ||
              (!isNaN(Number(form.amount)) && (Number(form.amount) / LAMPORTS_PER_SOL > balance ||
              !form.to ||
              Number(form.amount) == 0))
            }
            type="primary"
          >
            Sign and Send
          </SignatureInput>
        )}
        <RatioText>1 $SOL = 1,000,000,000 $L</RatioText>
      </CheckContainer>
    </>
  );
};

export default TransactionModal;
