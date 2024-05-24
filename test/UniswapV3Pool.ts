import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("UniswapV3", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMintFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const ERC20Mintable = await hre.ethers.getContractFactory("ERC20Mintable");
    const token0 = await ERC20Mintable.deploy("Wrapped Ether", "WETH");
    const token1 = await ERC20Mintable.deploy("USD Coin", "USDC");
    const UniswapV3Pool = await hre.ethers.getContractFactory("UniswapV3Pool");
    const UniswapV3Manager = await hre.ethers.getContractFactory(
      "UniswapV3Manager"
    );
    const TestUniswapV3Pool = await hre.ethers.getContractFactory(
      "TestUniswapV3Pool"
    );

    const params = {
      wethBalance: hre.ethers.parseEther("1"),
      usdcBalance: hre.ethers.parseEther("5000"),
      currentTick: "85176",
      lowerTick: "84222",
      upperTick: "86129",
      liquidity: "1517882343751509868544",
      currentSqrtP: "5602277097478614198912276234240",
      transferInMintCallback: true,
      transferInSwapCallback: true,
      mintLiqudity: true,
    };

    await token0.mint(owner.address, params.wethBalance);
    await token1.mint(owner.address, params.usdcBalance);

    const uniswapV3Pool = await UniswapV3Pool.deploy(
      await token0.getAddress(),
      await token1.getAddress(),
      params.currentSqrtP,
      params.currentTick
    );
    let poolBalance0, poolBalance1;

    const testUniswapV3Pool = await TestUniswapV3Pool.deploy(
      params.transferInMintCallback,
      params.transferInSwapCallback
    );

    const testUniswapV3PoolAddress = await testUniswapV3Pool.getAddress();
    console.log("testUniswapV3PoolAddress", testUniswapV3PoolAddress);

    if (params.mintLiqudity) {
      const tx = await uniswapV3Pool.mint(
        owner.address,
        params.lowerTick,
        params.upperTick,
        params.liquidity,
        hre.ethers.hexlify(hre.ethers.toUtf8Bytes("")),
        {
          from: testUniswapV3PoolAddress,
        }
      );
      const reciept = await tx.wait();
      console.log(reciept);
    }

    return {
      owner,
      token0,
      token1,
      poolBalance0,
      poolBalance1,
      transferInMintCallback: params.transferInMintCallback,
      params,
    };
  }

  describe("Mint", async function () {
    it("pool balance should be equal", async function () {
      const { owner, token0, token1, poolBalance0, poolBalance1, params } =
        await loadFixture(deployMintFixture);
      expect(poolBalance0).to.equal(
        hre.ethers.parseEther("0.99897661834742528")
      );
      expect(poolBalance1).to.equal(hre.ethers.parseEther("5000"));
    });
  });

  describe("Swap", function () {});
});
