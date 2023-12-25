import { ethers } from "hardhat";

export const e18 = BigInt(10) ** 18n;

export async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount, vault] = await ethers.getSigners();

  const ZeroLend = await ethers.getContractFactory("ZeroLend");
  const token = await ZeroLend.deploy();

  const VestedZeroLend = await ethers.getContractFactory("VestedZeroLend");
  const vestedToken = await VestedZeroLend.deploy();

  const ZeroLocker = await ethers.getContractFactory("ZeroLocker");
  const locker = await ZeroLocker.deploy();

  const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await FeeDistributor.deploy();

  const StakingEmissions = await ethers.getContractFactory("StakingEmissions");
  const stakingEmissions = await StakingEmissions.deploy();

  const StreamedVesting = await ethers.getContractFactory("StreamedVesting");
  const vesting = await StreamedVesting.deploy();

  const BonusPool = await ethers.getContractFactory("BonusPool");
  const bonusPool = await BonusPool.deploy(
    token.target.toString(),
    vesting.target.toString()
  );

  await vesting.initialize(
    token.target.toString(),
    vestedToken.target.toString(),
    locker.target.toString(),
    bonusPool.target.toString()
  );

  await feeDistributor.initialize(
    locker.target.toString(),
    vestedToken.target.toString()
  );

  await locker.initialize(token.target.toString());

  await stakingEmissions.initialize(
    feeDistributor.target.toString(),
    vestedToken.target.toString(),
    4807692n * e18
  );

  const supply = (100000000000n * e18) / 100n;

  // fund 5% unvested to staking bonus
  await token.transfer(bonusPool.target.toString(), 5n * supply);

  // send 10% to liquidity
  await token.transfer(token.target.toString(), 10n * supply);

  // send 10% vested tokens to the staking contract
  await token.transfer(vesting.target.toString(), 10n * supply);
  await vestedToken.transfer(stakingEmissions.target.toString(), 10n * supply);

  // send 47% for emissions
  await token.transfer(vesting.target.toString(), 47n * supply);
  await vestedToken.transfer(vault.address, 47n * supply);

  // whitelist the bonding sale contract
  await vestedToken.addwhitelist(stakingEmissions.target.toString(), true);
  await vestedToken.addwhitelist(feeDistributor.target.toString(), true);

  // start vesting and staking emissions (for test)
  await vesting.start();
  await stakingEmissions.start();

  return {
    bonusPool,
    ethers,
    feeDistributor,
    locker,
    otherAccount,
    owner,
    stakingEmissions,
    token,
    vestedToken,
    vesting,
  };
}
