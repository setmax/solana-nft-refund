import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { REFUNDABLE_NFT_PUBKEY, SOLANA_HOST } from "../utils/const";
import { getProgramInstance } from "../utils/utils";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { TransactionDetail } from "../models/transactionDetail";
const anchor = require("@project-serum/anchor");
const utf8 = anchor.utils.bytes.utf8;
const { BN, web3 } = anchor;
const { SystemProgram } = web3;

import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  Nft,
  walletAdapterIdentity,
} from "@metaplex-foundation/js-next";
import { wallet_analyzer_for_nft } from "../utils/nft_tracker";
import { delay } from "../utils/common";

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
};

const useRefundNFTPack = () => {
  const wallet = useWallet();
  if (wallet == undefined) return null;
  const connection = new anchor.web3.Connection(SOLANA_HOST);
  const program = getProgramInstance(connection, wallet);
  const mx = new Metaplex(connection);
  const create_nft = async (user_wallet) => {
    //create nft with update auth and uploaded uri
    // get egg nft and update it's creator to use new owner
    // owner should sign creator list and shouold be here
    const egg_mint = new PublicKey(
      "5EsJan29zgpC4BrATCUTgH7KmJnD35xv3NyMbpUDT6MR"
    );
    const egg_nft = await mx.nfts().findByMint(egg_mint);
    // console.log(`egg nft metadata: ${egg_nft.metadata}`);
    //metaplex config to use arweave
    mx.use(walletAdapterIdentity(wallet.wallet.adapter)).use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );
    const { uri: newUri, metadata } = await mx.nfts().uploadMetadata({
      ...egg_nft.metadata,
      name: "HoneyLand Egg NFT",
      symbol: "EGG",
      properties: {
        creators: [
          {
            address: mx.identity().publicKey.toBase58(),
            share: 100,
            verified: true,
          },
        ],
      },
      primarySaleHappened: true,
    });
    console.log(`new nft meta: ${newUri}`);

    ////////////////////////////////////////
    //finally create nft with new metadata

    let new_nft: Nft = null;
    let user_wallet_hardcode = null;

    if (user_wallet != "") {
      user_wallet_hardcode = new PublicKey(user_wallet);
      const { nft } = await mx.nfts().create({
        uri: newUri,
        payer: wallet,
        owner: user_wallet_hardcode,
      });
      new_nft = nft;
    } else {
      user_wallet_hardcode = wallet.publicKey;
      const { nft } = await mx.nfts().create({
        uri: newUri,
      });
      new_nft = nft;
    }

    // prepare created nft information for burn and refund
    //token acc+ meta acc+ update auth+ mint+
    console.log("////////////NFT INFO////////////////");
    // console.log(nft);
    console.log("////////////NFT INFO FOR BURN AND REFUND////////////////");
    console.log(`nft.mint: ${new_nft.mint.toBase58()}`);
    console.log(`nft.update auth: ${new_nft.updateAuthority.toBase58()}`);
    console.log(`nft.meta: ${new_nft.metadataAccount.publicKey}`);
    const new_nft_token_account = (
      await mx.connection.getTokenAccountsByOwner(user_wallet_hardcode, {
        mint: new_nft.mint,
      })
    ).value[0];
    console.log(`nft.token account? : ${new_nft_token_account.pubkey}`);
    let result_log = `nft created with mint: ${new_nft.mint}`;
    return result_log;
    //create allowed nft for burn and refund here

    // return {
    //   mint: new_nft.mint,
    //   meta: new_nft.metadataAccount,
    //   token_account: new_nft_token_account,
    // };
  };

  const refund_nft = async (mint, token_account, meta_account, price) => {
    const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("honeyland_treasury")],
      program.programId
    );
    let allowed_nft_input: any = null;
    // console.log("////////////NFT INFO////////////////");
    // // console.log(nft);
    // console.log("////////////NFT INFO FOR BURN AND REFUND////////////////");
    // console.log(`nft.mint: ${nft.mint.toBase58()}`);
    // console.log(`nft.update auth: ${nft.updateAuthority.toBase58()}`);
    // console.log(`nft.meta: ${nft.metadataAccount.publicKey}`);
    // const new_nft_token_account = (
    //   await mx.connection.getTokenAccountsByOwner(wallet.publicKey, {
    //     mint: nft.mint,
    //   })
    // ).value[0];
    // console.log(`nft.token account? : ${new_nft_token_account.pubkey}`);
    allowed_nft_input = {
      mint: mint,
      meta: meta_account,
      token_account: token_account,
    };
    const burn_refund_transaction = anchor.web3.Keypair.generate();
    const input = {
      lamports: new anchor.BN(price * LAMPORTS_PER_SOL),
    };
    ///////////event
    // let listener: any = null;
    // let [event, slot] = await new Promise((resolve, _reject) => {
    //   listener = program.addEventListener("RefundEvent", (event, slot) => {
    //     resolve([event, slot]);
    //   });
    //   program.methods
    //     .burnRefund(input.lamports)
    //     .accounts({
    //       tokenAccount: allowed_nft_input.token_account,
    //       mint: allowed_nft_input.mint,
    //       meta: allowed_nft_input.meta,
    //       transaction: burn_refund_transaction.publicKey,
    //       user: wallet?.publicKey,
    //       treasuryAccount: treasuryAccountPDA,
    //     })
    //     .signers([burn_refund_transaction])
    //     .rpc();
    // });
    // await program.removeEventListener(listener);
    // console.log(`event is:${event}`);

    await program.methods
      .burnRefund(input.lamports)
      .accounts({
        tokenAccount: allowed_nft_input.token_account,
        mint: allowed_nft_input.mint,
        meta: allowed_nft_input.meta,
        transaction: burn_refund_transaction.publicKey,
        user: wallet?.publicKey,
        treasuryAccount: treasuryAccountPDA,
      })
      .signers([burn_refund_transaction])
      .rpc();

    await delay(20000);
    const transactionAccount = await program.account.transactionDetail.fetch(
      burn_refund_transaction.publicKey
    );
    let new_tx = new TransactionDetail(transactionAccount);
    console.log(new_tx);
    return new_tx.toString;
  };

  const refund_nft_list = async () => {
    const nft_list = await wallet_analyzer_for_nft(
      connection,
      wallet.publicKey,
      REFUNDABLE_NFT_PUBKEY,
      41
    );
    return nft_list;
  };

  return { create_nft, refund_nft, refund_nft_list };
};

export default useRefundNFTPack;
