const { network, ...hre } = require("hardhat");
const { readContractAddress } = require("../utils/helpers");
const { PRICE } = require("../utils/constants");

async function main() {
  const address = readContractAddress(network.name);
  const collectible = await hre.ethers.getContractAt("Collectible", address);
  const quantity = 5;
  console.log("...minting");
  await collectible["publicBatchMint_Kh1x"](quantity, {
    value: hre.ethers.BigNumber.from(`${PRICE * quantity}`), // 0.05 * 10 ** 18 =  50000000000000000n
  });
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
