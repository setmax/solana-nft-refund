import {
  Metaplex,
  bundlrStorage,
  guestIdentity,
} from "@metaplex-foundation/js-next";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { NFTMoveType, QNFT } from "../models/QNFT";
import { QNFTView } from "../models/QNFTView";
import { getNumberOfDays } from "./common";

export const find_collection = async (clusterUrl, userWallet) => {
  const connection = new Connection(clusterApiUrl(clusterUrl));
  const phantom_wallet_owner = new PublicKey(userWallet);
  const metaplex = Metaplex.make(connection)
    .use(guestIdentity())
    .use(bundlrStorage());

  const nfts = await metaplex.nfts().findAllByOwner(phantom_wallet_owner);

  // for (let index = 0; index < nfts.length; index++) {
  //   const element = nfts[index];
  //   if (element.collection != null) {
  //     console.log(element.mint.toBase58(), element.name, element.collection.key.toBase58());
  //   }
  //   else{
  //     console.log(element.mint.toBase58(), element.name);
  //   }
  // }

  for (let index = 0; index < nfts.length; index++) {
    const element = nfts[index];
    if (element.collection != null) {
      console.log("collection props are not empty");
      console.log(`nft symbol is: ${element.symbol}`);
      console.log(`nft name is: ${element.name}`);
      console.log(`nft mint is: ${element.mint}`);
      console.log(`nft update auth is: ${element.updateAuthority}`);
      console.log(`nft collection pubkey is: ${element.collection.key}`);
      console.log("cretors list");
      for (let index = 0; index < element.creators.length; index++) {
        const creator = element.creators[index];
        console.log(
          `creator number${index + 1}, verified?[${creator.verified}], share: ${
            creator.share
          }, pubkey: ${creator.address.toBase58()}`
        );
      }
      // console.log((await connection.getTokenAccountsByOwner(phantom_wallet_owner, { mint: element.mint })).value[0].pubkey.toBase58());
      console.log("///////////////////////////////////////");
    } else {
      console.log("collection props are empty");
      console.log(`nft symbol is: ${element.symbol}`);
      console.log(`nft name is: ${element.name}`);
      console.log(`nft mint is: ${element.mint}`);
      console.log(`nft update auth is: ${element.updateAuthority}`);
      console.log("cretors list");
      for (let index = 0; index < element.creators.length; index++) {
        const creator = element.creators[index];
        console.log(
          `creator #${index + 1}, verified?[${creator.verified}], share: ${
            creator.share
          }, pubkey: ${creator.address.toBase58()}`
        );
      }
      // console.log((await connection.getTokenAccountsByOwner(phantom_wallet_owner, { mint: element.mint })).value[0].pubkey.toBase58());
      console.log("///////////////////////////////////////");
    }
  }

  // console.log(nfts);
};

export const wallet_analyzer_for_nft = async (
  connection,
  userWallet,
  nftUpdateAuth,
  threshold
) => {
  //init
  // const connection = new Connection(clusterApiUrl(clusterUrl));
  const phantom_wallet_owner = new PublicKey(userWallet);
  const nft_update_auth = new PublicKey(nftUpdateAuth);
  const metaplex = Metaplex.make(connection)
    .use(guestIdentity())
    .use(bundlrStorage());

  //results to report
  // const eggNFT: Nft[] = [];

  //array of all found nfts with condition
  const qnft_list: QNFT[] = [];

  //find all nfts for specific owner
  const nfts = await metaplex.nfts().findAllByOwner(phantom_wallet_owner);

  //review all nfts
  //1. check each nft for nft update authority match
  //2. review found nft(update auth matched) txs one by one
  //3. check transfer of nft mint and paid sol for that
  //4. add last tx of transfer nft and sol paid and other info(threshold) to qNFT array for settle and refund(maybe user has more than one specific nft(egg))
  for (let index = 0; index < nfts.length; index++) {
    //review nft
    const nft = nfts[index];

    //find one nft with update auth condition
    if (nft.updateAuthority.toBase58() == nft_update_auth.toBase58()) {
      // console.log("NFT INFO");
      // console.log(nft.mint.toBase58());

      // if we find one nft with matched update auth then load its MetadataAccount.
      await nft.metadataTask.run();

      //review found nft all txs==>txs with nft mint address(token address) in them
      const txs = await connection.getSignaturesForAddress(nft.mint);
      // console.log("TXSSSSS");
      // console.log(txs);

      //review txs one by one
      for (let index = txs.length - 1; index >= 0; index--) {
        //get one tx
        const element = txs[index];

        //get tx details
        const tx = await connection.getTransaction(element.signature);

        // console.log("THIS TX");
        // console.log(tx);
        // console.log("PostToken");
        // console.log(tx.meta.postTokenBalances);
        // console.log("PreToken");
        // console.log(tx.meta.preTokenBalances);

        // let go_out_to_next_tx = false;

        //review tx pre and post token/sol balances
        for (let index = 0; index < tx.meta.postTokenBalances.length; index++) {
          let preBalance = 0;
          let postBalance = 0;

          //create Final model to report
          const qNFT = new QNFT();

          //review each post token balance element to find nft mint in it, if nft mint found that post balance should have owner==userWallet
          const postElement = tx.meta.postTokenBalances[index];
          // if (element.mint == nft.mint.toBase58() && element.owner == userWallet) {
          if (postElement.mint == nft.mint.toBase58()) {
            // go_out_to_next_tx = true;
            let ata = true;
            postBalance = postElement.uiTokenAmount.uiAmount;
            //if nft mint found, we check each pre token balance element to not find nft mint(user gather it or buy it from store or mint it)
            if (tx.meta.preTokenBalances.length == 0) {
              qNFT.Name = nft.name;
              qNFT.Mint = nft.mint.toBase58();
              qNFT.Image = nft.metadata.image;
              qNFT.TokenAccount = (
                await connection.getTokenAccountsByOwner(phantom_wallet_owner, {
                  mint: nft.mint,
                })
              ).value[0].pubkey.toBase58();
              qNFT.Meta = nft.metadataAccount.publicKey;
              qNFT.Uri = nft.uri;
              qNFT.Tx = tx.transaction.signatures[0];
              qNFT.Amount = 1;
              qNFT.TrasnferType = NFTMoveType.Get;
              qNFT.Wallet = postElement.owner;
              qNFT.Days = getNumberOfDays(tx.blockTime);
              qnft_list.push(qNFT);
            } else {
              for (
                let index = 0;
                index < tx.meta.preTokenBalances.length;
                index++
              ) {
                const element = tx.meta.preTokenBalances[index];
                //get amount of change of token
                // if (element.mint == nft.mint.toBase58() && element.owner == userWallet) {
                if (
                  element.mint == nft.mint.toBase58() &&
                  element.owner == postElement.owner
                ) {
                  ata = false;
                  // go_out_to_next_tx = true;
                  preBalance = element.uiTokenAmount.uiAmount;
                  if (postBalance - preBalance == 0) {
                    qNFT.Name = nft.name;
                    qNFT.Image = nft.metadata.image;
                    qNFT.Mint = nft.mint.toBase58();
                    qNFT.TokenAccount = (
                      await connection.getTokenAccountsByOwner(
                        phantom_wallet_owner,
                        { mint: nft.mint }
                      )
                    ).value[0].pubkey.toBase58();
                    qNFT.Meta = nft.metadataAccount.publicKey;
                    qNFT.Uri = nft.uri;
                    qNFT.Tx = tx.transaction.signatures[0];
                    qNFT.Amount = 0;
                    qNFT.TrasnferType = NFTMoveType.Hold;
                    qNFT.Wallet = postElement.owner;
                    qNFT.Days = getNumberOfDays(tx.blockTime);
                    qnft_list.push(qNFT);
                  } else if (postBalance - preBalance == 1) {
                    qNFT.Name = nft.name;
                    qNFT.Image = nft.metadata.image;
                    qNFT.Mint = nft.mint.toBase58();
                    qNFT.TokenAccount = (
                      await connection.getTokenAccountsByOwner(
                        phantom_wallet_owner,
                        { mint: nft.mint }
                      )
                    ).value[0].pubkey.toBase58();
                    qNFT.Meta = nft.metadataAccount.publicKey;
                    qNFT.Uri = nft.uri;
                    qNFT.Tx = tx.transaction.signatures[0];
                    qNFT.Amount = 1;
                    qNFT.TrasnferType = NFTMoveType.Get;
                    qNFT.Wallet = postElement.owner;
                    qNFT.Days = getNumberOfDays(tx.blockTime);
                    qnft_list.push(qNFT);
                  } else if (postBalance - preBalance == -1) {
                    qNFT.Name = nft.name;
                    qNFT.Image = nft.metadata.image;
                    qNFT.Mint = nft.mint.toBase58();
                    qNFT.TokenAccount = (
                      await connection.getTokenAccountsByOwner(
                        phantom_wallet_owner,
                        { mint: nft.mint }
                      )
                    ).value[0].pubkey.toBase58();
                    qNFT.Meta = nft.metadataAccount.publicKey;
                    qNFT.Uri = nft.uri;
                    qNFT.Tx = tx.transaction.signatures[0];
                    qNFT.Amount = -1;
                    qNFT.TrasnferType = NFTMoveType.Miss;
                    qNFT.Wallet = postElement.owner;
                    qNFT.Days = getNumberOfDays(tx.blockTime);
                    qnft_list.push(qNFT);
                  } else if (postBalance - preBalance > 1) {
                    qNFT.Name = nft.name;
                    qNFT.Image = nft.metadata.image;
                    qNFT.Mint = nft.mint.toBase58();
                    qNFT.TokenAccount = (
                      await connection.getTokenAccountsByOwner(
                        phantom_wallet_owner,
                        { mint: nft.mint }
                      )
                    ).value[0].pubkey.toBase58();
                    qNFT.Meta = nft.metadataAccount.publicKey;
                    qNFT.Uri = nft.uri;
                    qNFT.Tx = tx.transaction.signatures[0];
                    qNFT.Amount = postBalance - preBalance;
                    qNFT.TrasnferType = NFTMoveType.Rich;
                    qNFT.Wallet = postElement.owner;
                    qNFT.Days = getNumberOfDays(tx.blockTime);
                    qnft_list.push(qNFT);
                  } else if (postBalance - preBalance < -1) {
                    qNFT.Name = nft.name;
                    qNFT.Image = nft.metadata.image;
                    qNFT.Mint = nft.mint.toBase58();
                    qNFT.TokenAccount = (
                      await connection.getTokenAccountsByOwner(
                        phantom_wallet_owner,
                        { mint: nft.mint }
                      )
                    ).value[0].pubkey.toBase58();
                    qNFT.Meta = nft.metadataAccount.publicKey;
                    qNFT.Uri = nft.uri;
                    qNFT.Tx = tx.transaction.signatures[0];
                    qNFT.Amount = postBalance - preBalance;
                    qNFT.TrasnferType = NFTMoveType.poor;
                    qNFT.Wallet = postElement.owner;
                    qNFT.Days = getNumberOfDays(tx.blockTime);
                    qnft_list.push(qNFT);
                  }
                }
                // if (go_out_to_next_tx) break;
              } //end of inner preTokenBalances for
              //checking for ata possibility
              if (ata) {
                qNFT.Name = nft.name;
                qNFT.Image = nft.metadata.image;
                qNFT.Mint = nft.mint.toBase58();
                qNFT.TokenAccount = (
                  await connection.getTokenAccountsByOwner(
                    phantom_wallet_owner,
                    { mint: nft.mint }
                  )
                ).value[0].pubkey.toBase58();
                qNFT.Meta = nft.metadataAccount.publicKey;
                qNFT.Uri = nft.uri;
                qNFT.Tx = tx.transaction.signatures[0];
                qNFT.Amount = postBalance - preBalance;
                qNFT.TrasnferType = NFTMoveType.Get;
                qNFT.Wallet = postElement.owner;
                qNFT.Days = getNumberOfDays(tx.blockTime);
                qnft_list.push(qNFT);
              }
            }
            let big_different = 0;
            //get change in sol with solbalances
            for (let index = 0; index < tx.meta.postBalances.length; index++) {
              const soldiff =
                tx.meta.postBalances[index] * Math.pow(10, -8) -
                tx.meta.preBalances[index] * Math.pow(10, -8);
              if (Math.abs(soldiff) > big_different) {
                big_different = Math.abs(soldiff);
              }
            }
            qNFT.Price = big_different;
          } //end of condition inside postTokenBalances
          // if (go_out_to_next_tx) break;
        } //end of outer postTokenBalances for
      } //end of big for-->all tx
    }
  } //end of big for all nfts inside owner wallet

  // console.log(qnft_list);
  // console.log("export final report started............");
  //send above list to final analyzer and get final report
  const final_report = qnft_list_analyzer(qnft_list, userWallet, threshold);
  return final_report;
  // console.log(final_report);
  //send this nft to smart contract for burning process
};

export const findNft = async (clusterUrl, mint) => {
  const connection = new Connection(clusterApiUrl(clusterUrl));
  const nft_mint = new PublicKey(mint);
  const metaplex = Metaplex.make(connection)
    .use(guestIdentity())
    .use(bundlrStorage());

  const nft = await metaplex.nfts().findByMint(nft_mint);
  if (nft.collection != null) {
    console.log("collection props are not empty");
    console.log(`nft symbol is: ${nft.symbol}`);
    console.log(`nft name is: ${nft.name}`);
    console.log(`nft mint is: ${nft.mint}`);
    console.log(`nft update auth is: ${nft.updateAuthority}`);
    console.log(`nft collection pubkey is: ${nft.collection.key}`);
    console.log("cretors list");
    for (let index = 0; index < nft.creators.length; index++) {
      const creator = nft.creators[index];
      console.log(
        `creator number${index + 1}, verified?[${creator.verified}], share: ${
          creator.share
        }, pubkey: ${creator.address.toBase58()}`
      );
    }
    // console.log((await connection.getTokenAccountsByOwner(phantom_wallet_owner, { mint: element.mint })).value[0].pubkey.toBase58());
    console.log("///////////////////////////////////////");
  } else {
    console.log("collection props are empty");
    console.log(`nft symbol is: ${nft.symbol}`);
    console.log(`nft name is: ${nft.name}`);
    console.log(`nft mint is: ${nft.mint}`);
    console.log(`nft update auth is: ${nft.updateAuthority}`);
    console.log("cretors list");
    for (let index = 0; index < nft.creators.length; index++) {
      const creator = nft.creators[index];
      console.log(
        `creator #${index + 1}, verified?[${creator.verified}], share: ${
          creator.share
        }, pubkey: ${creator.address.toBase58()}`
      );
    }
    // console.log((await connection.getTokenAccountsByOwner(phantom_wallet_owner, { mint: element.mint })).value[0].pubkey.toBase58());
    console.log("///////////////////////////////////////");
  }
};

// final_analyzer()
//with first Get if we can't find it in list create it
//with second and more Get we create them in list
//with every other type, just update list
//report list at the end
const qnft_list_analyzer = (qnft_list, userWallet, threshold) => {
  const imported_qnft_list: QNFT[] = qnft_list;

  const qnftviews_final_report: QNFTView[] = [];

  for (let index = 0; index < imported_qnft_list.length; index++) {
    const element = imported_qnft_list[index];
    switch (element.TrasnferType) {
      case NFTMoveType.Get:
        // if (element.Wallet == userWallet && element.Days <= 41 && element.Price > 2.5) {
        if (element.Wallet == userWallet) {
          qnftviews_final_report.push(
            new QNFTView(
              element.Name,
              element.Image,
              element.Mint,
              element.Meta,
              element.TokenAccount,
              element.Price,
              element.Days,
              element.Wallet
            )
          );
        }
        break;
      case NFTMoveType.Miss:
        if (element.Wallet == userWallet) {
          //  qnftviews_final_report.filter(x=>x.TokenAddress == element.TokenAddress)[0].Amount;
          qnftviews_final_report.splice(
            qnftviews_final_report.findIndex((x) => x.Mint == element.Mint),
            1
          );
        }
        break;
      default:
        break;
    }
  }
  for (let index = 0; index < qnftviews_final_report.length; index++) {
    const element = qnftviews_final_report[index];
    element.Index = index;
  }
  return qnftviews_final_report;
};

//Data Entry for Test

//load qualified nfts from user wallet(creator-UpdateAuthority)

//egg-dev1- setting
// const wallet_owner = "7FF1PHWuxtMeVAbnbQ3v1VS2iRrtfH9C7TKmfExXNKyv";

// const nft_update_auth = "HjKitY61PXmHXcWkHnE3Vh7u2E6kHKNWx8xAfHnUuCNw";

// const clusterUrl = "devnet";

// const threshold = 41;

//mainnet
// const wallet_owner = "7kdkJCw6C13bH45mBCCt3vH7BCiavQFJ3rBK1nEZYqsZ";

// const nft_update_auth = "EzfNqQitP9yqjJww2qJMkX1U88LcG9zNWV3B9t7Bu2ar";

// const clusterUrl = "mainnet-beta";

// const threshold = 41;

// const main_wallet_for_test = "5azMeMz6pTG9uiBs1tih9vQEHWJJFgN1HBcQrB1n1U87";

// const approv_Wallet = "5TiCJQjwB6rjVjHrnaJM42tQSeWV28eZ1ZX4Sx3f8Tdf";

// const mint = "FouL256WH5npjt8xzXVJTb2Yicx2FeBmvVdiD5S3XSR7";

// wallet_analyzer_for_nft(clusterUrl, wallet_owner, nft_update_auth, threshold);

// find_collection(clusterUrl, approv_Wallet);

// findNft(clusterUrl, mint);
