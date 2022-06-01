import React from "react";
import style from "../styles/TreasurySet.module.css";

const CreateTreasury = ({ init_treasury }) => {
  const initTreasuryClicked = () => {
    init_treasury();
  };

  return (
    <div className={style.columnContainer}>
      <h1 className={style.title}>Honeyland Refund Admin panel</h1>
      <div className={style.formButton} onClick={initTreasuryClicked}>
        Initialize
      </div>
    </div>
  );
};

export default CreateTreasury;
