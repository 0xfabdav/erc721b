const fs = require("fs");

const readMapping = () => {
  try {
    const data = fs.readFileSync(
      __dirname + "/../networkcontractmappings.json",
      "utf8"
    );
    const mapping = JSON.parse(data);
    return mapping;
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
};

const readContractAddress = (network) => {
  try {
    const mapping = readMapping();
    return mapping[network];
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
};

const writeContractAddress = (network, address) => {
  const mapping = readMapping();
  mapping[network] = address;
  try {
    const data = JSON.stringify(mapping, null, 4);
    fs.writeFileSync(
      __dirname + "/../networkcontractmappings.json",
      data,
      "utf8"
    );
  } catch (err) {
    console.log(`Error writing file: ${err}`);
  }
};

module.exports = { readContractAddress, writeContractAddress };
