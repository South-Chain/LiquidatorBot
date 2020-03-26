/* eslint-disable */
require('ts-node/register');
const fs = require('fs')
const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 5000000
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, "https://kovan.infura.io/v3/ae145ebad7c8499db7901246fd1271f7");
      },
      network_id: 42,
      gas: 6700000,
      gasPrice: 10000000000
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/v3/ae145ebad7c8499db7901246fd1271f7");
      },
      network_id: 1,
      gas: 1600000,
      gasPrice: 4000000000
    },
  },
  compilers: {
    solc: {
      version: "0.5.10",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
};
