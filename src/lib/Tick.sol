// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

library Tick {
    struct Info {
        bool initialized;
        uint128 liqudity;
    }

    function update(mapping(int24 => Tick.Info) storage self, int24 tick, uint128 liquidityDelta) internal {
        Tick.Info storage info = self[tick];
        uint128 liquidityBefore = info.liqudity;
        uint128 liquidityAfter = liquidityBefore + liquidityDelta;

        if (liquidityBefore == 0) {
            info.initialized = true;
        }

        info.liqudity = liquidityAfter;
    }
}
