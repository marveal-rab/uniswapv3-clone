import ERC20Abi from "@/artifacts/contracts/ERC20Mintable.sol/ERC20Mintable.json";
import UniswapV3PoolAbi from "@/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import UniswapV3ManagerAbi from "@/artifacts/contracts/UniswapV3Manager.sol/UniswapV3Manager.json";
import UniswapV3QuoterAbi from "@/artifacts/contracts/UniswapV3Quoter.sol/UniswapV3Quoter.json";
import { ethers } from "ethers";

const erc20Abi = new ethers.Interface(ERC20Abi.abi).format(true);
const managerAbi = new ethers.Interface(UniswapV3ManagerAbi.abi).format(
  true
);
const poolAbi = new ethers.Interface(UniswapV3PoolAbi.abi).format(
  true
);
const quoterAbi = new ethers.Interface(UniswapV3QuoterAbi.abi).format(
 true
);

interface Contract {
  address: string | undefined;
  abi: Array<string>;
}

export const Contracts: Record<string, Contract> = {
  ETH: {
    address: process.env.NEXT_PUBLIC_ETH_ADDRESS,
    abi: erc20Abi,
  },
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    abi: erc20Abi,
  },
  MANAGER: {
    address: process.env.NEXT_PUBLIC_MANAGER_ADDRESS,
    abi: managerAbi,
  },
  POOL: {
    address: process.env.NEXT_PUBLIC_POOL_ADDRESS,
    abi: poolAbi,
  },
  QUOTER: {
    address: process.env.NEXT_PUBLIC_QUOTER_ADDRESS,
    abi: quoterAbi,
  },
};

export function getContract(contractKind: string, signer: any) {
  const { address, abi } = Contracts[contractKind];
  if (!address || !abi) {
    throw new Error("Contract not found: " + contractKind);
  }
  return new ethers.Contract(address, abi, signer);
}
