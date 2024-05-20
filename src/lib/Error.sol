// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

library Error {
    // Invert tick range
    error InvertTickRange();

    // zero liquidity
    error ZeroLiquidity();

    // Insufficient input amount
    error InsufficientInputAmount();
}
