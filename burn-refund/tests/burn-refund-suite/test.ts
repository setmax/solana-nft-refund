import { PublicKey, Transaction, Signer, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BN, Program, Wallet } from '@project-serum/anchor';
import { BurnRefund } from '../../target/types/burn_refund';
import { bundlrStorage, keypairIdentity, Metaplex, Nft } from '@metaplex-foundation/js-next';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import treasury_owner from '../../wallet/treasury_owner.json';
import allowed_update_auth from '../../wallet/allowed_update_auth.json';
import { expect, assert } from 'chai';

describe('burn-refund-suite', async () => {
  //process of test
  //1. init treasury with update auth and owner/signer===> check its owner and its update authority property
  //2. deposit treasury ===> check treasury balance
  //3. withdraw treasury ===> check treasury balance-------check owner wallet balance
  //4. create a nft with next sdk and transfer it to user and call burn and refund===>check the existence of nft------check balance of nft owner

  // required values for treasury(owner + update auths for testing nfts)
  let ownerAccount = Keypair.fromSecretKey(new Uint8Array(treasury_owner));
  // let nft_allowed_update_authority = Keypair.fromSecretKey(new Uint8Array(allowed_update_auth));
  let nft_not_allowed_update_authority = Keypair.generate();

  //update auths for creating nfts
  let allowed_nft_input = null;
  let not_allowed_nft_input = null;

  //anchor
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BurnRefund as Program<BurnRefund>;

  //////////////////NFT
  //metaplex
  const connection = new Connection('https://frosty-floral-wind.solana-devnet.quiknode.pro/fa3c7dec03be0b5335ff2905b342eedf94ada834/');
  const mx = new Metaplex(connection);

  //create nft with wrong update auth and one with considered update auth

  const [treasuryAccountPDA] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode('honeyland_treasury')],
    program.programId
  );

  before(async () => {
    // console.log('Before Any Test: Airdrop Check');
    // if (parseFloat((await provider.connection.getBalance(ownerAccount.publicKey)).toString()) / LAMPORTS_PER_SOL < 5) {
    //   var fromAirDropSignature = await provider.connection.requestAirdrop(ownerAccount.publicKey, 1 * LAMPORTS_PER_SOL);
    //   await provider.connection.confirmTransaction(fromAirDropSignature);
    //   console.log(
    //     `Owner Balance Before Test: ${
    //       parseFloat((await provider.connection.getBalance(ownerAccount.publicKey)).toString()) / LAMPORTS_PER_SOL
    //     } SOL`
    //   );
    // } else {
    //   console.log('Treasury Owner has more than 5 sol');
    // }
  });

  //////////Create NFT and Test Some basics with it
  it('Create NFt with new metaplex sdk', async () => {
    // //create nft with update auth and uploaded uri
    // // get egg nft and update it's creator to use new owner
    // // owner should sign creator list and shouold be here
    // const egg_mint = new PublicKey('5EsJan29zgpC4BrATCUTgH7KmJnD35xv3NyMbpUDT6MR');
    // const egg_nft = await mx.nfts().findByMint(egg_mint);
    // // console.log(`egg nft metadata: ${egg_nft.metadata}`);
    // //metaplex config to use arweave
    // mx.use(keypairIdentity(ownerAccount)).use(
    //   bundlrStorage({
    //     address: 'https://devnet.bundlr.network',
    //     providerUrl: 'https://api.devnet.solana.com',
    //     timeout: 60000
    //   })
    // );
    // const { uri: newUri, metadata } = await mx.nfts().uploadMetadata({
    //   ...egg_nft.metadata,
    //   name: 'HoneyLand Egg NFT',
    //   symbol: 'EGG',
    //   properties: {
    //     creators: [
    //       {
    //         address: mx.identity().publicKey.toBase58(),
    //         share: 100,
    //         verified: true
    //       }
    //     ]
    //   },
    //   primarySaleHappened: true
    // });
    // console.log(`new nft meta: ${newUri}`);
    // //finally create nft with new metadata
    // const { nft } = await mx.nfts().create({
    //   uri: newUri
    //   // updateAuthority: nft_allowed_update_authority
    // });
    // // prepare created nft information for burn and refund
    // //token acc+ meta acc+ update auth+ mint+
    // console.log('////////////NFT INFO////////////////');
    // // console.log(nft);
    // console.log('////////////NFT INFO FOR BURN AND REFUND////////////////');
    // console.log(`nft.mint: ${nft.mint.toBase58()}`);
    // console.log(`nft.update auth: ${nft.updateAuthority.toBase58()}`);
    // console.log(`nft.meta: ${nft.metadataAccount.publicKey}`);
    // const new_nft_token_account = (
    //   await mx.connection.getTokenAccountsByOwner(ownerAccount.publicKey, {
    //     mint: nft.mint
    //   })
    // ).value[0];
    // console.log(`nft.token account? : ${new_nft_token_account.pubkey}`);
    // //create allowed nft for burn and refund here
    // allowed_nft_input = {
    //   mint: nft.mint,
    //   meta: nft.metadataAccount,
    //   token_account: new_nft_token_account
    // };
  });

  // Burn And Refund NFT
  it('Burn-Refund NFT', async () => {
    // console.log('Burn-Refund NFT..............................');
    // try {
    //   //create nft with update auth and uploaded uri
    //   //prepared nft
    //   // nft.mint: FpYsD5h9xRDLUyZ3sgMVkT1KqxUtyr3QoY37yYAUwSaC
    //   // nft.meta: 7pwPF4Xquaj1Q2vhfXXcxZXLMMfqq7mGfFnfPUd7ED5X
    //   // nft.token account? : GwVVf6vDAn34npz9ft9sTf4oQhKWBKEyBExNz4cdTUFY
    //   console.log('////////////NFT INFO FOR BURN AND REFUND////////////////');
    //   console.log(`nft.mint: ${allowed_nft_input.mint.toBase58()}`);
    //   console.log(`nft.meta: ${allowed_nft_input.meta.publicKey}`);
    //   console.log(`nft.token account? : ${allowed_nft_input.token_account.pubkey}`);
    //   //report amount of solana in wallets
    //   let lamportsInTreasury = (await provider.connection.getAccountInfo(treasuryAccountPDA)).lamports;
    //   console.log(`Treasury Balance Before Burn-Refund: ${parseFloat(lamportsInTreasury.toString()) / LAMPORTS_PER_SOL} SOL`);
    //   let lamportsInOwnerWallet = await provider.connection.getBalance(ownerAccount.publicKey);
    //   console.log(`Owner Balance Before Burn-Refund: ${parseFloat(lamportsInOwnerWallet.toString()) / LAMPORTS_PER_SOL} SOL`);
    //   const burn_refund_transaction = anchor.web3.Keypair.generate();
    //   const input = {
    //     lamports: new anchor.BN(0.1 * LAMPORTS_PER_SOL)
    //   };
    //   /////////////event
    //   // let listener = null;
    //   // let [event, slot] = await new Promise((resolve, _reject) => {
    //   //   listener = program.addEventListener("RefundEvent", (event, slot) => {
    //   //     resolve([event, slot]);
    //   //   });
    //   // await program.methods
    //   //   .withdraw()
    //   //   .accounts({
    //   //     transaction: withdraw_transaction.publicKey,
    //   //     user: ownerAccount.publicKey,
    //   //     treasuryAccount: treasuryAccountPDA,
    //   //   })
    //   //   .signers([ownerAccount, withdraw_transaction])
    //   //   .rpc();
    //   // });
    //   // await program.removeEventListener(listener);
    //   // assert.isAbove(slot, 0);
    //   // assert.strictEqual(event.paytype, 1);
    //   // assert.strictEqual(event.label, "hello");
    //   // console.log(`event is:${event}`);
    //   ////////////event
    //   await program.methods
    //     .burnRefund(input.lamports)
    //     .accounts({
    //       tokenAccount: allowed_nft_input.token_account.pubkey,
    //       mint: allowed_nft_input.mint,
    //       meta: allowed_nft_input.meta.publicKey,
    //       transaction: burn_refund_transaction.publicKey,
    //       user: ownerAccount.publicKey,
    //       treasuryAccount: treasuryAccountPDA
    //     })
    //     .signers([ownerAccount, burn_refund_transaction])
    //     .rpc();
    //   //report amount of solana in wallets
    //   lamportsInOwnerWallet = await provider.connection.getBalance(ownerAccount.publicKey);
    //   console.log(`Owner Balance After burn-refund: ${parseFloat(lamportsInOwnerWallet.toString()) / LAMPORTS_PER_SOL} SOL`);
    //   //fetch accounts and infos
    //   ///////////////TX Detail
    //   const transactionAccount = await program.account.transactionDetail.fetch(burn_refund_transaction.publicKey);
    //   console.log('burn-refund Tx Details.............');
    //   console.log(`TX By: ${transactionAccount.user.toString()}`);
    //   console.log(`TX Type: ${transactionAccount.paytype}--(1=deposit,2=withdraw,3=burn-refund)`);
    //   console.log(`TX Date: ${new BN(transactionAccount.timestamp)}`);
    //   console.log(`TX Change Balance: ${parseFloat(transactionAccount.lamports.toString()) / LAMPORTS_PER_SOL} SOL`);
    // } catch (error) {
    //   console.log(error);
    // }
  });
});
