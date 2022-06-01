import type { NextPage } from "next";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import UserView from "../components/UserView";

const Home: NextPage = () => {
  const { connected } = useWallet();

  return (
    <div className="app">
      {connected ? (
        <UserView />
      ) : (
        <div className="loginWalletContainer">
          <div className="loginWalletTitle">Log in to Honeyland</div>
          <div className="loginWalletSubTitle">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt,
            facilis!
          </div>
          <WalletMultiButton />
        </div>
      )}
    </div>
  );
};

export default Home;

/**
 * index
 * if user:
 * connected? yes: load wallet nfts ----- no: wait for wallet connection
 * load wallet nfts---->from wallet analyzer---->nft with price lable and button of refund
 * if admin:
 * if(tresury exist) show deposit withdraw button
 * if(!treasury exist) show create button
 *
 */
