import React, { useEffect, useState } from "react";
import AdminView from "./AdminView";
import { useWallet } from "@solana/wallet-adapter-react";
import { OWNER_WALLET, SOLANA_HOST } from "../utils/const";
import { getProgramInstance } from "../utils/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import NftList from "./NftList";

const anchor = require("@project-serum/anchor");
const utf8 = anchor.utils.bytes.utf8;
const { BN, web3 } = anchor;
const { SystemProgram } = web3;

// const defaultAccounts = {
//   tokenProgram: TOKEN_PROGRAM_ID,
//   clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//   systemProgram: SystemProgram.programId,
// };

const UserView = () => {
  const [isTreasuryExist, setTreasuryExist] = useState(false);
  const wallet = useWallet();
  // console.log(wallet.publicKey.toBase58());
  const connection = new anchor.web3.Connection(SOLANA_HOST);

  const program = getProgramInstance(connection, wallet);

  useEffect(() => {
    if (wallet.connected) {
      checkAccount();
      // getTiktoks();
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
      {wallet.publicKey.toBase58() == OWNER_WALLET.toBase58() ? (
        <AdminView />
      ) : (
        <>
          {isTreasuryExist ? (
            <NftList />
          ) : (
            <div className="loginWalletContainer">
              <div className="loginWalletTitle">
                Refund Program Has Been Ended.
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default UserView;
