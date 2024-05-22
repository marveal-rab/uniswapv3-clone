// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

library Tick {
    struct Info {
        bool initialized;
        uint128 liqudity;
    }

    function update(mapping(int24 => Tick.Info) storage self, int24 tick, uint128 liquidityDelta)
        internal
        returns (bool flipped)
    {
        Tick.Info storage info = self[tick];
        uint128 liquidityBefore = info.liqudity;
        uint128 liquidityAfter = liquidityBefore + liquidityDelta;

        flipped = (liquidityAfter == 0) != (liquidityBefore == 0);

        if (liquidityBefore == 0) {
            info.initialized = true;
        }

        info.liqudity = liquidityAfter;
    }
}
