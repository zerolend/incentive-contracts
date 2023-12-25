import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { e18, deployFixture as fixture } from "./fixtures/core";

describe("StreamedVesting", function () {
  it("Should deploy properly", async function () {
    const {
      vesting: streamedVesting,
      token,
      vestedToken,
      owner,
    } = await loadFixture(fixture);
    expect(await streamedVesting.underlying()).to.equal(
      token.target.toString()
    );
    expect(await streamedVesting.vestedToken()).to.equal(
      vestedToken.target.toString()
    );

    expect(await vestedToken.balanceOf(streamedVesting.target.toString())).eq(
      0
    );
    expect(
      await token.balanceOf(streamedVesting.target.toString())
    ).greaterThan(0);
    expect(await streamedVesting.lastId()).to.equal(0);
    expect(await streamedVesting.userToIds(owner.address, 0)).to.equal(0);
  });

  describe("For a user who has some vested tokens", function () {
    // todo

    it("Should create a new vest properly", async function () {
      const {
        vesting: streamedVesting,
        vestedToken,
        owner,
      } = await loadFixture(fixture);
      expect(await vestedToken.balanceOf(owner.address)).greaterThan(0);
      await vestedToken.approve(streamedVesting.target.toString(), e18 * 100n);

      await streamedVesting.createVest(e18 * 100n); // start vesting 100 tokens.

      expect(await streamedVesting.lastId()).to.equal(1n);
      expect(await streamedVesting.userToIds(owner.address, 0)).to.equal(1n);
      expect(await vestedToken.balanceOf(streamedVesting.target.toString())).eq(
        0
      );
    });

    it("Should vest 1/3rd after one month", async function () {
      const amt = e18 * 100n;
      const {
        vesting: streamedVesting,
        vestedToken,
        owner,
      } = await loadFixture(fixture);
      expect(await vestedToken.balanceOf(owner.address)).greaterThan(0);
      await vestedToken.approve(streamedVesting.target.toString(), e18 * 100n);

      await streamedVesting.createVest(e18 * 100n); // start vesting 100 tokens.
      expect(await streamedVesting.claimable(1)).to.equal(0);

      const vestBefore = await streamedVesting.vests(1);
      expect(vestBefore.claimed).eq(0);
      expect(vestBefore.amount).eq(e18 * 100n);

      await time.increase(86400 * 30);
      expect(await streamedVesting.claimable(1)).to.equal(amt / 3n);

      await streamedVesting.claimVest(1); // start vesting 100 tokens.

      const vestAfter = await streamedVesting.vests(1);
      expect(vestAfter.claimed).greaterThan(amt / 3n);
      expect(vestAfter.amount).eq(e18 * 100n);
    });

    it("Should calculate penalty properly", async function () {
      const { vesting } = await loadFixture(fixture);
      const duration = await vesting.duration();
      const start = 170190677n;
      const fn = (a: bigint) =>
        vesting["penalty(uint256,uint256)"](
          start,
          start + (duration * a) / 10n
        );

      expect(await fn(-1n)).eq(950000000000000000n);
      expect(await fn(0n)).eq(950000000000000000n);
      expect(await fn(2n)).eq(800000000000000000n);
      expect(await fn(5n)).eq(575000000000000000n);
      expect(await fn(9n)).eq(275000000000000000n);
      expect(await fn(11n)).eq(0n);
    });

    it("Should estimate penalty properly for an early withdrawal", async function () {
      const { vesting, vestedToken, owner } = await loadFixture(fixture);
      expect(await vestedToken.balanceOf(owner.address)).greaterThan(0);
      await vestedToken.approve(vesting.target.toString(), e18 * 100n);

      await vesting.createVest(e18 * 100n); // start vesting 100 tokens.
      expect(await vesting.claimable(1)).to.equal(0);

      // penalty for now should be 95%
      const p = await vesting.claimablePenalty(1);
      expect(p).to.equal(e18 * 5n); // 5% of 100n

      await time.increase(86400 * 30);

      // penalty for now should be 70%
      const p2 = await vesting.claimablePenalty(1);
      expect(p2).to.equal(e18 * 30n); // 30% of 100n

      await time.increase(86400 * 90);

      // penalty for now should be 0%
      const p3 = await vesting.claimablePenalty(1);
      expect(p3).to.equal(e18 * 100n); // 30% of 100n
    });

    it("Should charge a penalty for an early withdrawal", async function () {
      const { vesting, vestedToken, token, otherAccount } = await loadFixture(
        fixture
      );
      await vestedToken.transfer(otherAccount.address, e18 * 100n);

      expect(await vestedToken.balanceOf(otherAccount.address)).eq(e18 * 100n);
      await vestedToken
        .connect(otherAccount)
        .approve(vesting.target.toString(), e18 * 100n);

      await vesting.connect(otherAccount).createVest(e18 * 100n); // start vesting 100 tokens.
      expect(await vesting.claimable(1)).to.equal(0);

      // penalty for now should be 95%
      const p = await vesting.claimablePenalty(1);
      expect(p).to.equal(e18 * 5n); // 5% of 100n

      expect(await token.balanceOf(otherAccount.address)).eq(0);
      await vesting.connect(otherAccount).claimVestEarlyWithPenalty("1");
      expect(await token.balanceOf(otherAccount.address)).greaterThan(e18 * 5n);

      const vest = await vesting.vests(1);
      expect(await vest.claimed).eq(vest.amount);

      expect(vesting.connect(otherAccount).claimVest("1")).revertedWith(
        "no claimable amount"
      );
    });

    it("Should give a bonus for converting to 4 year stake", async function () {
      const { vesting, vestedToken, token, locker, otherAccount } =
        await loadFixture(fixture);
      await vestedToken.transfer(otherAccount.address, e18 * 100n);

      expect(await vestedToken.balanceOf(otherAccount.address)).eq(e18 * 100n);
      await vestedToken
        .connect(otherAccount)
        .approve(vesting.target.toString(), e18 * 100n);

      await vesting.connect(otherAccount).createVest(e18 * 100n); // start vesting 100 tokens.
      expect(await vesting.claimable(1)).to.equal(0);

      // penalty for now should be 95%
      const p = await vesting.claimablePenalty(1);
      expect(p).to.equal(e18 * 5n); // 5% of 100n

      await vesting.connect(otherAccount).stakeTo4Year("1");
      expect(await token.balanceOf(otherAccount.address)).eq(0);
      expect(await locker.balanceOf(otherAccount.address)).eq(1);
      expect(await locker.balanceOfNFT(1)).greaterThan(e18 * 119n); // 120 weYEILD
      expect(await locker.balanceOfNFT(1)).lessThan(e18 * 120n); // 120 weYEILD

      const vest = await vesting.vests(1);
      expect(await vest.claimed).eq(vest.amount);

      expect(vesting.connect(otherAccount).claimVest("1")).revertedWith(
        "no claimable amount"
      );
    });

    it("Should skip a bonus if the bonus pool is empty", async function () {
      const { vesting, vestedToken, bonusPool, token, locker, otherAccount } =
        await loadFixture(fixture);

      await bonusPool.withdrawStuckTokens(token.target.toString());
      await vestedToken.transfer(otherAccount.address, e18 * 100n);

      expect(await vestedToken.balanceOf(otherAccount.address)).eq(e18 * 100n);
      await vestedToken
        .connect(otherAccount)
        .approve(vesting.target.toString(), e18 * 100n);

      await vesting.connect(otherAccount).createVest(e18 * 100n); // start vesting 100 tokens.
      expect(await vesting.claimable(1)).to.equal(0);

      // penalty for now should be 95%
      const p = await vesting.claimablePenalty(1);
      expect(p).to.equal(e18 * 5n); // 5% of 100n

      await vesting.connect(otherAccount).stakeTo4Year("1");
      expect(await token.balanceOf(otherAccount.address)).eq(0);
      expect(await locker.balanceOf(otherAccount.address)).eq(1);
      expect(await locker.balanceOfNFT(1)).greaterThan(e18 * 99n); // 100 weYEILD
      expect(await locker.balanceOfNFT(1)).lessThan(e18 * 100n); // 100 weYEILD

      const vest = await vesting.vests(1);
      expect(await vest.claimed).eq(vest.amount);

      expect(vesting.connect(otherAccount).claimVest("1")).revertedWith(
        "no claimable amount"
      );
    });
  });
});
