import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { REFUNDABLE_NFT_PUBKEY, SOLANA_HOST } from "../utils/const";
import { getProgramInstance } from "../utils/utils";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TransactionDetail } from "../models/transactionDetail";
import { delay } from "../utils/common";
const anchor = require("@project-serum/anchor");
const utf8 = anchor.utils.bytes.utf8;
const { BN, web3 } = anchor;
const { SystemProgram } = web3;

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
};

const useTreasuryAccount = () => {
  const wallet = useAnchorWallet();
  const connection = new anchor.web3.Connection(SOLANA_HOST);
  const program = getProgramInstance(connection, wallet);

  //to create treasury account
  const init_treasury = async () => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );

    await program.methods
      .initialize(REFUNDABLE_NFT_PUBKEY)
      .accounts({
        user: wallet?.publicKey,
        treasuryAccount: treasuryAccountPDA,
      })
      .rpc();

    console.log("Treasury Created!");
  };

  //to get treasury account
  const get_treasury = async () => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );
    try {
      const treasuryAccountInfo = await program.account.honeylandTreasury.fetch(
        treasuryAccountPDA
      );
      // console.log(treasuryAccountInfo);
      return treasuryAccountInfo;
    } catch (e) {
      console.log(e);
    }
  };

  const get_treasury_balance = async () => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );

    try {
      await program.account.honeylandTreasury.fetch(treasuryAccountPDA);
      let lamportsInTreasury = (
        await connection.getAccountInfo(treasuryAccountPDA)
      ).lamports;
      let Current_sol_string =
        "Treasury Balance: " +
        parseFloat(lamportsInTreasury.toString()) / LAMPORTS_PER_SOL +
        " sol";
      return Current_sol_string;
    } catch (e) {
      console.log(e);
    }
  };

  //to get withdraw instruction call
  const withdraw_treasury = async () => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );
    const withdraw_transaction = anchor.web3.Keypair.generate();
    ///////////event
    // let listener: any = null;
    // let [event, slot] = await new Promise((resolve, _reject) => {
    //   listener = program.addEventListener("RefundEvent", (event, slot) => {
    //     resolve([event, slot]);
    //   });
    //   program.methods
    //     .withdraw()
    //     .accounts({
    //       transaction: withdraw_transaction.publicKey,
    //       user: wallet.publicKey,
    //       treasuryAccount: treasuryAccountPDA,
    //     })
    //     .signers([withdraw_transaction])
    //     .rpc();
    //   console.log("Treasury Closed!");
    // });
    // await program.removeEventListener(listener);
    // console.log(`event is:${event}`);

    await program.methods
      .withdraw()
      .accounts({
        transaction: withdraw_transaction.publicKey,
        user: wallet.publicKey,
        treasuryAccount: treasuryAccountPDA,
      })
      .signers([withdraw_transaction])
      .rpc();

    await delay(20000);

    const transactionAccount = await program.account.transactionDetail.fetch(
      withdraw_transaction.publicKey
    );
    let new_tx = new TransactionDetail(transactionAccount);
    console.log(new_tx);
    return new_tx.toString;
  };

  //to get deposit instruction call
  const deposit_treasury = async (amount: number) => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );
    const deposit_transaction = anchor.web3.Keypair.generate();
    const input = {
      lamports: new anchor.BN(amount * LAMPORTS_PER_SOL),
    };
    /////////////event
    // let listener: any = null;
    // let [event, slot] = await new Promise((resolve, _reject) => {
    //   listener = program.addEventListener("RefundEvent", (event, slot) => {
    //     resolve([event, slot]);
    //   });
    //   program.methods
    //     .deposit(input.lamports)
    //     .accounts({
    //       transaction: deposit_transaction.publicKey,
    //       user: wallet?.publicKey,
    //       treasuryAccount: treasuryAccountPDA,
    //     })
    //     .signers([deposit_transaction])
    //     .rpc();
    // });
    // await program.removeEventListener(listener);
    // console.log(`event is:${event}`);
    await program.methods
      .deposit(input.lamports)
      .accounts({
        transaction: deposit_transaction.publicKey,
        user: wallet?.publicKey,
        treasuryAccount: treasuryAccountPDA,
      })
      .signers([deposit_transaction])
      .rpc();

    await delay(20000);

    const transactionAccount = await program.account.transactionDetail.fetch(
      deposit_transaction.publicKey
    );
    console.log(transactionAccount);
    let new_tx = new TransactionDetail(transactionAccount);
    console.log(new_tx);
    return new_tx.toString;
  };

  return {
    init_treasury,
    get_treasury,
    get_treasury_balance,
    withdraw_treasury,
    deposit_treasury,
  };
};

export default useTreasuryAccount;
