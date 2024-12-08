const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


function getTables() {
  const tablesDir = path.join(process.cwd(), 'src/codegen/tables');
  try {
    if (!fs.existsSync(tablesDir)) {
      throw new Error('Tables directory not found at src/codegen/tables');
    }
    return fs.readdirSync(tablesDir)
      .filter(file => file.endsWith('.sol'))
      .map(file => path.basename(file, '.sol'));
  } catch (error) {
    console.error('Error reading tables directory:', error.message);
    process.exit(1);
  }
}

const dataTypes = [
  'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64',
  'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128',
  'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192', 
  'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',
  'int8', 'int16', 'int24', 'int32', 'int40', 'int48', 'int56', 'int64',
  'int72', 'int80', 'int88', 'int96', 'int104', 'int112', 'int120', 'int128',
  'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184', 'int192',
  'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',
  'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
  'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
  'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
  'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32',
  'bool', 'address', 'string', 'bytes'
 ];
 
 function cleanSignature(sig) {
  const firstSpace = sig.indexOf(' ');
  const functionName = sig.substring(0, firstSpace);
  
  const rest = sig.substring(firstSpace)
    .replace(/\w+(?=[\s,\)])/g, word => 
      dataTypes.includes(word) ? word : ''
    )
    .replace(/\s+/g, '')
    .replace(/,+/g, ',')
    .replace(/\(\)/g, '')
    .replace(/\(\,/g, '(')
    .replace(/\,\)/g, ')');
 
  return functionName + rest;
 }

function generateSolidityTest(systems) {
  const functionSelectors = {};
  
  systems.forEach(system => {
    const name = system.label;
    const cleanName = name.endsWith('System') ? name.slice(0, -6) : name;
    functionSelectors[cleanName] = system.abi
      .filter(abi => !abi.startsWith('error') && !abi.startsWith('event'))
      .map(sig => {
        if (!sig.startsWith('function')) return sig;
        let cleaned = sig
          .replace('function ', '')
          .split(' returns ')[0]
          .split(' view')[0]
          .split(' pure')[0]
          .split(' payable')[0]
          .replace(/\((.*?)\)/, (match, params) => {
            const types = params.split(',').map(param => {
              const rawType = param.trim().split(' ')[0];
              // Keep the struct name for complex types
              return rawType.match(/\(.*?\)/) ? rawType.split('(')[0] : rawType;
            });
            return `(${types.join(',')})`;
          });
          // console.log(cleanSignature(cleaned));
        return cleanSignature(cleaned);
      });
  });


  const tables = getTables();
  
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
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import "forge-std/console.sol";

// Import systems
${systems.map(system => `import { ${system.label} } from "../../src/systems/${system.label}.sol";`).join('\n')}

// Import tables
${tables.map(table => `import { ${table} } from "../../src/codegen/tables/${table}.sol";`).join('\n')}`;

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

        // Register tables
        ${tables.map(table => `${table}.register();`).join('\n        ')}
        
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

function runMudGen() {
  try {
    execSync('pnpm mud build', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Error running mud generators:', error.message);
    return false;
  }
}

async function main() {
  const options = parseArgs();
  
  if (!options.skipBuild) {
    console.log('Running mud generators...');
    if (!runMudGen()) process.exit(1);
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
