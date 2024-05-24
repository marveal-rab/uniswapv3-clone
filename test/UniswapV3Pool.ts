import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

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

/**
 * // SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "forge-std/Test.sol";
import "./ERC20Mintable.sol";
import "../src/UniswapV3Pool.sol";

contract UniswapV3PoolTest is Test {
    ERC20Mintable token0;
    ERC20Mintable token1;
    UniswapV3Pool pool;

    bool transferInMintCallback = true;
    bool transferInSwapCallback = true;

    struct TestCaseParams {
        uint256 wethBalance;
        uint256 usdcBalance;
        int24 currentTick;
        int24 lowerTick;
        int24 upperTick;
        uint128 liquidity;
        uint160 currentSqrtP;
        bool transferInMintCallback;
        bool transferInSwapCallback;
        bool mintLiqudity;
    }

    function setUp() public {
        token0 = new ERC20Mintable("Ether", "ETH", 18);
        token1 = new ERC20Mintable("USDC", "USDC", 18);
    }

    function testMintSuccess() public {
        TestCaseParams memory params = TestCaseParams({
            wethBalance: 1 ether,
            usdcBalance: 5000 ether,
            currentTick: 85176,
            lowerTick: 84222,
            upperTick: 86129,
            liquidity: 1517882343751509868544,
            currentSqrtP: 5602277097478614198912276234240,
            transferInMintCallback: true,
            transferInSwapCallback: true,
            mintLiqudity: true
        });

        (uint256 poolBalance0, uint256 poolBalance1) = setupTestCase(params);

        uint256 expectedAmount0 = 0.99897661834742528 ether;
        uint256 expectedAmount1 = 5000 ether;
        assertEq(poolBalance0, expectedAmount0, "incorrect token0 deposited amount");
        assertEq(poolBalance1, expectedAmount1, "incorrect token1 deposited amount");

        assertEq(token0.balanceOf(address(pool)), expectedAmount0, "unexpected token0 balance");
        assertEq(token1.balanceOf(address(pool)), expectedAmount1, "unexpected token1 balance");
        bytes32 positionKey = keccak256(abi.encodePacked(address(this), params.lowerTick, params.upperTick));
        uint128 posLiquidity = pool.positions(positionKey);
        assertEq(posLiquidity, params.liquidity, "unexpected liquidity in position");

        (bool tickInitialized, uint128 tickLiquidity) = pool.ticks(params.lowerTick);
        assertTrue(tickInitialized, "unexpected lower tick initialization");
        assertEq(tickLiquidity, params.liquidity, "unexpected liquidity in lower tick");

        (tickInitialized, tickLiquidity) = pool.ticks(params.upperTick);
        assertTrue(tickInitialized, "unexpected upper tick initialization");
        assertEq(tickLiquidity, params.liquidity, "unexpected liquidity in upper tick");

        (uint160 sqrtPriceX96, int24 tick) = pool.slot0();
        assertEq(sqrtPriceX96, 5602277097478614198912276234240, "invalid current sqrtP");
        assertEq(tick, 85176, "invalid current tick");
        assertEq(pool.liquidity(), 1517882343751509868544, "invalid current liquidity");
    }

    function testSwapBuyEth() public {
        TestCaseParams memory params = TestCaseParams({
            wethBalance: 1 ether,
            usdcBalance: 5000 ether,
            currentTick: 85176,
            lowerTick: 84222,
            upperTick: 86129,
            liquidity: 1517882343751509868544,
            currentSqrtP: 5602277097478614198912276234240,
            transferInMintCallback: true,
            transferInSwapCallback: true,
            mintLiqudity: true
        });
        (uint256 poolBalance0, uint256 poolBalance1) = setupTestCase(params);

        uint256 swapAmount = 42 ether;
        token1.mint(address(this), swapAmount);
        token1.approve(address(this), swapAmount);

        int256 userBalance0Before = int256(token0.balanceOf(address(this)));

        (int256 amount0Delta, int256 amount1Delta) = pool.swap(address(this), true, 42 ether, "");

        assertEq(amount0Delta, -0.008396714242162444 ether, "invalid ETH out");
        assertEq(amount1Delta, 42 ether, "invalid USDC in");

        assertEq(
            token0.balanceOf(address(this)), uint256(userBalance0Before - amount0Delta), "invalid user ETH balance"
        );
        assertEq(token1.balanceOf(address(this)), 0, "invalid user USDC balance");

        assertEq(
            token0.balanceOf(address(pool)), uint256(int256(poolBalance0) + amount0Delta), "invalid pool ETH balance"
        );
        assertEq(
            token1.balanceOf(address(pool)), uint256(int256(poolBalance1) + amount1Delta), "invalid pool USDC balance"
        );

        (uint160 sqrtPriceX96, int24 tick) = pool.slot0();
        assertEq(sqrtPriceX96, 5604469350942327889444743441197, "invalid current sqrtP");
        assertEq(tick, 85184, "invalid current tick");
        assertEq(pool.liquidity(), 1517882343751509868544, "invalid current liquidity");
    }

    // ******************************************************
    // Helper functions
    // ******************************************************
    function setupTestCase(TestCaseParams memory params)
        internal
        returns (uint256 poolBalance0, uint256 poolBalance1)
    {
        token0.mint(address(this), params.wethBalance);
        token1.mint(address(this), params.usdcBalance);

        pool = new UniswapV3Pool(address(token0), address(token1), params.currentSqrtP, params.currentTick);

        if (params.mintLiqudity) {
            (poolBalance0, poolBalance1) =
                pool.mint(address(this), params.lowerTick, params.upperTick, params.liquidity, "");
        }
        transferInMintCallback = params.transferInMintCallback;
        transferInSwapCallback = params.transferInSwapCallback;
    }

    function uniswapV3MintCallback(uint256 amount0, uint256 amount1, bytes calldata data) public {
        if (transferInMintCallback) {
            UniswapV3Pool.CallbackData memory extra = abi.decode(data, (UniswapV3Pool.CallbackData));
            IERC20(extra.token0).transferFrom(extra.payer, msg.sender, amount0);
            IERC20(extra.token1).transferFrom(extra.payer, msg.sender, amount1);
        }
    }

    function uniswapV3SwapCallback(int256 amount0, int256 amount1, bytes calldata data) public {
        if (transferInSwapCallback) {
            UniswapV3Pool.CallbackData memory extra = abi.decode(data, (UniswapV3Pool.CallbackData));
            if (amount0 > 0) {
                IERC20(extra.token0).transferFrom(extra.payer, msg.sender, uint256(amount0));
            }

            if (amount1 > 0) {
                IERC20(extra.token1).transferFrom(extra.payer, msg.sender, uint256(amount1));
            }
        }
    }
}

 */

describe("UniswapV3", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMintFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // deploy token
    const ERC20Mintable = await hre.ethers.getContractFactory("ERC20Mintable");
    const token0 = await ERC20Mintable.deploy("Wrapped Ether", "WETH");
    const token1 = await ERC20Mintable.deploy("USD Coin", "USDC");
    const token0Address = await token0.getAddress();
    const token1Address = await token1.getAddress();

    // deploy pool
    const UniswapV3Pool = await hre.ethers.getContractFactory("UniswapV3Pool");
    const TestUniswapV3Pool = await hre.ethers.getContractFactory(
      "TestUniswapV3Pool"
    );
    const uniswapV3Pool = await UniswapV3Pool.deploy(
      await token0.getAddress(),
      await token1.getAddress(),
      params.currentSqrtP,
      params.currentTick
    );
    const testUniswapV3Pool = await TestUniswapV3Pool.deploy(
      params.transferInMintCallback,
      params.transferInSwapCallback
    );
    const testUniswapV3PoolAddress = await testUniswapV3Pool.getAddress();
    const uniswapV3PoolAddress = await uniswapV3Pool.getAddress();

    const UniswapV3Manager = await hre.ethers.getContractFactory(
      "UniswapV3Manager"
    );

    await token0.mint(owner.address, params.wethBalance);
    await token1.mint(owner.address, params.usdcBalance);

    let poolBalance0, poolBalance1;

    const extra = hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address"],
      [token0Address, token1Address, owner.address]
    );

    if (params.mintLiqudity) {
      const tx = await testUniswapV3Pool.mint(
        uniswapV3PoolAddress,
        params.lowerTick,
        params.upperTick,
        params.liquidity,
        extra
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
