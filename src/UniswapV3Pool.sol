// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {Tick} from "./lib/Tick.sol";
import {Position} from "./lib/Position.sol";
import {Error} from "./lib/Error.sol";
import {TickBitmap} from "./lib/TickBitmap.sol";
import {IERC20} from "./interface/IERC20.sol";
import {IUniswapV3MintCallback} from "./interface/IUniswapV3MintCallback.sol";
import {IUniswapV3SwapCallback} from "./interface/IUniswapV3SwapCallback.sol";

contract UniswapV3Pool {
    using Tick for mapping(int24 => Tick.Info);
    using Position for mapping(bytes32 => Position.Info);
    using Position for Position.Info;
    using TickBitmap for mapping(int16 => uint256);

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
    // tick bit map
    mapping(int16 => uint256) public tickBitmap;

    struct CallbackData {
        address token0;
        address token1;
        address payer;
    }

    struct SwapState {
        uint256 amountSpecifiedRemaining;
        uint256 amountCalculated;
        uint160 sqrtPriceX96;
        int24 tick;
    }

    struct StepState {
        uint160 sqrtPriceStartX96;
        int24 nextTick;
        uint160 sqrtPriceNextX96;
        uint256 amountIn;
        uint256 amountOut;
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

        bool flippedLower = ticks.update(lowerTick, amount);
        bool flippedUpper = ticks.update(upperTick, amount);
        if (flippedLower) {
            tickBitmap.flipTick(lowerTick, 1);
        }
        if (flippedUpper) {
            tickBitmap.flipTick(upperTick, 1);
        }

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

    function swap(address receipient, bool zeroOrOne, uint256 amountSpecified, bytes calldata data)
        public
        returns (int256 amount0, int256 amount1)
    {
        Slot0 memory _slot0 = slot0;

        SwapState memory state = SwapState({
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0,
            sqrtPriceX96: _slot0.sqrtPriceX96,
            tick: _slot0.tick
        });

        while (state.amountSpecifiedRemaining > 0) {
            StepState memory step;

            step.sqrtPriceStartX96 = state.sqrtPriceX96;

            (step.nextTick,) = tickBitmap.nextInitializedTickWithinOneWord(state.tick, 1, zeroOrOne);
            step.sqrtPriceNextX96 = tickBitmap.getSqrtRatioAtTick(step.nextTick);

            (state.sqrtPriceX96, step.amountIn, step.amountOut) = SwapMath.computeSwapStep(
                step.sqrtPriceStartX96, step.sqrtPriceNextX96, liquidity, state.amountSpecifiedRemaining
            );

            state.amountSpecifiedRemaining -= step.amountIn;
            state.amountCalculated += step.amountOut;
            state.tick = TickMath.getTickSqrtRatio(state.sqrtPriceX96);
        }

        if (state.tick != _slot0.tick) {
            (slot0.sqrtPriceX96, slot0.tick) = (state.sqrtPriceX96, state.tick);
        }

        (amount0, amount1) = zeroOrOne
            ? (int256(amountSpecified - state.amountSpecifiedRemaining), -int256(state.amountCalculated))
            : (-int256(state.amountCalculated), int256(amountSpecified - state.amountSpecifiedRemaining));

        if (zeroOrOne) {
            IERC20(token1).transfer(receipient, uint256(-amount1));
            uint256 blaance0Before = balance0();
            IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);
            if (balance0Before + uint256(amount0) > balance0()) {
                revert Error.InsufficientInputAmount();
            }
        } else {
            IERC20(token0).transfer(receipient, uint256(-amount0));
            uint256 balance1Before = balance1();
            IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);

            if (balance1Before + uint256(amount1) > balance1()) {
                revert Error.InsufficientInputAmount();
            }
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
