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

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {IFeeDistributor} from "./interfaces/IFeeDistributor.sol";
import {IZeroLocker} from "./interfaces/IZeroLocker.sol";
import {Epoch} from "./Epoch.sol";

contract StakingEmissions is OwnableUpgradeable, PausableUpgradeable, Epoch {
    IFeeDistributor public feeDistributor;
    IERC20 public token;
    uint256 public amtPerEpoch;

    // constructor() {
    //     _disableInitializers();
    // }

    function initialize(
        IFeeDistributor _feeDistributor,
        IERC20 _token,
        uint256 _amtPerEpoch
    ) external initializer {
        token = _token;
        feeDistributor = _feeDistributor;
        amtPerEpoch = _amtPerEpoch;

        __Ownable_init();
        __Pausable_init();
        _pause();
    }

    function start() external onlyOwner {
        initEpoch(86400 * 7, block.timestamp);
        _unpause();
        renounceOwnership();
    }

    function distribute() external {
        _distribute();
    }

    function _distribute() internal checkEpoch whenNotPaused {
        feeDistributor.checkpointToken();
        feeDistributor.checkpointTotalSupply();
        token.transfer(address(feeDistributor), amtPerEpoch);
    }
}
