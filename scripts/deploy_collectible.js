const { network } = require("hardhat");
const { writeContractAddress } = require("../utils/helpers");
const { developmentChains } = require("../hardhat.helper.config")

async function main() {
  const CollectibleContract = await ethers.getContractFactory("Collectible");
  console.log("Deploying...");
  const contract = await CollectibleContract.deploy();
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);

  writeContractAddress(network.name, contract.address);
  if(!developmentChains.includes(network.name))
  {
    console.log(`Verify with:\n npx hardhat verify --network ${network.name} ${contract.address}`);
  }
}

main()
  .then((e) => {
    console.log(e || "success");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
