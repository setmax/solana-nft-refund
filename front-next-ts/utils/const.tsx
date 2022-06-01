import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import refund from "./idl.json";

export const CLUSTER =
  process.env.REACT_APP_CLUSTER === "mainnet"
    ? "mainnet"
    : process.env.REACT_APP_CLUSTER === "testnet"
    ? "testnet"
    : process.env.REACT_APP_CLUSTER === "devnet"
    ? "devnet"
    : "localnet";

export const SOLANA_HOST = clusterApiUrl("devnet");

// export const SOLANA_HOST = process.env.REACT_APP_SOLANA_API_URL
//   ? process.env.REACT_APP_SOLANA_API_URL
//   : CLUSTER === "mainnet"
//   ? clusterApiUrl("mainnet-beta")
//   : CLUSTER === "testnet"
//   ? clusterApiUrl("testnet")
//   : CLUSTER === "devnet"
//   ? clusterApiUrl("devnet")
//   : "http://localhost:8899";

export const REFUND_PROGRAM_ID = new PublicKey(
  CLUSTER === "localnet"
    ? "622WNfmPwDsWcbTmbURpGHHAokHnD5bdgHYNj6aUE9oo"
    : CLUSTER === "devnet"
    ? "622WNfmPwDsWcbTmbURpGHHAokHnD5bdgHYNj6aUE9oo"
    : ""
);

export const REFUNDABLE_NFT_PUBKEY = new PublicKey(
  "7FF1PHWuxtMeVAbnbQ3v1VS2iRrtfH9C7TKmfExXNKyv"
);

export const OWNER_WALLET = new PublicKey(
  "7FF1PHWuxtMeVAbnbQ3v1VS2iRrtfH9C7TKmfExXNKyv"
);

export const REFUND_IDL = refund;
