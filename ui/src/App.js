import React, { useContext, useState } from "react";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import { ContractContext } from "./contexts/web3-provider";

const TokenSelector = ({ tokens, setToken }) => {
  return (
    <select
      name=""
      id=""
      className="rounded-lg bg-neutral-800 px-1 outline-none"
    >
      {tokens.map((el, idx) => {
        return (
          <option
            key={idx}
            value={el.name}
            onClick={() => {
              setToken(el.token);
            }}
          >
            {el.name}
          </option>
        );
      })}
    </select>
  );
};

function App() {
  const { isConnected } = useWeb3ModalAccount();
  const { addLiquidity, swap, ethToken, usdcToken } =
    useContext(ContractContext);

  const [amount, setAmount] = useState();
  const [sourceToken, setSourceToken] = useState();
  const [targetToken, setTargetToken] = useState();

  const tokens = [
    {
      name: "ETH",
      token: ethToken,
    },
    {
      name: "USDC",
      token: usdcToken,
    },
  ];

  const handleAddLiquidity = async (event) => {
    await addLiquidity();
  };

  const handleSwap = async (event) => {
    event.stopPropagation();
    await swap(amount, sourceToken, targetToken);
  };

  const handleChangeInput = (event) => {
    setAmount(event.target.value);
  };

  return (
    <div className="h-screen w-screen bg-black text-neutral-100">
      <header className="flex h-20 w-full flex-row-reverse items-center bg-neutral-900 px-8">
        <w3m-button />
      </header>
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="w-[520px] rounded-xl bg-neutral-900 px-16 py-8">
          <div className="my-4 flex items-center justify-between px-1">
            <span className="text-2xl font-bold">Swap tokens</span>
            <button
              disabled={!isConnected}
              className="rounded-lg bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 hover:text-neutral-300 disabled:cursor-not-allowed disabled:text-neutral-500"
              onClick={handleAddLiquidity}
            >
              Add liquidity
            </button>
          </div>
          <div className="my-2 flex w-full gap-2">
            <input
              type="text"
              className="flex-grow rounded-lg bg-neutral-800 p-3 outline-none"
              onChange={handleChangeInput}
            />
            <TokenSelector tokens={tokens} setToken={setSourceToken} />
          </div>
          <div className="my-2 flex w-full gap-2">
            <input
              type="text"
              className="flex-grow rounded-lg bg-neutral-800 p-3 outline-none"
            />
            <TokenSelector tokens={tokens} setToken={setTargetToken} />
          </div>
          <button
            disabled={!isConnected}
            className="mt-4 w-full rounded-lg bg-blue-800 px-2 py-3 disabled:cursor-not-allowed disabled:text-neutral-500"
            onClick={handleSwap}
          >
            Swap
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
