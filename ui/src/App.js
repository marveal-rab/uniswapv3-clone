import React, { useContext } from "react";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ContractContext } from "./contexts/web3-provider";

function App() {
  const { address, isConnected } = useWeb3ModalAccount();

  const { addLiquidity } = useContext(ContractContext);

  const handleAddLiquidity = (event) => {
    addLiquidity(address);
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
              className="rounded-lg bg-neutral-800 px-3 py-2 text-sm"
              onClick={handleAddLiquidity}
            >
              Add liquidity
            </button>
          </div>
          <div className="my-2 flex w-full gap-2">
            <input
              type="text"
              className="flex-grow rounded-lg bg-neutral-800 px-2 py-3 outline-none"
            />
            <select
              name=""
              id=""
              className="rounded-lg bg-neutral-800 px-1 outline-none"
            >
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
          <div className="my-2 flex w-full gap-2">
            <input
              type="text"
              className="flex-grow rounded-lg bg-neutral-800 px-2 py-3 outline-none"
            />
            <select
              name=""
              id=""
              className="rounded-lg bg-neutral-800 px-1 outline-none"
            >
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
          <button className="mt-4 w-full rounded-lg bg-blue-800 px-2 py-3">
            Swap
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
