const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.helper.config");
const { PRICE, MAX_MINTS_PER_USER } = require("../utils/constants");

//https://hardhat.org/tutorial/testing-contracts.html

if (developmentChains.includes(network.name)) {
  describe("Collectible Unit Tests", function () {
    // Mocha has four functions that let you hook into the the test runner's
    // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

    let CollectibleContract;
    let collectibleNFT;
    let owner;
    let addrs;

    // `beforeEach` will run before each test, re-deploying the contract every time
    beforeEach(async function () {
      CollectibleContract = await ethers.getContractFactory("Collectible");
      [owner, ...addrs] = await ethers.getSigners();
      collectibleNFT = await CollectibleContract.deploy();
    });

    describe("Base NFT Tests", function () {
      it("(PUBLIC_MINT) Should mint multiples NFTs", async function () {

        await collectibleNFT.connect(addrs[0]).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`),
        });

        const nftOwnerBalance = await collectibleNFT.balanceOf(addrs[0].address);
        expect(nftOwnerBalance).to.equal(MAX_MINTS_PER_USER);

        await collectibleNFT.connect(addrs[1]).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`),
        });

        const nftOwnerBalance2 = await collectibleNFT.balanceOf(addrs[1].address);
        expect(nftOwnerBalance2).to.equal(MAX_MINTS_PER_USER);

        await collectibleNFT.connect(addrs[2]).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`),
        });

        const nftOwnerBalance3 = await collectibleNFT.balanceOf(addrs[2].address);
        expect(nftOwnerBalance3).to.equal(MAX_MINTS_PER_USER);

        await collectibleNFT.connect(addrs[3]).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`),
        });

        const nftOwnerBalance4 = await collectibleNFT.balanceOf(addrs[3].address);
        expect(nftOwnerBalance4).to.equal(MAX_MINTS_PER_USER);

        await collectibleNFT.connect(addrs[4]).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`),
        });

        const nftOwnerBalance5 = await collectibleNFT.balanceOf(addrs[4].address);
        expect(nftOwnerBalance5).to.equal(MAX_MINTS_PER_USER);
      });
    });
  });
} else {
  console.log("Tests will only get executed if you run locally!");
}
