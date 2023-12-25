import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployFixture } from "./fixtures/core";

describe("Basic", function () {
  it("Should deploy token properly", async function () {
    const { token, owner } = await loadFixture(deployFixture);
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.owner()).to.equal(owner.address);
  });
});
