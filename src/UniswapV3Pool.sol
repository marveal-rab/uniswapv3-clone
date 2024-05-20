// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {Tick} from "./lib/Tick.sol";
import {Position} from "./lib/Position.sol";
import {Error} from "./lib/Error.sol";
import {IERC20} from "./interface/IERC20.sol";
import {IUniswapV3MintCallback} from "./interface/IUniswapV3MintCallback.sol";
import {IUniswapV3SwapCallback} from "./interface/IUniswapV3SwapCallback.sol";

contract UniswapV3Pool {
    using Tick for mapping(int24 => Tick.Info);
    using Position for mapping(bytes32 => Position.Info);
    using Position for Position.Info;

    event Mint(
        address sender,
        address indexed owner,
        int24 indexed lowerTick,
        int24 indexed upperTick,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );

    event Swap(
        address indexed sender,
        address indexed receipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 indexed tick
    );

    int24 internal constant MIN_TICK = -887272;
    int24 internal constant MAX_TICK = -MIN_TICK;

    // Pool tokens, immutable
    address public immutable token0;
    address public immutable token1;

    // Packing variables that are read together
    struct Slot0 {
        // Current sqrt(P)
        uint160 sqrtPriceX96;
        // Current tick
        int24 tick;
    }

    Slot0 public slot0;

    // Amount of liquidity, L.
    uint128 public liquidity;

    // Ticks info
    mapping(int24 => Tick.Info) public ticks;
    // Positions info
    mapping(bytes32 => Position.Info) public positions;

    struct CallbackData {
        address token0;
        address token1;
        address payer;
    }

    constructor(address _token0, address _token1, uint160 _sqrtPriceX96, int24 _tick) {
        token0 = _token0;
        token1 = _token1;
        slot0 = Slot0({sqrtPriceX96: _sqrtPriceX96, tick: _tick});
    }

    function mint(
        // the token address of owner
        address owner,
        // the lower tick
        int24 lowerTick,
        // the upper tick
        int24 upperTick,
        // the amount of liquidity to mint
        uint128 amount,
        // the calldata
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1) {
        if (lowerTick >= upperTick || lowerTick < MIN_TICK || upperTick > MAX_TICK) {
            revert Error.InvertTickRange();
        }
        if (amount == 0) {
            revert Error.ZeroLiquidity();
        }

        ticks.update(lowerTick, amount);
        ticks.update(upperTick, amount);

        Position.Info storage position = positions.get(owner, lowerTick, upperTick);
        position.update(amount);

        amount0 = 0.99897661834742528 ether;
        amount1 = 5000 ether;

        liquidity += uint128(amount);

        uint256 balance0Before;
        uint256 balance1Before;
        if (amount0 > 0) {
            balance0Before = balance0();
        }
        if (amount1 > 0) {
            balance1Before = balance1();
        }
        IUniswapV3MintCallback(msg.sender).uniswapV3MintCallback(amount0, amount1, data);
        if (amount0 > 0 && balance0Before + amount0 > balance0()) {
            revert Error.InsufficientInputAmount();
        }
        if (amount1 > 0 && balance1Before + amount1 > balance1()) {
            revert Error.InsufficientInputAmount();
        }
        emit Mint(msg.sender, owner, lowerTick, upperTick, amount, amount0, amount1);
    }

    function swap(address receipient, bytes calldata data) public returns (int256 amount0, int256 amount1) {
        int24 nextTick = 85184;
        uint160 nextPrice = 5604469350942327889444743441197;

        amount0 = -0.008396714242162444 ether;
        amount1 = 42 ether;
        (slot0.tick, slot0.sqrtPriceX96) = (nextTick, nextPrice);
        IERC20(token0).transfer(receipient, uint256(-amount0));
        uint256 balance1Before = balance1();
        IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);

        if (balance1Before + uint256(amount1) > balance1()) {
            revert Error.InsufficientInputAmount();
        }

        emit Swap(msg.sender, receipient, amount0, amount1, slot0.sqrtPriceX96, liquidity, slot0.tick);
    }

    function balance0() internal returns (uint256 balance) {
        balance = IERC20(token0).balanceOf(address(this));
    }

    function balance1() internal returns (uint256 balance) {
        balance = IERC20(token1).balanceOf(address(this));
    }
}
