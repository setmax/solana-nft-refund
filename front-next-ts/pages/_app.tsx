import "../styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "@solana/wallet-adapter-react-ui/styles.css";
import NextNProgress from "nextjs-progressbar";

function MyApp({ Component, pageProps }) {
  const WalletConnectProvider = dynamic(
    () => import("../context/WalletConnectionProvider"),
    { ssr: false }
  );

  return (
    <WalletConnectProvider>
      <NextNProgress />
      <Component {...pageProps} />
    </WalletConnectProvider>
  );
}

export default MyApp;
