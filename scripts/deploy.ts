import hre from "hardhat";
import DeployModule, { TokenModule } from "../ignition/modules/Deploy";

async function main() {
  const { wethToken, usdcToken } = await hre.ignition.deploy(TokenModule);
  const wethTokenAddress = await wethToken.getAddress();
  const usdcTokenAddress = await usdcToken.getAddress();

  const { pool, manager, quoter } = await hre.ignition.deploy(DeployModule, {
    parameters: {
      DeployModule: {
        wethTokenAddress,
        usdcTokenAddress,
      },
    },
  });

  console.log("wethTokenAddress", wethTokenAddress);
  console.log("usdcTokenAddress", usdcTokenAddress);
  console.log("pool", await pool.getAddress());
  console.log("manager", await manager.getAddress());
  console.log("quoter", await quoter.getAddress());
}

main().catch(console.error);
