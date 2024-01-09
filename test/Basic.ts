import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployLendingPool } from "./fixtures/lending";

describe("Basic", function () {
  it("Should deploy the lending pool properly", async function () {
    const { pool, owner, addressesProvider, erc20 } = await loadFixture(
      deployLendingPool
    );
    expect((await pool.getReservesList())[0]).to.equal(erc20.target);
    expect(await pool.ADDRESSES_PROVIDER()).to.equal(addressesProvider.target);
  });
});
