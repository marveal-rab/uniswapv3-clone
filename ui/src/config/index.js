import ERC20Abi from "../abi/ERC20.json";
import UniswapV3PoolAbi from "../abi/UniswapV3Pool.json";
import UniswapV3ManagerAbi from "../abi/UniswapV3Manager.json";
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

export const Contracts = {
  ETH: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: erc20Abi,
  },
  USDC: {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    abi: erc20Abi,
  },
  MANAGER: {
    address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    abi: managerAbi,
  },
  POOL: {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    abi: poolAbi,
  },
};
