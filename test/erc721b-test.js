const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.helper.config");
const {
  PRICE,
  ZERO_ADDRESS,
  MAX_MINTS_PER_USER,
} = require("../utils/constants");

if (developmentChains.includes(network.name)) {
  const createTestSuite = ({ contract }) =>
    function () {
      context(`${contract}`, () => {
        beforeEach(async function () {
          this.Contract = await ethers.getContractFactory(contract);
          this.nft = await this.Contract.deploy();
        });

        context("with no user minted tokens", async function () {
          it("token counter is 1", async function () {
            const counter = await this.nft.tokenCounter();
            expect(counter).to.equal(1);
          });

          it("Total collection size is 26", async function () {
            const COLLECTION_SIZE = await this.nft.COLLECTION_SIZE();
            expect(COLLECTION_SIZE).to.equal(26);
          });
        });

        context("with minted tokens", async function () {
          beforeEach(async function () {
            const [owner, ...addrs] = await ethers.getSigners();
            this.owner = owner;
            this.addrs = addrs;

            for (var i = 0; i < MAX_MINTS_PER_USER; i++) {
              await this.nft.connect(addrs[i]).publicBatchMint_Kh1x(i + 1, {
                value: ethers.BigNumber.from(`${PRICE * (i + 1)}`),
              });
            }
          });

          describe("publicBatchMint_Kh1x", () => {
            it("successfully mints a single token", async function () {
              const tokenId = await this.nft.tokenCounter();
              const mintTx = await this.nft.publicBatchMint_Kh1x(1, {
                value: ethers.BigNumber.from(`${PRICE}`),
              });

              await expect(mintTx)
                .to.emit(this.nft, 'Transfer')
                .withArgs(ZERO_ADDRESS, this.owner.address, tokenId);

                expect(await this.nft.ownerOf(tokenId)).to.equal(this.owner.address);
                expect(await this.nft.balanceOf(this.owner.address)).to.equal(2);
            });

            it("successfully mints multiple tokens", async function () {
              let tokenId = await this.nft.tokenCounter();
              const mintTx = await this.nft.publicBatchMint_Kh1x(MAX_MINTS_PER_USER - 1, {
                value: ethers.BigNumber.from(`${PRICE * (MAX_MINTS_PER_USER - 1)}`),
              });

              tokenId = tokenId.toNumber();
              for (let id = tokenId; id < MAX_MINTS_PER_USER + tokenId - 1; id++) {
                await expect(mintTx)
                  .to.emit(this.nft, 'Transfer')
                  .withArgs(ZERO_ADDRESS, this.owner.address, id);
                expect(await this.nft.ownerOf(id)).to.equal(this.owner.address);
              }

              expect(await this.nft.balanceOf(this.owner.address)).to.equal(MAX_MINTS_PER_USER);
            });

            it("should revert because max user mint limit was reached", async function () {
              await expect(
                this.nft.connect(this.addrs[8]).publicBatchMint_Kh1x(6, {
                  value: ethers.BigNumber.from(`${PRICE * 6}`),
                })
              ).to.be.revertedWith("MaxUserMintLimitWasReached");
            });

            it("requires quantity to be greater than 0", async function () {
              await expect(
                this.nft.publicBatchMint_Kh1x(0, {
                  value: ethers.BigNumber.from(`${PRICE}`),
                })
              ).to.be.revertedWith("ZeroQuantity");
            });
          });

          describe("whitelist mint", function () {
            it("should mint one NFT", async function () {
              await this.nft.setWhiteListUsers([this.addrs[8].address], [1]);
              const totalMinted = await this.nft.tokenCounter();
              await this.nft.connect(this.addrs[8]).whitelistBatchMint(1, {
                value: ethers.BigNumber.from(`${PRICE}`),
              })

              expect(await this.nft.ownerOf(totalMinted)).to.equal(this.addrs[8].address);
            });

            it("should mint multiple NFTs", async function () {
              await this.nft.setWhiteListUsers([this.addrs[8].address], [3]);
              let totalMinted = await this.nft.tokenCounter();
              await this.nft.connect(this.addrs[8]).whitelistBatchMint(3, {
                value: ethers.BigNumber.from(`${PRICE * 3}`),
              })

              totalMinted = totalMinted.toNumber();
              expect(await this.nft.ownerOf(totalMinted)).to.equal(this.addrs[8].address);
              expect(await this.nft.ownerOf(totalMinted + 1)).to.equal(this.addrs[8].address);
              expect(await this.nft.ownerOf(totalMinted + 2)).to.equal(this.addrs[8].address);
            });

            it("should revert the whitelistBatchMint tx because the user is not whitelisted", async function () {
              await expect(this.nft.connect(this.addrs[7]).whitelistSingleMint({
                value: ethers.BigNumber.from(`${PRICE}`)
              })).to.be.revertedWith("NotWhitelistedOrAlreadyMinted");
            });

            it("should revert the whitelistBatchMint tx because the user has already minted", async function () {
              await this.nft.setWhiteListUsers([this.addrs[8].address], [1]);
              
              await this.nft.connect(this.addrs[8]).whitelistSingleMint({
                value: ethers.BigNumber.from(`${PRICE}`),
              });

              await expect(this.nft.connect(this.addrs[8]).whitelistSingleMint({
                value: ethers.BigNumber.from(`${PRICE}`),
              })).to.be.revertedWith("NotWhitelistedOrAlreadyMinted");
            });

            it("should revert because max user white list limit was reached", async function () {
              await this.nft.setWhiteListUsers([this.addrs[8].address], [1]);
              await expect(
                this.nft.connect(this.addrs[8]).whitelistBatchMint(2, {
                  value: ethers.BigNumber.from(`${PRICE * 2}`),
                })
              ).to.be.revertedWith("MaxWhitelistMintLimitExceeded");
            });

            it("should revert because quantity has to be greater than 0", async function () {
              await this.nft.setWhiteListUsers([this.addrs[8].address], [1]);
              await expect(
                this.nft.connect(this.addrs[8]).whitelistBatchMint(0, {
                  value: ethers.BigNumber.from(`${PRICE}`),
                })
              ).to.be.revertedWith("ZeroQuantity");
            });
          });

          describe("tokenCounter", function () {
            it("has 16 totalMinted", async function () {
              const totalMinted = await this.nft.tokenCounter();
              expect(totalMinted).to.equal("16");
            });
          });

          describe("balanceOf", function () {
            it("returns the right token amount for the owner", async function () {
              for (var i = 0; i < MAX_MINTS_PER_USER; i++) {
                expect(await this.nft.balanceOf(this.addrs[i].address)).to.equal(i+1);
              }
            });

            it("throws an exception for the 0 address", async function () {
              await expect(this.nft.balanceOf(ZERO_ADDRESS)).to.be.revertedWith(
                "ZeroAddress"
              );
            });
          });

          describe("ownerOf", function () {
            it("returns the right token owner", async function () {
              expect(await this.nft.ownerOf(1)).to.equal(this.addrs[0].address);
              expect(await this.nft.ownerOf(2)).to.equal(this.addrs[1].address);
              expect(await this.nft.ownerOf(5)).to.equal(this.addrs[2].address);
            });

            it("reverts for an invalid token owner query", async function () {
              await expect(this.nft.ownerOf(120)).to.be.revertedWith(
                "QueryForNonExistentToken"
              );
            });
          });

          describe("approve", function () {
            beforeEach(function () {
              this.tokenId = 1;
              this.tokenId2 = 2;
            });

            it("sets approval for the target address", async function () {
              const tokenIdWithNoExplicitOwner = 5;

              await this.nft
                .connect(this.addrs[2])
                .approve(this.addrs[1].address, tokenIdWithNoExplicitOwner);
              const approval = await this.nft.getApproved(
                tokenIdWithNoExplicitOwner
              );
              expect(approval).to.equal(this.addrs[1].address);
            });

            it("rejects an invalid token owner", async function () {
              await expect(
                this.nft
                  .connect(this.addrs[0])
                  .approve(this.addrs[1].address, this.tokenId2)
              ).to.be.revertedWith("ApprovalToCurrentOwner");
            });

            it("rejects an unapproved caller", async function () {
              await expect(
                this.nft.approve(this.addrs[1].address, this.tokenId)
              ).to.be.revertedWith("CallerNotOwnerNorApproved");
            });

            it("does not get approved for invalid tokens", async function () {
              await expect(this.nft.getApproved(55)).to.be.revertedWith(
                "QueryForNonExistentToken"
              );
            });

            describe("setApprovalForAll", async function () {
              it("sets approval for all properly", async function () {
                const approvalTx = await this.nft.setApprovalForAll(
                  this.addrs[0].address,
                  true
                );
                await expect(approvalTx)
                  .to.emit(this.nft, "ApprovalForAll")
                  .withArgs(this.owner.address, this.addrs[0].address, true);
                expect(
                  await this.nft.isApprovedForAll(
                    this.owner.address,
                    this.addrs[0].address
                  )
                ).to.be.true;
              });

              it("sets rejects approvals for non msg senders", async function () {
                await expect(
                  this.nft
                    .connect(this.addrs[0])
                    .setApprovalForAll(this.addrs[0].address, true)
                ).to.be.revertedWith("ApproveToCaller");
              });
            });

            context("test transfer functionality", function () {
              const testSuccessfulTransfer = function (transferFn) {
                beforeEach(async function () {
                  this.tokenId = 4;

                  const sender = this.addrs[2];
                  this.from = sender.address;
                  this.to = this.addrs[5].address;
                  await this.nft
                    .connect(sender)
                    .setApprovalForAll(this.to, true);
                  this.transferTx = await this.nft
                    .connect(sender)
                    [transferFn](this.from, this.to, this.tokenId);
                });

                it("transfers the ownership of the given token ID to the given address", async function () {
                  expect(await this.nft.ownerOf(this.tokenId)).to.be.equal(
                    this.to
                  );
                });

                it("emits a Transfer event", async function () {
                  await expect(this.transferTx)
                    .to.emit(this.nft, "Transfer")
                    .withArgs(this.from, this.to, this.tokenId);
                });

                it("clears the approval for the token ID", async function () {
                  expect(await this.nft.getApproved(this.tokenId)).to.be.equal(
                    ZERO_ADDRESS
                  );
                });

                it("emits an Approval event", async function () {
                  await expect(this.transferTx)
                    .to.emit(this.nft, "Approval")
                    .withArgs(this.from, ZERO_ADDRESS, this.tokenId);
                });

                it("adjusts owners balances", async function () {
                  expect(await this.nft.balanceOf(this.from)).to.be.equal(2);
                });

                it("adjusts receiver balances", async function () {
                  expect(await this.nft.balanceOf(this.to)).to.be.equal(1);
                });
              };

              const testUnsuccessfulTransfer = function (transferFn) {
                beforeEach(function () {
                  this.tokenId = 2;
                });

                it("rejects unapproved transfer", async function () {
                  await expect(
                    this.nft
                      .connect(this.addrs[0])
                      [transferFn](
                        this.addrs[1].address,
                        this.addrs[0].address,
                        this.tokenId
                      )
                  ).to.be.revertedWith("CallerNotOwnerNorApproved");
                });

                it("rejects transfer from incorrect owner", async function () {
                  await this.nft
                    .connect(this.addrs[1])
                    .setApprovalForAll(this.addrs[0].address, true);
                  await expect(
                    this.nft
                      .connect(this.addrs[0])
                      [transferFn](
                        this.addrs[2].address,
                        this.addrs[0].address,
                        this.tokenId
                      )
                  ).to.be.revertedWith("TransferFromIncorrectAddress");
                });

                it("rejects transfer to zero address", async function () {
                  await this.nft
                    .connect(this.addrs[1])
                    .setApprovalForAll(this.addrs[0].address, true);
                  await expect(
                    this.nft
                      .connect(this.addrs[0])
                      [transferFn](
                        this.addrs[1].address,
                        ZERO_ADDRESS,
                        this.tokenId
                      )
                  ).to.be.revertedWith("ZeroAddress");
                });
              };

              context("successful transfers", function () {
                describe("transferFrom", function () {
                  testSuccessfulTransfer("transferFrom");
                });

                describe("safeTransferFrom", function () {
                  testSuccessfulTransfer(
                    "safeTransferFrom(address,address,uint256)"
                  );
                });
              });

              context("unsuccessful transfers", function () {
                describe("transferFrom", function () {
                  testUnsuccessfulTransfer("transferFrom");
                });

                describe("safeTransferFrom", function () {
                  testUnsuccessfulTransfer(
                    "safeTransferFrom(address,address,uint256)"
                  );
                });
              });
            });
          });
        });
      });
    };

  describe("ERC721B", createTestSuite({ contract: "Collectible" }));
} else {
  console.log("Tests will only get executed if you run locally!");
}
