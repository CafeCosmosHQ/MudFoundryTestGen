// SPDX-License-Identifier: MIT

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
import { IncrementMoreSystem } from "../../src/namespaces/app/systems/IncrementMoreSystem.sol";
import { IncrementSystem } from "../../src/namespaces/app/systems/IncrementSystem.sol";

// Import tables
import { Counter } from "../../src/codegen/tables/Counter.sol";
import { CounterChickenMan } from "../../src/codegen/tables/CounterChickenMan.sol";
  
contract MudTestFoundry is Test {

    IWorld internal world;
    address internal worldAddress;
    address private registrationSystemAddress;
    
    bytes salt = abi.encodePacked(uint256(1337));
    
    using WorldResourceIdInstance for ResourceId;
    
    mapping(bytes32 => string[]) public functionSelector;
    mapping(bytes32 => string[]) public worldFunctionSelector;

    function addFunctionSelector(
      bytes32 system,
      string memory selector,              
      string memory worldSelector          
    ) private {
        functionSelector[system].push(selector);
        worldFunctionSelector[system].push(worldSelector);
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

        // Register namespaces
        world.registerNamespace(WorldResourceIdLib.encodeNamespace(bytes14("app")));

        // Register tables
        Counter.register();
        CounterChickenMan.register();
        
        setupFunctionSelectors();
        
        _registerSystem(new IncrementMoreSystem(), "IncrementMore", true, "app");
        _registerSystem(new IncrementSystem(), "Increment", true, "app");
    }

    function _registerSystem(System systemContract, bytes32 systemName, bool publicAccess, bytes14 namespace) internal {
        bytes16 systemName16 = truncateString(systemName);
        ResourceId systemId = WorldResourceIdLib.encode({
            typeId: RESOURCE_SYSTEM,
            namespace: namespace,
            name: systemName16
        });
        world.registerSystem(systemId, systemContract, publicAccess);
        for (uint i = 0; i < functionSelector[systemName].length; i++) {
            world.registerRootFunctionSelector(systemId, functionSelector[systemName][i], worldFunctionSelector[systemName][i]);
            world.registerFunctionSelector(systemId, functionSelector[systemName][i]);
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
      	addFunctionSelector("IncrementMore", "incrementMore(uint32,uint32)", "app__incrementMore(uint32,uint32)");
    	addFunctionSelector("Increment", "increment(uint32)", "app__increment(uint32)");
    }
}