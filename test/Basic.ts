import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployFixture } from "./fixtures/lending";

describe("Basic", function () {
  it.only("Should deploy the lending pool properly", async function () {
    const { pool, owner, addressesProvider, erc20 } = await loadFixture(
      deployFixture
    );
    expect((await pool.getReservesList())[0]).to.equal(erc20.target);
    expect(await pool.ADDRESSES_PROVIDER()).to.equal(addressesProvider.target);
  });
});
