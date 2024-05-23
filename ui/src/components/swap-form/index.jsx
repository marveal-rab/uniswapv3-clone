import React, { useContext, useState, useEffect } from "react";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import { ContractContext } from "../../contexts/web3-provider";
import { TfiExchangeVertical } from "react-icons/tfi";

class Token {
  constructor(name, token) {
    this.name = name;
    this.token = token;
  }
}

const TokenSelector = ({ tokens, token, setToken }) => {
  return (
    <select
      className="rounded-lg bg-neutral-800 px-1 outline-none"
      defaultValue={token.name}
    >
      {tokens &&
        tokens.map((el, idx) => {
          return (
            <option
              key={idx}
              value={el.name}
              onClick={() => {
                setToken(el);
              }}
            >
              {el.name}
            </option>
          );
        })}
    </select>
  );
};

const SwapForm = () => {
  const { isConnected } = useWeb3ModalAccount();
  const { addLiquidity, swap, quote, ethToken, usdcToken } =
    useContext(ContractContext);

  const [amount, setAmount] = useState();
  const [sourceToken, setSourceToken] = useState();
  const [targetToken, setTargetToken] = useState();
  const [tokens, setTokens] = useState();
  const [zeroForOne, setZeroForOne] = useState(true);
  const [quoteAmount, setQuoteAmount] = useState();

  const handleAddLiquidity = async (event) => {
    await addLiquidity();
  };

  const handleSwap = async (event) => {
    event.stopPropagation();
    await swap(amount, sourceToken.token, targetToken.token);
  };

  const handleChangeInput = async (event) => {
    const value = event.target.value;
    if (value === "" || value === "0" || value === undefined) {
      return;
    }

    setAmount(event.target.value);

    const ans = await quote(event.target.value, zeroForOne);
    setQuoteAmount(ans);
  };

  useEffect(() => {
    const token0 = new Token("ETH", ethToken);
    const token1 = new Token("USDC", usdcToken);
    setTokens([token0, token1]);
    setSourceToken(token1);
    setTargetToken(token0);
  }, [ethToken, usdcToken]);

  return (
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
          placeholder="0"
        />
        {sourceToken && (
          <TokenSelector
            tokens={tokens}
            token={sourceToken}
            setToken={setSourceToken}
          />
        )}
      </div>
      <div className="flex w-full justify-center">
        <button className="rounded-xl bg-neutral-800 p-3">
          <TfiExchangeVertical />
        </button>
      </div>
      <div className="my-2 flex w-full gap-2">
        <input
          type="text"
          className="flex-grow rounded-lg bg-neutral-800 p-3 outline-none"
          readOnly={true}
          value={quoteAmount}
        />
        {targetToken && (
          <TokenSelector
            tokens={tokens}
            token={targetToken}
            setToken={setTargetToken}
            placeholder="0"
          />
        )}
      </div>
      <button
        disabled={!isConnected}
        className="mt-4 w-full rounded-lg bg-blue-800 px-2 py-3 disabled:cursor-not-allowed disabled:text-neutral-500"
        onClick={handleSwap}
      >
        Swap
      </button>
    </div>
  );
};

export default SwapForm;
