import { PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";

export class TransactionDetail {
  Owner: String;
  paytype: String;
  date: number;
  balanceChange: number;
  transactionAccount: PublicKey;

  constructor(accountData) {
    this.transactionAccount = accountData.publickey;
    this.Owner = accountData.user;
    this.date = accountData.timestamp.toString();
    this.paytype = accountData.paytype;
    this.balanceChange = accountData.lamports;
  }

  get key() {
    return this.transactionAccount.toBase58();
  }

  get created_at() {
    return dayjs.unix(this.date).format("lll");
  }

  get toString() {
    return `paytype: ${this.paytype} and owner: ${this.Owner} and balance changed through this tx is: ${this.balanceChange}`;
  }
}
