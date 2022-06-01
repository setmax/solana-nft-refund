import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { bundlrStorage, keypairIdentity, Metaplex } from '@metaplex-foundation/js-next';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import treasury_owner from '../../wallet/treasury_owner.json';
import allowed_update_auth from '../../wallet/allowed_update_auth.json';

describe('metaplex-new-sdk-suite', async () => {
  // import wallets
  // let ownerAccount = Keypair.generate();
  let ownerAccount = Keypair.fromSecretKey(new Uint8Array(treasury_owner));
  // let nft_allowed_update_authority = Keypair.generate();
  let nft_allowed_update_authority = Keypair.fromSecretKey(new Uint8Array(allowed_update_auth));
  let nft_not_allowed_update_authority = Keypair.generate();
  //metaplex
  const connection = new Connection('https://frosty-floral-wind.solana-devnet.quiknode.pro/fa3c7dec03be0b5335ff2905b342eedf94ada834/');
  // const connection = new Connection(clusterApiUrl('devnet'));
  const mx = new Metaplex(connection);

  //before any test ensure about some conditions
  before(async () => {
    // console.log('Before Any Test: Airdrop Check');
    // if (parseFloat((await mx.connection.getBalance(ownerAccount.publicKey)).toString()) / LAMPORTS_PER_SOL < 5) {
    //   var fromAirDropSignature = await mx.connection.requestAirdrop(ownerAccount.publicKey, 2 * LAMPORTS_PER_SOL);
    //   await mx.connection.confirmTransaction(fromAirDropSignature);
    //   console.log(
    //     `Owner Balance Before Test: ${
    //       parseFloat((await mx.connection.getBalance(ownerAccount.publicKey)).toString()) / LAMPORTS_PER_SOL
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
    // console.log(nft);
    // console.log('////////////NFT INFO FOR BURN AND REFUND////////////////');
    // console.log(`nft.mint: ${nft.mint.toBase58()}`);
    // console.log(`nft.update auth: ${nft.updateAuthority.toBase58()}`);
    // console.log(`nft.meta: ${nft.metadataAccount.publicKey}`);
    // console.log(
    //   `nft.token account? : ${
    //     (
    //       await mx.connection.getTokenAccountsByOwner(ownerAccount.publicKey, {
    //         mint: nft.mint
    //       })
    //     ).value[0].pubkey
    //   }`
    // );
  });
});
