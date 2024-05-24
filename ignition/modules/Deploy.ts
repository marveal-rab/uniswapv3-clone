import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";

const WETH_BALANCE = hre.ethers.parseEther("1");
const USDC_BALANCE = hre.ethers.parseEther("5042");
const CURRENT_TICK = 85176;
const CURRENT_SQRT_P = hre.ethers.toBigInt("5602277097478614198912276234240");
let account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const TokenModule = buildModule("TokenModule", (m) => {
  const wethBalance = m.getParameter("wethBalance", WETH_BALANCE);
  const usdcBalance = m.getParameter("usdcBalance", USDC_BALANCE);

  const wethToken = m.contract("ERC20Mintable", ["Wrapped Ether", "WETH"], {
    id: "wethToken",
  });
  const usdcToken = m.contract("ERC20Mintable", ["USD Coin", "USDC"], {
    id: "usdcToken",
  });

  m.call(wethToken, "mint", [account, wethBalance]);
  m.call(usdcToken, "mint", [account, usdcBalance]);

  return { wethToken, usdcToken };
});

export default buildModule("DeployModule", (m) => {
  const wethTokenAddress = m.getParameter("wethTokenAddress");
  const usdcTokenAddress = m.getParameter("usdcTokenAddress");
  const currentTick = m.getParameter("currentTick", CURRENT_TICK);
  const currentSqrtP = m.getParameter("currentSqrtP", CURRENT_SQRT_P);

  const pool = m.contract("UniswapV3Pool", [
    wethTokenAddress,
    usdcTokenAddress,
    currentSqrtP,
    currentTick,
  ]);

  const manager = m.contract("UniswapV3Manager", [], {
    after: [pool],
  });

  const quoter = m.contract("UniswapV3Quoter", [], {
    after: [pool],
  });

  return { pool, manager, quoter };
});
