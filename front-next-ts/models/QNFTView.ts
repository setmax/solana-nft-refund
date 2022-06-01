class QNFTView {
  Index: number;
  Name: string;
  Image: string;
  Mint: string;
  TokenAccount: string;
  Meta: string;
  Price: number;
  Days: number;
  Wallet: string;
  constructor(name, image, mint, meta, tokenAccount, price, days, wallet) {
    this.Name = name;
    this.Image = image;
    this.Mint = mint;
    this.Meta = meta;
    this.TokenAccount = tokenAccount;
    this.Price = price;
    this.Days = days;
    this.Wallet = wallet;
  }
}

export { QNFTView };
