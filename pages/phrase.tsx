import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button, Alert, Popconfirm } from "antd";
import PhraseBox from "../components/PhraseBox";
import { useGlobalState } from "../context";
import { LoadingOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import * as Bip39 from "bip39";
import { Keypair } from "@solana/web3.js";

// Import the Keypair class from Solana's web3.js library:

const Phrase: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const { setAccount, mnemonic, setMnemonic } = useGlobalState();

  const router = useRouter();

  useEffect(() => {
    // generate mnemonic phrase
    const generatedMnemonic = Bip39.generateMnemonic();

    // displays mnemonic phrase to user
    setMnemonic(generatedMnemonic);

    // convert mnemonic to 32-bit format
    const seed = Bip39.mnemonicToSeedSync(generatedMnemonic).slice(0, 32);
    console.log(seed);

    // use the seed to generate new account
    const newAccount = Keypair.fromSeed(seed);

    // set account to for use by app
    setAccount(newAccount);
  }, []);

  const showPopconfirm = () => {
    setVisible(true);
  };

  const handleOk = () => {
    setLoading(true);
    router.push("/wallet");
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const warning =
    "Keep this phrase secret and safe. This is the only way for you to access your digital assets. Moreover, anyone can access your assets with it! Think of it as the password to your online bank account.";

  return (
    <>
      <h1 className={"title"}>Secret Recovery Phrase</h1>

      <p>
        This recovery phrase is generated with your private keys and can be used
        to recover your account.
      </p>

      <Alert message={warning} type="warning" />

      <p>
        Once you have stored this phrase somewhere safe, click finish to go to
        your wallet.
      </p>

      <PhraseBox mnemonic={mnemonic}></PhraseBox>

      {!loading && (
        <Popconfirm
          title="Did you copy the phrase?"
          visible={visible}
          onConfirm={handleOk}
          okButtonProps={{ loading: loading }}
          onCancel={handleCancel}
          cancelText={"No"}
          okText={"Yes"}
        >
          <Button type="primary" onClick={showPopconfirm}>
            Finish
          </Button>
        </Popconfirm>
      )}

      {loading && <LoadingOutlined style={{ fontSize: 24 }} spin />}
    </>
  );
};

export default Phrase;
