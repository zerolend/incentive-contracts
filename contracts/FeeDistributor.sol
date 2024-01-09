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
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IFeeDistributor} from "./interfaces/IFeeDistributor.sol";
import {IZeroLocker} from "./interfaces/IZeroLocker.sol";

contract FeeDistributor is IFeeDistributor, ReentrancyGuard, Initializable {
    uint256 public WEEK;
    uint256 public TOKEN_CHECKPOINT_DEADLINE;
    uint256 public startTime;
    uint256 public timeCursor;

    mapping(uint256 => uint256) public timeCursorOf;
    mapping(uint256 => uint256) public userEpochOf;

    uint256 public lastTokenTime;
    uint256[1000000000000000] public tokensPerWeek;

    IZeroLocker public locker;
    IERC20 public token;
    uint256 public tokenLastBalance;

    uint256[1000000000000000] public veSupply; // VE total supply at week bounds

    // constructor() {
    //     _disableInitializers();
    // }

    function initialize(
        address _votingEscrow,
        address _token
    ) external initializer {
        WEEK = 7 * 86400;
        TOKEN_CHECKPOINT_DEADLINE = 86400;

        // round off the time
        uint256 t = (block.timestamp / WEEK) * WEEK;
        startTime = t;
        lastTokenTime = t;
        timeCursor = t;

        token = IERC20(_token);
        locker = IZeroLocker(_votingEscrow);
    }

    function _checkpointToken(uint256 timestamp) internal {
        uint256 tokenBalance = token.balanceOf(address(this));
        uint256 toDistribute = tokenBalance - tokenLastBalance;
        tokenLastBalance = tokenBalance;

        uint256 t = lastTokenTime;
        uint256 sinceLast = timestamp - t;
        lastTokenTime = timestamp;

        uint256 thisWeek = (t / WEEK) * WEEK;
        uint256 nextWeek = 0;

        for (uint256 index = 0; index < 20; index++) {
            nextWeek = thisWeek + WEEK;
            if (timestamp < nextWeek) {
                if (sinceLast == 0 && timestamp == t)
                    tokensPerWeek[thisWeek] += toDistribute;
                else
                    tokensPerWeek[thisWeek] +=
                        (toDistribute * (timestamp - t)) /
                        sinceLast;
                break;
            } else {
                if (sinceLast == 0 && nextWeek == t)
                    tokensPerWeek[thisWeek] += toDistribute;
                else
                    tokensPerWeek[thisWeek] +=
                        (toDistribute * (nextWeek - t)) /
                        sinceLast;
            }
            t = nextWeek;
            thisWeek = nextWeek;
        }

        emit CheckpointToken(timestamp, toDistribute);
    }

    function checkpointToken() external override {
        require(
            ((block.timestamp > lastTokenTime + TOKEN_CHECKPOINT_DEADLINE)),
            "cant checkpoint now"
        );
        _checkpointToken(block.timestamp);
    }

    function _findTimestampEpoch(
        uint256 _timestamp
    ) internal view returns (uint256) {
        uint256 min = 0;
        uint256 max = locker.epoch();

        for (uint256 index = 0; index < 128; index++) {
            if (min >= max) {
                break;
            }
            uint256 mid = (min + max + 2) / 2;
            IZeroLocker.Point memory pt = locker.pointHistory(mid);

            if (pt.ts <= _timestamp) min = mid;
            else max = mid - 1;
        }

        return min;
    }

    function _findTimestampUserEpoch(
        uint256 nftId,
        uint256 _timestamp,
        uint256 maxUserEpoch
    ) internal view returns (uint256) {
        uint256 min = 0;
        uint256 max = maxUserEpoch;

        for (uint256 index = 0; index < 128; index++) {
            if (min >= max) {
                break;
            }
            uint256 mid = (min + max + 2) / 2;
            IZeroLocker.Point memory pt = locker.userPointHistory(nftId, mid);

            if (pt.ts <= _timestamp) min = mid;
            else max = mid - 1;
        }

        return min;
    }

    function _checkpointTotalSupply(uint256 timestamp) internal {
        uint256 t = timeCursor;
        uint256 roundedTimestamp = (timestamp / WEEK) * WEEK;

        locker.checkpoint();

        for (uint256 index = 0; index < 20; index++) {
            if (t > roundedTimestamp) break;
            else {
                uint256 epoch = _findTimestampEpoch(t);
                IZeroLocker.Point memory pt = locker.pointHistory(epoch);

                int128 dt = 0;

                if (t > pt.ts) dt = int128(uint128(t - pt.ts));
                veSupply[t] = Math.max(uint128(pt.bias - pt.slope * dt), 0);
            }

            t += WEEK;
        }

        timeCursor = t;
    }

    function checkpointTotalSupply() external override {
        _checkpointTotalSupply(block.timestamp);
    }

    function _claim(
        uint256 nftId,
        uint256 _lastTokenTime
    ) internal returns (uint256) {
        uint256 userEpoch = 0;
        uint256 toDistribute = 0;

        uint256 maxUserEpoch = locker.userPointEpoch(nftId);
        uint256 _startTime = startTime;

        if (maxUserEpoch == 0) return 0;

        uint256 weekCursor = timeCursorOf[nftId];

        if (weekCursor == 0)
            userEpoch = _findTimestampUserEpoch(
                nftId,
                _startTime,
                maxUserEpoch
            );
        else userEpoch = userEpochOf[nftId];

        if (userEpoch == 0) userEpoch = 1;

        IZeroLocker.Point memory userPoint = locker.userPointHistory(
            nftId,
            userEpoch
        );

        if (weekCursor == 0)
            weekCursor = ((userPoint.ts + WEEK - 1) / WEEK) * WEEK;

        if (weekCursor >= _lastTokenTime) return 0;

        if (weekCursor < _startTime) weekCursor = _startTime;

        IZeroLocker.Point memory oldUserPoint = IZeroLocker.Point(0, 0, 0, 0);

        for (uint256 index = 0; index < 50; index++) {
            if (weekCursor >= _lastTokenTime) break;

            if (weekCursor >= userPoint.ts && userEpoch <= maxUserEpoch) {
                userEpoch += 1;
                oldUserPoint = userPoint;

                if (userEpoch > maxUserEpoch)
                    userPoint = IZeroLocker.Point(0, 0, 0, 0);
                else userPoint = locker.userPointHistory(nftId, userEpoch);
            } else {
                int128 dt = int128(uint128(weekCursor - oldUserPoint.ts));
                uint256 balanceOf = Math.max(
                    uint128(oldUserPoint.bias - dt * oldUserPoint.slope),
                    0
                );

                if (balanceOf == 0 && userEpoch > maxUserEpoch) break;
                if (balanceOf > 0)
                    toDistribute +=
                        (balanceOf * tokensPerWeek[weekCursor]) /
                        veSupply[weekCursor];

                weekCursor += WEEK;
            }
        }

        userEpoch = Math.min(maxUserEpoch, userEpoch - 1);
        userEpochOf[nftId] = userEpoch;
        timeCursorOf[nftId] = weekCursor;

        emit Claimed(nftId, toDistribute, userEpoch, maxUserEpoch);
        return toDistribute;
    }

    function _claimWithChecks(uint256 nftId) internal returns (uint256) {
        if (block.timestamp >= timeCursor)
            _checkpointTotalSupply(block.timestamp);

        uint256 _lastTokenTime = lastTokenTime;

        if ((block.timestamp > lastTokenTime + TOKEN_CHECKPOINT_DEADLINE)) {
            _checkpointToken(block.timestamp);
            _lastTokenTime = block.timestamp;
        }

        _lastTokenTime = (_lastTokenTime / WEEK) * WEEK;

        uint256 amount = _claim(nftId, _lastTokenTime);
        address who = locker.ownerOf(nftId);

        if (amount != 0) {
            tokenLastBalance -= amount;
            token.transfer(who, amount);
        }

        return amount;
    }

    function claim(
        uint256 id
    ) external override nonReentrant returns (uint256) {
        return _claimWithChecks(id);
    }

    function claimMany(
        uint256[] memory nftIds
    ) external override nonReentrant returns (bool) {
        if (block.timestamp >= timeCursor)
            _checkpointTotalSupply(block.timestamp);

        uint256 _lastTokenTime = lastTokenTime;

        if ((block.timestamp > lastTokenTime + TOKEN_CHECKPOINT_DEADLINE)) {
            _checkpointToken(block.timestamp);
            _lastTokenTime = block.timestamp;
        }

        _lastTokenTime = (_lastTokenTime / WEEK) * WEEK;

        for (uint256 index = 0; index < nftIds.length; index++) {
            uint256 amount = _claim(nftIds[index], _lastTokenTime);
            address who = locker.ownerOf(nftIds[index]);

            if (amount != 0) {
                tokenLastBalance -= amount;
                token.transfer(who, amount);
            }
        }

        return true;
    }
}
