import ERC20Abi from "../abi/ERC20.json";
import UniswapV3PoolAbi from "../abi/UniswapV3Pool.json";
import UniswapV3ManagerAbi from "../abi/UniswapV3Manager.json";
import UniswapV3QuoterAbi from "../abi/UniswapV3Quoter.json";
import { ethers } from "ethers";

const erc20Abi = new ethers.utils.Interface(ERC20Abi.abi).format(
  ethers.utils.FormatTypes.minimal,
);
const managerAbi = new ethers.utils.Interface(UniswapV3ManagerAbi.abi).format(
  ethers.utils.FormatTypes.minimal,
);
const poolAbi = new ethers.utils.Interface(UniswapV3PoolAbi.abi).format(
  ethers.utils.FormatTypes.minimal,
);
const quoterAbi = new ethers.utils.Interface(UniswapV3QuoterAbi.abi).format(
  ethers.utils.FormatTypes.minimal,
);

export const Contracts = {
  ETH: {
    address: process.env.REACT_APP_ETH_ADDRESS,
    abi: erc20Abi,
  },
  USDC: {
    address: process.env.REACT_APP_USDC_ADDRESS,
    abi: erc20Abi,
  },
  MANAGER: {
    address: process.env.REACT_APP_MANAGER_ADDRESS,
    abi: managerAbi,
  },
  POOL: {
    address: process.env.REACT_APP_POOL_ADDRESS,
    abi: poolAbi,
  },
  QUOTER: {
    address: process.env.REACT_APP_QUOTER_ADDRESS,
    abi: quoterAbi,
  },
};

export function getContract(contractKind, signer) {
  const { address, abi } = Contracts[contractKind];
  return new ethers.Contract(address, abi, signer);
}
