import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers5/react";
import { ethers } from "ethers";
import { createContext, useEffect, useState } from "react";
import { Contracts } from "../config";

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
const anvil = {
  chainId: 31337,
  name: "Anvil",
  currency: "ETH",
  // explorerUrl: "https://etherscan.io",
  rpcUrl: "http://127.0.0.1:8545",
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
  chains: [mainnet, anvil],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

export const ContractContext = createContext();

const ContractProvider = ({ children }) => {
  const { address: account, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [manager, setManager] = useState();
  const [ethToken, setETHToken] = useState();
  const [usdcToken, setUSDCToken] = useState();

  useEffect(() => {
    const init = async () => {
      if (isConnected) {
        const signer = new ethers.providers.Web3Provider(
          walletProvider,
        ).getSigner();
        setETHToken(
          new ethers.Contract(Contracts.ETH.address, Contracts.ETH.abi, signer),
        );
        setUSDCToken(
          new ethers.Contract(
            Contracts.USDC.address,
            Contracts.USDC.abi,
            signer,
          ),
        );
        setManager(
          new ethers.Contract(
            Contracts.MANAGER.address,
            Contracts.MANAGER.abi,
            signer,
          ),
        );
      }
    };
    init();
    return () => {
      setManager(undefined);
      setETHToken(undefined);
      setUSDCToken(undefined);
    };
  }, [walletProvider, isConnected]);

  const addLiquidity = async () => {
    const token0 = ethToken;
    const token1 = usdcToken;
    if (!token0 || !token1) {
      return;
    }
    const amount0 = ethers.utils.parseEther("0.998976618347425280");
    const amount1 = ethers.utils.parseEther("5000"); // 5000 USDC
    const lowerTick = 84222;
    const upperTick = 86129;
    const liquidity = ethers.BigNumber.from("1517882343751509868544");

    const extra = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "address"],
      [token0.address, token1.address, account],
    );

    const managerAddress = manager.address;

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
              .mint(
                Contracts.POOL.address,
                lowerTick,
                upperTick,
                liquidity,
                extra,
              )
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

  const swap = async (amount, token, targetToken) => {
    const token0 = ethToken;
    const token1 = usdcToken;
    if (!token0 || !token1) {
      return;
    }
    const amountWei = ethers.utils.parseEther(amount);
    const extra = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "address"],
      [await token0.getAddress(), await token1.getAddress(), account],
    );
    token
      .allowance(account, Contracts.MANAGER.address)
      .then((allowance) => {
        if (allowance.lt(amountWei)) {
          return token
            .approve(Contracts.MANAGER.address, amountWei)
            .then((tx) => tx.wait());
        }
      })
      .then(() => {
        return manager
          .swap(Contracts.POOL.address, extra)
          .then((tx) => tx.wait());
      })
      .then(() => {
        alert("Swap succeeded!");
      })
      .catch((err) => {
        console.error(err);
        alert("Failed!");
      });
  };

  return (
    <ContractContext.Provider
      value={{
        addLiquidity,
        swap,
        ethToken,
        usdcToken,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export default function Web3Provider({ children }) {
  return <ContractProvider>{children}</ContractProvider>;
}
