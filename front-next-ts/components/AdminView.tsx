import useTreasuryAccount from "../hooks/useTreasuryAccount";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { OWNER_WALLET, SOLANA_HOST } from "../utils/const";
import { getProgramInstance } from "../utils/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import CreateTreasury from "./CreateTreasury";
import OtherActionsTreasury from "./OtherActionsTreasury";
import UserView from "./UserView";
import useRefundNFTPack from "../hooks/useRefundNFTPack";

const anchor = require("@project-serum/anchor");
const utf8 = anchor.utils.bytes.utf8;
const { BN, web3 } = anchor;
const { SystemProgram } = web3;

const AdminView = () => {
  const [isTreasuryExist, setTreasuryExist] = useState(false);
  const [current, setCurrent] = useState("");

  const wallet = useWallet();
  // console.log(wallet.publicKey.toBase58());
  const connection = new anchor.web3.Connection(SOLANA_HOST);

  const program = getProgramInstance(connection, wallet);

  // get hook from treasuryhook
  const {
    init_treasury,
    deposit_treasury,
    withdraw_treasury,
    get_treasury_balance,
  } = useTreasuryAccount();

  const { create_nft } = useRefundNFTPack();

  useEffect(() => {
    if (wallet.connected) {
      checkAccount();
    }
  }, [wallet.connected]);

  const checkAccount = async () => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );

    try {
      await program.account.honeylandTreasury.fetch(treasuryAccountPDA);
      setTreasuryExist(true);
    } catch (e) {
      setTreasuryExist(false);
    }
  };

  return (
    <>
      {isTreasuryExist ? (
        <>
          {" "}
          <OtherActionsTreasury
            deposit_treasury={deposit_treasury}
            withdraw_treasury={withdraw_treasury}
            get_current_sol={get_treasury_balance}
            create_nft={create_nft}
          />
        </>
      ) : (
        <CreateTreasury init_treasury={init_treasury} />
      )}
    </>
  );
};

export default AdminView;
