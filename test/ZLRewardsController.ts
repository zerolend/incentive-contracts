import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import {
  AaveProtocolDataProvider,
  Pool,
  ZLRewardsController,
} from "../typechain-types";
import { ethers } from "hardhat";
import { deployCore } from "./fixtures/core";

describe("ZLRewardsController", () => {
  let pool: Pool;
  let protocolDataProvider: AaveProtocolDataProvider;
  let zLRewardsController: ZLRewardsController;

  beforeEach(async () => {
    const res = await loadFixture(deployCore);
    pool = res.lending.pool;
    protocolDataProvider = res.lending.protocolDataProvider;
    zLRewardsController = res.zLRewardsController;

    const atokens = await protocolDataProvider.getAllATokens();

    for (let index = 0; index < atokens.length; index++) {
      const element = atokens[index];
      const atoken = await ethers.getContractAt("AToken", element.tokenAddress);
      await atoken.setIncentivesController(res.zLRewardsController.target);
    }
  });

  it("Should report the right incentive controller for every atoken", async () => {
    const atokens = await protocolDataProvider.getAllATokens();

    for (let index = 0; index < atokens.length; index++) {
      const element = atokens[index];
      const atoken = await ethers.getContractAt("AToken", element.tokenAddress);
      expect(await atoken.getIncentivesController()).eq(
        zLRewardsController.target
      );
    }
  });
});
