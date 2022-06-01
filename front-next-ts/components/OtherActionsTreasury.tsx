import React, { useEffect, useState } from "react";
import style from "../styles/TreasurySet.module.css";
import logo from "../assets/logo.png";
import Image from "next/image";

const OtherActionsTreasury = ({
  deposit_treasury,
  withdraw_treasury,
  get_current_sol,
  create_nft,
}) => {
  const [amount, setAmount] = useState("");
  const [userWallet, setUserWallet] = useState("");
  const [treasuryBalance, setTreasuryBalance] = useState("");
  const [log, setLog] = useState("");

  const withdraw = async () => {
    const result = await withdraw_treasury();
    setLog(result);
    setTreasuryBalance("0 sol");
  };
  const deposit = async () => {
    const result = await deposit_treasury(Number(amount));
    setLog(result);
    let balance = await get_current_sol();
    setTreasuryBalance(balance);
    console.log(balance);
  };

  const createNFT = async () => {
    const result = await create_nft(userWallet);
    setLog(result);
  };

  useEffect(() => {
    get_treasury_balance();
  });

  const get_treasury_balance = async () => {
    let balance = await get_current_sol();
    setTreasuryBalance(balance);
  };

  return (
    <div className={style.columnContainer}>
      {/* <Image src={logo} alt="honeyland" className={style.formImage} /> */}
      <h1 className={style.title}>Honeyland Refund Admin Panel(Basic)</h1>
      <h4>{treasuryBalance}</h4>
      <div className={style.rowContainer}>
        <div className={style.refundForm}>
          <div className={style.inputField}>
            <div className={style.inputTitle}>Amount of sol?</div>
            <div className={style.inputContainer}>
              <input
                className={style.input}
                type="text"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className={style.formButton} onClick={deposit}>
            deposit
          </div>
        </div>
        <div className={style.refundForm}>
          <div className={style.inputLabel}>
            Close Refund With Clicking on Withdraw
          </div>
          <div className={style.formButton} onClick={withdraw}>
            withdraw
          </div>
        </div>
      </div>
      <div className={style.rowContainer}>
        <div className={style.refundForm}>
          <div className={style.inputField}>
            <div className={style.inputTitle}>Wallet Address?</div>
            <div className={style.inputContainer}>
              <input
                className={style.input}
                type="text"
                onChange={(e) => setUserWallet(e.target.value)}
              />
            </div>
          </div>
          <div className={style.formButton} onClick={createNFT}>
            Create NFT
          </div>
        </div>
      </div>
      <div className={style.refundForm}>
        <p>{log}</p>
      </div>
    </div>
  );
};

export default OtherActionsTreasury;
