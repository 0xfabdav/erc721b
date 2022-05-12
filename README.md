# setup

```
npm i
```

create an .env file
```
export PRIVATE_KEY=[METAMASK_PRIVATE_KEY]
export WEB3_INFURA_PROJECT_ID=[PROJECT_ID]
export ETHERSCAN_TOKEN=[ETHERSCAN_API_TOKEN]
export REPORT_GAS=true
```

# compile

```
npx hardhat compile
```

# runscript

run remote

```
npx hardhat run scripts/create_collectible.js --network ropsten
```

oder local

```
npx hardhat run scripts/create_collectible.js
```

# report gas use

npx hardhat test
