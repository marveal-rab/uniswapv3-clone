// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "forge-std/Script.sol";
import "../test/ERC20Mintable.sol";
import "../src/UniswapV3Pool.sol";
import "../src/UniswapV3Manager.sol";
import "../src/UniswapV3Quoter.sol";

contract DeployDevelopment is Script {
    // COMMAND: forge script script/DeployDevelopment.s.sol:DeployDevelopment --rpc-url http://127.0.0.1:8545 --broadcast -vvvv --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    function run() public {
        uint256 wethBalance = 1 ether;
        uint256 usdcBalance = 5042 ether;
        int24 currentTick = 85176;
        uint160 currentSqrtP = 5602277097478614198912276234240;

        vm.startBroadcast();
        ERC20Mintable token0 = new ERC20Mintable("Wrapped Ether", "WETH", 18);
        ERC20Mintable token1 = new ERC20Mintable("USD Coin", "USDC", 18);

        UniswapV3Pool pool = new UniswapV3Pool(address(token0), address(token1), currentSqrtP, currentTick);

        UniswapV3Manager manager = new UniswapV3Manager();
        UniswapV3Quoter quoter = new UniswapV3Quoter();

        token0.mint(msg.sender, wethBalance);
        token1.mint(msg.sender, usdcBalance);

        vm.stopBroadcast();

        console.log("WETH address", address(token0));
        console.log("USDC address", address(token1));
        console.log("Pool address", address(pool));
        console.log("Manager address", address(manager));
        console.log("Quoter address", address(quoter));
    }
}
