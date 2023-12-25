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

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBonusPool} from "./interfaces/IBonusPool.sol";

contract BonusPool is Ownable, IBonusPool {
    uint256 public bonusBps;
    uint256 public immutable PCT_100 = 100000; // 100%

    constructor(IERC20 _underlying, address _vesting) {
        _underlying.approve(_vesting, type(uint256).max);
        _setBonusBps(20000); // 20%
    }

    function calculateBonus(uint256 amount) external view returns (uint256) {
        return (amount * bonusBps) / PCT_100;
    }

    function setBonusBps(uint256 amount) external onlyOwner {
        _setBonusBps(amount);
    }

    function withdrawStuckTokens(address tkn) public onlyOwner {
        bool success;
        if (tkn == address(0))
            (success, ) = address(msg.sender).call{
                value: address(this).balance
            }("");
        else {
            require(IERC20(tkn).balanceOf(address(this)) > 0, "No tokens");
            uint256 amount = IERC20(tkn).balanceOf(address(this));
            IERC20(tkn).transfer(msg.sender, amount);
        }
    }

    function _setBonusBps(uint256 amount) internal {
        require(bonusBps <= PCT_100, "bonus too high");
        emit SetBonusBPS(bonusBps, amount);
        bonusBps = amount;
    }
}
