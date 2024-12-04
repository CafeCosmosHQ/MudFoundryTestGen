const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    output: './test/util/MudTestFoundry.t.sol',
    skipBuild: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-nb':
      case '--no-build':
        options.skipBuild = true;
        break;
    }
  }

  return options;
}

function runMudBuild() {
  try {
    execSync('pnpm mud build', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Error running mud build:', error.message);
    return false;
  }
}

function generateSolidityTest(systems) {
  const functionSelectors = {};
  let currentSystem = '';
  
  systems.forEach(system => {
    const name = system.label;
    // Remove "System" from the label if it exists
    const cleanName = name.endsWith('System') ? name.slice(0, -6) : name;
    functionSelectors[cleanName] = system.abi
      .filter(abi => !abi.startsWith('error') && !abi.startsWith('event'))
  });

  const imports = `// SPDX-License-Identifier: MIT

// import MUD core
import { World } from "@latticexyz/world/src/World.sol";
import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { WorldFactory } from "@latticexyz/world/src/WorldFactory.sol";
import { IModule } from "@latticexyz/world/src/IModule.sol";
import { Module } from "@latticexyz/world/src/Module.sol";
import { InitModule } from "@latticexyz/world/src/modules/init/InitModule.sol";
import { AccessManagementSystem } from "@latticexyz/world/src/modules/init/implementations/AccessManagementSystem.sol";
import { BalanceTransferSystem } from "@latticexyz/world/src/modules/init/implementations/BalanceTransferSystem.sol";
import { BatchCallSystem } from "@latticexyz/world/src/modules/init/implementations/BatchCallSystem.sol";
import { RegistrationSystem } from "@latticexyz/world/src/modules/init/RegistrationSystem.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { Test } from "forge-std/test.sol";
import { ResourceId, WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { WorldContextProviderLib } from "@latticexyz/world/src/WorldContext.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { WorldRegistrationSystem } from "@latticexyz/world/src/modules/init/implementations/WorldRegistrationSystem.sol";
import { ResourceIdLib } from "@latticexyz/store/src/ResourceId.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import "forge-std/console.sol";

// Import systems
${systems.map(system => `import { ${system.label} } from "../../src/systems/${system.label}.sol";`).join('\n')}`;

  const contractCode = `

contract MudTestFoundry is Test {
    IWorld internal world;
    address internal worldAddress;
    address private registrationSystemAddress;
    
    bytes salt = abi.encodePacked(uint256(1337));
    
    using WorldResourceIdInstance for ResourceId;
    
    mapping(bytes32 => string[]) public functionSelector;

    function addFunctionSelector(bytes32 key, string memory value) private {
        functionSelector[key].push(value);
    }

    function setUp() public virtual {
        RegistrationSystem registrationSystem = new RegistrationSystem();
        registrationSystemAddress = address(registrationSystem);
        
        InitModule initModule = new InitModule(
            new AccessManagementSystem(),
            new BalanceTransferSystem(), 
            new BatchCallSystem(), 
            registrationSystem
        );
        
        WorldFactory factory = new WorldFactory(initModule);
        world = IWorld(factory.deployWorld(salt));
        worldAddress = address(world);
        
        StoreSwitch.setStoreAddress(address(world));
        
        setupFunctionSelectors();
        
        ${systems.map(system => {
          const cleanName = system.label.endsWith('System') ? system.label.slice(0, -6) : system.label;
          return `_registerSystem(new ${system.label}(), "${cleanName}", true);`
        }).join('\n        ')}
    }

    function _registerSystem(System systemContract, bytes32 systemName, bool publicAccess) internal {
        bytes16 systemName16 = truncateString(systemName);
        ResourceId systemId = WorldResourceIdLib.encode({
            typeId: RESOURCE_SYSTEM,
            namespace: "",
            name: systemName16
        });
        world.registerSystem(systemId, systemContract, publicAccess);
        for (uint i = 0; i < functionSelector[systemName].length; i++) {
            world.registerRootFunctionSelector(systemId, functionSelector[systemName][i], functionSelector[systemName][i]);
        }
    }

    function truncateString(bytes32 strBytes) internal pure returns (bytes16) {
        bytes16 truncated;
        for (uint i = 0; i < 16; i++) {
            if (i < strBytes.length) {
                truncated |= bytes16(strBytes[i] & 0xFF) >> (i * 8);
            }
        }
        return truncated;
    }

    function setupFunctionSelectors() private {
        ${Object.entries(functionSelectors).map(([name, funcs], idx, arr) => {
          const selectors = funcs.map(func => `addFunctionSelector("${name}", "${func}");`).join('\n        ');
          return idx < arr.length - 1 ? selectors + '\n' : selectors;
        }).join('\n        ')}
    }
}`;

  return imports + contractCode;
}

async function main() {
  const options = parseArgs();
  
  if (!options.skipBuild) {
    console.log('Running mud build...');
    if (!runMudBuild()) process.exit(1);
  } 

  if (!fs.existsSync('.mud/local')) {
    console.error('Error: .mud/local directory not found');
    process.exit(1);
  }
  
  try {
    const systems = JSON.parse(fs.readFileSync('./.mud/local/systems.json', 'utf8')).systems;
    if (!Array.isArray(systems)) throw new Error('Invalid systems.json format');
    
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    fs.writeFileSync(options.output, generateSolidityTest(systems));
    console.log(`Successfully generated ${options.output}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
