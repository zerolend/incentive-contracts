// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// ███████╗███████╗██████╗  ██████╗
// ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗
//   ███╔╝ █████╗  ██████╔╝██║   ██║
//  ███╔╝  ██╔══╝  ██╔══██╗██║   ██║
// ███████╗███████╗██║  ██║╚██████╔╝
// ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝

// Website: https://zerolend.xyz
// Discord: https://discord.gg/zerolend
// Twitter: https://twitter.com/zerolendxyz

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract Epoch {
    uint256 private period;
    uint256 private startTime;
    uint256 private lastExecutedAt;

    /* ========== CONSTRUCTOR ========== */

    function initEpoch(uint256 _period, uint256 _startTime) internal {
        period = _period;
        startTime = _startTime;
        lastExecutedAt = block.timestamp;
    }

    /* ========== Modifier ========== */

    modifier checkStartTime() {
        require(block.timestamp >= startTime, "Epoch: not started yet");
        _;
    }

    modifier checkEpoch() {
        require(block.timestamp > startTime, "Epoch: not started yet");
        require(_callable(), "Epoch: not allowed");
        _;
        lastExecutedAt = block.timestamp;
    }

    function _getLastEpoch() internal view returns (uint256) {
        return (lastExecutedAt - startTime) / (period);
    }

    function _getCurrentEpoch() internal view returns (uint256) {
        return (Math.max(startTime, block.timestamp) - (startTime)) / (period);
    }

    function callable() external view returns (bool) {
        return _callable();
    }

    function _callable() internal view returns (bool) {
        return _getCurrentEpoch() >= _getNextEpoch();
    }

    function _getNextEpoch() internal view returns (uint256) {
        if (startTime == lastExecutedAt) {
            return _getLastEpoch();
        }
        return _getLastEpoch() + (1);
    }

    // epoch
    function getLastEpoch() external view returns (uint256) {
        return _getLastEpoch();
    }

    function getCurrentEpoch() external view returns (uint256) {
        return (Math.max(startTime, block.timestamp) - (startTime)) / (period);
    }

    function getNextEpoch() external view returns (uint256) {
        return _getNextEpoch();
    }

    function nextEpochPoint() external view returns (uint256) {
        return startTime + (_getNextEpoch() * (period));
    }

    // params
    function getPeriod() external view returns (uint256) {
        return period;
    }

    function getStartTime() external view returns (uint256) {
        return startTime;
    }
}
