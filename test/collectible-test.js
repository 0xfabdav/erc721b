const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.helper.config");
const { PRICE, MAX_MINTS_PER_USER } = require("../utils/constants");

//https://hardhat.org/tutorial/testing-contracts.html

if(developmentChains.includes(network.name))
{
  describe("Collectible Unit Tests", function () {
    // Mocha has four functions that let you hook into the the test runner's
    // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.
    let CollectibleContract;
    let collectibleNFT;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    // `beforeEach` will run before each test, re-deploying the contract every time
    beforeEach(async function () {
      CollectibleContract = await ethers.getContractFactory("Collectible");
      [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
      collectibleNFT = await CollectibleContract.deploy();
    });

    describe("Deployment", function () {
      it("Should set the right contract owner", async function () {
        expect(await collectibleNFT.owner()).to.equal(owner.address);
      });
    });

    describe("Base NFT Tests", function () {
      it("(PUBLIC_MINT) Should mint multiples NFTs", async function () {
        await collectibleNFT.connect(addr1).publicBatchMint_Kh1x(MAX_MINTS_PER_USER, {
          value: ethers.BigNumber.from(`${PRICE * MAX_MINTS_PER_USER}`)
        });

        const nftOwnerBalance = await collectibleNFT.balanceOf(addr1.address);
        expect(nftOwnerBalance).to.equal(MAX_MINTS_PER_USER);
      });

      it("It should revert the publicBatchMint_Kh1x tx because the price was set too low", async function () {
        const price = 0.01 * 10 ** 18;
        const quantity = 1;

        await expect(collectibleNFT.publicBatchMint_Kh1x(quantity, {value: ethers.BigNumber.from(`${price * quantity}`)})).to.be.revertedWith("EthValueTooLow");
      });

      it("It should revert the publicBatchMint_Kh1x tx because the user want to mint more than the max per user limit", async function () {
        const quantity = 3;

        collectibleNFT.publicBatchMint_Kh1x(quantity, {value: ethers.BigNumber.from(`${PRICE * quantity}`)})

        await expect(collectibleNFT.publicBatchMint_Kh1x(quantity, {value: ethers.BigNumber.from(`${PRICE * quantity}`)})).to.be.revertedWith("MaxUserMintLimitWasReached");
      });

      it("Should refund the amounts paid in excess", async function () {
        const price = 0.15 * 10 ** 18;
        const quantity = 1;
        const expectedBalance = 0.05; //eth

        await collectibleNFT.connect(addr1).publicBatchMint_Kh1x(quantity, {
          value: ethers.BigNumber.from(`${price * quantity}`)
        });

        const contractBalance = await collectibleNFT.provider.getBalance(collectibleNFT.address);
        expect(ethers.utils.formatEther(contractBalance)).to.equal(expectedBalance.toString());
      });

      it("Should withdraw the money", async function () {
        const quantity = 1;
        const expectedBalance = '0.0'; //eth

        await collectibleNFT.connect(addr1).publicBatchMint_Kh1x(quantity, {
          value: ethers.BigNumber.from(`${PRICE * quantity}`)
        });
        
        await collectibleNFT.connect(owner).withdrawMoney();

        const contractBalance = await collectibleNFT.provider.getBalance(collectibleNFT.address);
        await expect(ethers.utils.formatEther(contractBalance)).to.be.equal(expectedBalance);
      });

      it("It should revert the withdraw tx because the caller is not the owner", async function () {
        await expect(collectibleNFT.connect(addr1).withdrawMoney()).to.be.revertedWith("NotAuthorized");
      });
    });
  });
}
else
{
  console.log("Tests will only get executed if you run locally!");
}
