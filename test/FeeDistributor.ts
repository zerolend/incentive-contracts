import { expect } from "chai";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { e18, deployFixture as fixture } from "./fixtures/core";

describe("FeeDistributor", () => {
  it("Should deploy properly", async function () {
    const { feeDistributor, locker, stakingEmissions } = await loadFixture(
      fixture
    );
    expect(await feeDistributor.locker()).eq(locker.target.toString());
    expect(await stakingEmissions.feeDistributor()).eq(
      feeDistributor.target.toString()
    );
  });

  it("Should allocate rewards in the first epoch", async function () {
    const {
      feeDistributor,
      locker,
      vestedToken: vToken,
      token,
      stakingEmissions: emissions,
    } = await loadFixture(fixture);

    // create a lock
    await token.approve(locker.target.toString(), e18 * 1000000n);
    await locker.createLock(e18 * 1000000n, 86400 * 365 * 4);

    expect(await vToken.balanceOf(emissions.target.toString())).eq(
      10000000000n * e18
    );
    expect(await vToken.balanceOf(feeDistributor.target.toString())).eq("0");

    // fast forward and give out emissions
    await time.increase(86400 * 7);
    await emissions.distribute();

    expect(await vToken.balanceOf(emissions.target.toString())).greaterThan(
      9990000000n * e18
    );
    expect(await vToken.balanceOf(feeDistributor.target.toString())).eq(
      4807692n * e18
    );
  });

  it("Should distribute all the rewards to the user in the first epoch", async function () {
    const {
      feeDistributor,
      locker,
      vestedToken: vToken,
      token,
      otherAccount: other,
      stakingEmissions: emissions,
    } = await loadFixture(fixture);

    // create a lock
    await token.transfer(other.address, e18 * 1000000n);
    await token
      .connect(other)
      .approve(locker.target.toString(), e18 * 1000000n);
    await locker.connect(other).createLock(e18 * 1000000n, 86400 * 365 * 4);

    // fast forward and give out emissions
    await time.increase(86400 * 7);
    await emissions.distribute();

    expect(await vToken.balanceOf(emissions)).greaterThan(9990000000n * e18);
    expect(await vToken.balanceOf(feeDistributor.target.toString())).eq(
      4807692n * e18
    );
    expect(await vToken.balanceOf(other.address)).eq(0);

    await time.increase(86400 * 7);

    // all the rewards should be given to the user
    await feeDistributor.connect(other).claim("1");
    expect(await vToken.balanceOf(other.address)).greaterThan(4000000n * e18);
  });

  it("Should distribute less rewards if the user owns less of the pool", async function () {
    const {
      feeDistributor,
      locker,
      vestedToken: vToken,
      token,
      otherAccount: other,
      stakingEmissions: emissions,
    } = await loadFixture(fixture);

    // create a lock for 4 years
    await token.transfer(other.address, e18 * 1000000n);
    await token
      .connect(other)
      .approve(locker.target.toString(), e18 * 1000000n);
    await locker.connect(other).createLock(e18 * 1000000n, 86400 * 365 * 4);

    // create another lock for 1 year
    await token.approve(locker.target.toString(), e18 * 1000000n);
    await locker.createLock(e18 * 1000000n, 86400 * 365);

    // fast forward and give out emissions
    await time.increase(86400 * 7);
    await emissions.distribute();

    expect(await vToken.balanceOf(emissions)).greaterThan(9990000000n * e18);
    expect(await vToken.balanceOf(feeDistributor.target.toString())).eq(
      4807692n * e18
    );
    expect(await vToken.balanceOf(other.address)).eq(0);

    await time.increase(86400 * 7);

    // all the rewards should be given to the user
    await feeDistributor.connect(other).claim("1");
    expect(await vToken.balanceOf(other.address)).greaterThan(3200000n * e18);
  });
});
