const { network } = require("hardhat");
const hre = require("hardhat");
const { readContractAddress } = require("../utils/helpers");

async function main() {
  const address = readContractAddress(network.name);
  const collectible = await hre.ethers.getContractAt("Collectible", address);
  console.log("withdraw money");
  await collectible.withdrawMoney();
}

main()
  .then((e) => {
    console.log(e ?? "success");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
