import { HardhatUserConfig } from "hardhat/config";

import "@typechain/hardhat";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-dependency-compiler";
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
  dependencyCompiler: {
    paths: [
      "@zerolendxyz/core-v3/contracts/mocks/helpers/MockIncentivesController.sol",
      "@zerolendxyz/core-v3/contracts/mocks/helpers/MockReserveConfiguration.sol",
      "@zerolendxyz/core-v3/contracts/mocks/oracle/CLAggregators/MockAggregator.sol",
      "@zerolendxyz/core-v3/contracts/mocks/tokens/MintableERC20.sol",
      "@zerolendxyz/core-v3/contracts/mocks/flashloan/MockFlashLoanReceiver.sol",
      "@zerolendxyz/core-v3/contracts/mocks/tokens/WETH9Mocked.sol",
      "@zerolendxyz/core-v3/contracts/mocks/upgradeability/MockVariableDebtToken.sol",
      "@zerolendxyz/core-v3/contracts/mocks/upgradeability/MockAToken.sol",
      "@zerolendxyz/core-v3/contracts/mocks/upgradeability/MockStableDebtToken.sol",
      "@zerolendxyz/core-v3/contracts/mocks/upgradeability/MockInitializableImplementation.sol",
      "@zerolendxyz/core-v3/contracts/protocol/configuration/PoolAddressesProviderRegistry.sol",
      "@zerolendxyz/core-v3/contracts/protocol/configuration/PoolAddressesProvider.sol",
      "@zerolendxyz/core-v3/contracts/misc/AaveOracle.sol",
      "@zerolendxyz/core-v3/contracts/protocol/tokenization/AToken.sol",
      "@zerolendxyz/core-v3/contracts/protocol/tokenization/DelegationAwareAToken.sol",
      "@zerolendxyz/core-v3/contracts/protocol/tokenization/StableDebtToken.sol",
      "@zerolendxyz/core-v3/contracts/protocol/tokenization/VariableDebtToken.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/GenericLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/ValidationLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/ReserveLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/SupplyLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/EModeLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/BorrowLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/BridgeLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/logic/CalldataLogic.sol",
      "@zerolendxyz/core-v3/contracts/protocol/pool/Pool.sol",
      "@zerolendxyz/core-v3/contracts/protocol/pool/L2Pool.sol",
      "@zerolendxyz/core-v3/contracts/protocol/pool/PoolConfigurator.sol",
      "@zerolendxyz/core-v3/contracts/protocol/pool/DefaultReserveInterestRateStrategy.sol",
      "@zerolendxyz/core-v3/contracts/protocol/libraries/aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol",
      "@zerolendxyz/core-v3/contracts/dependencies/openzeppelin/upgradeability/InitializableAdminUpgradeabilityProxy.sol",
      "@zerolendxyz/core-v3/contracts/deployments/ReservesSetupHelper.sol",
      "@zerolendxyz/core-v3/contracts/misc/AaveProtocolDataProvider.sol",
      "@zerolendxyz/core-v3/contracts/misc/L2Encoder.sol",
      "@zerolendxyz/core-v3/contracts/protocol/configuration/ACLManager.sol",
      "@zerolendxyz/core-v3/contracts/dependencies/weth/WETH9.sol",
      "@zerolendxyz/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol",
      "@zerolendxyz/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol",
      "@zerolendxyz/core-v3/contracts/mocks/oracle/PriceOracle.sol",
      "@zerolendxyz/core-v3/contracts/mocks/tokens/MintableDelegationERC20.sol",
      "@zerolendxyz/periphery-v3/contracts/mocks/testnet-helpers/TestnetERC20.sol",
    ],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.12",
        settings: {
          optimizer: { enabled: true, runs: 100_000 },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 100_000 },
        },
      },
    ],
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
