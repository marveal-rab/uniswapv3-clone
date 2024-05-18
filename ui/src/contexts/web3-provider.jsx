import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { createContext, useEffect, useState } from "react";
import { ethers } from "ethers";

// 1. Get projectId
const projectId = process.env.REACT_APP_PROJECT_ID;

// 2. Set chains
const mainnet = {
  chainId: 1,
  name: "Ethereum",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: "https://cloudflare-eth.com",
};

// 3. Create a metadata object
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: mainnet.rpcUrl, // used for the Coinbase SDK
  defaultChainId: mainnet.chainId, // used for the Coinbase SDK
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

export const ContractContext = createContext();

const ContractProvider = ({ children }) => {
  const { walletProvider } = useWeb3ModalProvider();

  const [manager, setManager] = useState();
  const [ethToken, setETHToken] = useState();
  const [usdcToken, setUSDCToken] = useState();

  const ethTokenAddress = "";
  const ethTokenAbi = [];

  const usdcTokenAddress = "";
  const usdcTokenAbi = [];

  const managerAddress = "";
  const managerAbi = [];

  const poolAddress = "";
  const poolAbi = [];

  useEffect(() => {
    // setETHToken(
    //   new Contract(
    //     ethTokenAddress,
    //     ethTokenAbi,
    //     new BrowserProvider(walletProvider).getSigner(),
    //   ),
    // );
    // setUSDCToken(
    //   new Contract(
    //     usdcTokenAddress,
    //     usdcTokenAbi,
    //     new BrowserProvider(walletProvider).getSigner(),
    //   ),
    // );
    // setManager(
    //   new Contract(
    //     managerAddress,
    //     managerAbi,
    //     new BrowserProvider(walletProvider).getSigner(),
    //   ),
    // );
  }, [walletProvider]);

  const addLiquidity = async (account) => {
    const token0 = ethToken;
    const token1 = usdcToken;
    if (!token0 || !token1) {
      return;
    }
    const amount0 = ethers.parseEther("0.998976618347425280");
    const amount1 = ethers.parseEther("5000"); // 5000 USDC
    const lowerTick = 84222;
    const upperTick = 86129;
    const liquidity = ethers.getBigInt("1517882343751509868544");

    const extra = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address"],
      [token0.address, token1.address, account],
    );

    Promise.all([
      token0.allowance(account, managerAddress),
      token1.allowance(account, managerAddress),
    ])
      .then(async ([allowance0, allowance1]) => {
        return Promise.all([
          Promise.resolve().then(() => {
            if (allowance0.lt(amount0)) {
              return token0.approve(managerAddress, amount0).then((tx) => {
                tx.wait();
              });
            }
          }),
          Promise.resolve().then(() => {
            if (allowance1.lt(amount1)) {
              return token1.approve(managerAddress, amount1).then((tx) => {
                tx.wait();
              });
            }
          }),
        ])
          .then(() => {
            return manager
              .mint(poolAddress, lowerTick, upperTick, liquidity, extra)
              .then((tx) => {
                tx.wait();
              });
          })
          .then(() => {
            alert("add liquidity success");
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  };
  return (
    <ContractContext.Provider
      value={{
        addLiquidity,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export default function Web3Provider({ children }) {
  return <ContractProvider>{children}</ContractProvider>;
}
