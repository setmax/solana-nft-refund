import { PublicKey } from "@solana/web3.js";

class QNFT {
  Name: string;
  Image: string;
  Mint: string;
  TokenAccount: string;
  Meta: PublicKey;
  Uri: string;
  Price: number;
  Amount: number;
  Days: number;
  Wallet: string;
  TrasnferType: NFTMoveType;
  Tx: string;

  constructor() {}
}

enum NFTMoveType {
  Miss = "Miss",
  Hold = "Hold",
  Get = "Get",
  Rich = "Rich",
  poor = "Poor",
}

export { NFTMoveType, QNFT };
