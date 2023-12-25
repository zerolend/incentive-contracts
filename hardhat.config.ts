import { HardhatUserConfig } from "hardhat/config";

import "@typechain/hardhat";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-abi-exporter";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  typechain: {
    target: "ethers-v6",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false, // defaults to false
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic:
          "burger broccoli appear involve admit own next member begin direct flee host seven game hat",
      },
    },
  },
  abiExporter: {
    path: "./generated-abi",
    runOnCompile: true,
    clear: true,
    // flat: true,
    spacing: 2,
    // pretty: true,
    // format: "minimal",
  },

  solidity: {
    version: "0.8.20",
  },
};

export default config;

// import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";
// import "@typechain/hardhat";
// import "hardhat-abi-exporter";

// // You need to export an object to set up your config
// // Go to https://hardhat.org/config/ to learn more

// const config: HardhatUserConfig = {
//   defaultNetwork: "hardhat",
//   networks: {
//     hardhat: {
//       allowUnlimitedContractSize: true,
//       accounts: {
//         mnemonic:
//           "burger broccoli appear involve admit own next member begin direct flee host seven game hat",
//       },
//     },
//   },
//   typechain: {
//     outDir: "typechain",
//     target: "ethers-v5",
//   },
//   abiExporter: {
//     path: "abis",
//     runOnCompile: true,
//     clear: true,
//     flat: true,
//     spacing: 2,
//     pretty: true,
//   },
//   solidity: {
//     version: "0.8.20",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 1000,
//       },
//     },
//   },
// };

// export default config;
