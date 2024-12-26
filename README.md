`NOTE: This only works with a single root namespace (I started working on a solution in the other branch if anyone wants to add the functionality feel free)`

# MudFoundryTestGen
Generate a foundry base test that handles all deployment so you can use `forge test` instead of `mud test`

We wanted to work in foundry to have a more familiar grip of the workflow rather than using `pnpm mud test` so we built this to generate a base test that handles deploying and registering systems and tables. This is also useful to get a better understanding of how mud works for someone who is more foundry/solidity native.

## Args 
`-o` or `--output` specify output path of the base test

`-nb` or `--no-build` skips `pnpm mud build` which skips building the contracts. Useful if you want to generate the test and already have a `.mud/local/systems.json` that matches the current contracts. Hence if you haven't added/changed/removed any tables or added/removed any systems or system functions

## Instructions
place this in the contracts folder of your mud project (`my_mud_proj/contracts/foundryTestGen.js`)

run `node foundryTestGen.js [OPTIONAL ARGS]`

by default it will place the `MudTestFoundry.t.sol` base test at `my_mud_proj/test/util/MudTestFoundry.t.sol` but you can change this with the `-o` param

# Example usage

Your configuration base test inside `my_mud_proj/contracts/test/util/MyAwesomeBaseTest.t.sol`

Setting up your base test with all of your contract configurations

```Solidity
import {MyCoolTableA, MyCoolTableB, ...} from "../../src/codegen/index.sol";
import {MudTestFoundry} from "./MudTestFoundry.t.sol";

contract MyAwesomeBaseTest is MudTestFoundry {

  string player = "bob";
  bool isCool = true;
  
  function setUp() public{
    super.setUp();
    MyCoolTableA.setIsCool(player, isCool);
    //rest of table configurations. Normally would happen in script/PostDeploy.s.sol
  }

}
```

Using it in unit tests inside `my_mud_proj/contracts/test`

```Solidity
import {MyCoolTableA} from "../../src/codegen/index.sol";
import {MyAwesomeBaseTest} from "./MudTestFoundry.t.sol";

contract MyUnitTest is MyAwesomeBaseTest {

  function setUp() public {
    super.setUp();
  }

  function test_isCool() public {
    assertEq(true, MyCoolTableA.getIsCool(player));
  }

  ...

}

```

---

## What our full prod MudTestFoundry.t.sol actually looks like

```Solidity
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
import { CatalogueSystem } from "../../src/systems/CatalogueSystem.sol";
import { CraftingSystem } from "../../src/systems/CraftingSystem.sol";
import { LandConfigSystem } from "../../src/systems/LandConfigSystem.sol";
import { LandCreationSystem } from "../../src/systems/LandCreationSystem.sol";
import { LandERC1155HolderSystem } from "../../src/systems/LandERC1155HolderSystem.sol";
import { LandItemInteractionSystem } from "../../src/systems/LandItemInteractionSystem.sol";
import { LandItemsSystem } from "../../src/systems/LandItemsSystem.sol";
import { LandQuestsSystem } from "../../src/systems/LandQuestsSystem.sol";
import { LandScenarioUserTestingSystem } from "../../src/systems/LandScenarioUserTestingSystem.sol";
import { LandTokensSystem } from "../../src/systems/LandTokensSystem.sol";
import { LandViewSystem } from "../../src/systems/LandViewSystem.sol";
import { LevelingSystem } from "../../src/systems/LevelingSystem.sol";
import { QuestsDTOSystem } from "../../src/systems/QuestsDTOSystem.sol";
import { QuestsSystem } from "../../src/systems/QuestsSystem.sol";
import { TransformationsSystem } from "../../src/systems/TransformationsSystem.sol";
import { WaterControllerSystem } from "../../src/systems/WaterControllerSystem.sol";

// Import tables
import { ActiveStoves } from "../../src/codegen/tables/ActiveStoves.sol";
import { CafeCosmosConfig } from "../../src/codegen/tables/CafeCosmosConfig.sol";
import { Catalogue } from "../../src/codegen/tables/Catalogue.sol";
import { CatalogueItem } from "../../src/codegen/tables/CatalogueItem.sol";
import { ClaimedLevels } from "../../src/codegen/tables/ClaimedLevels.sol";
import { ConfigAddresses } from "../../src/codegen/tables/ConfigAddresses.sol";
import { CraftingRecipe } from "../../src/codegen/tables/CraftingRecipe.sol";
import { Inventory } from "../../src/codegen/tables/Inventory.sol";
import { ItemInfo } from "../../src/codegen/tables/ItemInfo.sol";
import { LandCell } from "../../src/codegen/tables/LandCell.sol";
import { LandInfo } from "../../src/codegen/tables/LandInfo.sol";
import { LandItem } from "../../src/codegen/tables/LandItem.sol";
import { LandItemCookingState } from "../../src/codegen/tables/LandItemCookingState.sol";
import { LandPermissions } from "../../src/codegen/tables/LandPermissions.sol";
import { LandQuest } from "../../src/codegen/tables/LandQuest.sol";
import { LandQuestGroup } from "../../src/codegen/tables/LandQuestGroup.sol";
import { LandQuestGroups } from "../../src/codegen/tables/LandQuestGroups.sol";
import { LandQuestTaskProgress } from "../../src/codegen/tables/LandQuestTaskProgress.sol";
import { LandTablesAndChairs } from "../../src/codegen/tables/LandTablesAndChairs.sol";
import { LevelReward } from "../../src/codegen/tables/LevelReward.sol";
import { Quest } from "../../src/codegen/tables/Quest.sol";
import { QuestCollection } from "../../src/codegen/tables/QuestCollection.sol";
import { QuestGroup } from "../../src/codegen/tables/QuestGroup.sol";
import { QuestTask } from "../../src/codegen/tables/QuestTask.sol";
import { Quests } from "../../src/codegen/tables/Quests.sol";
import { Reward } from "../../src/codegen/tables/Reward.sol";
import { RewardCollection } from "../../src/codegen/tables/RewardCollection.sol";
import { StackableItem } from "../../src/codegen/tables/StackableItem.sol";
import { TransformationCategories } from "../../src/codegen/tables/TransformationCategories.sol";
import { Transformations } from "../../src/codegen/tables/Transformations.sol";
import { WaterController } from "../../src/codegen/tables/WaterController.sol";

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
        ActiveStoves.register();
        CafeCosmosConfig.register();
        Catalogue.register();
        CatalogueItem.register();
        ClaimedLevels.register();
        ConfigAddresses.register();
        CraftingRecipe.register();
        Inventory.register();
        ItemInfo.register();
        LandCell.register();
        LandInfo.register();
        LandItem.register();
        LandItemCookingState.register();
        LandPermissions.register();
        LandQuest.register();
        LandQuestGroup.register();
        LandQuestGroups.register();
        LandQuestTaskProgress.register();
        LandTablesAndChairs.register();
        LevelReward.register();
        Quest.register();
        QuestCollection.register();
        QuestGroup.register();
        QuestTask.register();
        Quests.register();
        Reward.register();
        RewardCollection.register();
        StackableItem.register();
        TransformationCategories.register();
        Transformations.register();
        WaterController.register();
        
        setupFunctionSelectors();
        
        _registerSystem(new CatalogueSystem(), "Catalogue", true);
        _registerSystem(new CraftingSystem(), "Crafting", true);
        _registerSystem(new LandConfigSystem(), "LandConfig", true);
        _registerSystem(new LandCreationSystem(), "LandCreation", true);
        _registerSystem(new LandERC1155HolderSystem(), "LandERC1155Holder", true);
        _registerSystem(new LandItemInteractionSystem(), "LandItemInteraction", true);
        _registerSystem(new LandItemsSystem(), "LandItems", true);
        _registerSystem(new LandQuestsSystem(), "LandQuests", true);
        _registerSystem(new LandScenarioUserTestingSystem(), "LandScenarioUserTesting", true);
        _registerSystem(new LandTokensSystem(), "LandTokens", true);
        _registerSystem(new LandViewSystem(), "LandView", true);
        _registerSystem(new LevelingSystem(), "Leveling", true);
        _registerSystem(new QuestsDTOSystem(), "QuestsDTO", true);
        _registerSystem(new QuestsSystem(), "Quests", true);
        _registerSystem(new TransformationsSystem(), "Transformations", true);
        _registerSystem(new WaterControllerSystem(), "WaterController", true);
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
        addFunctionSelector("Catalogue", "getTotalCost((uint256,uint256)[])");
        addFunctionSelector("Catalogue", "getTotalCostAndSufficientBalanceToPurchaseItem(uint256,uint256,uint256)");
        addFunctionSelector("Catalogue", "getTotalCostAndSufficientBalanceToPurchaseItems(uint256,(uint256,uint256)[])");
        addFunctionSelector("Catalogue", "purchaseCatalogueItem(uint256,uint256,uint256)");
        addFunctionSelector("Catalogue", "purchaseCatalogueItems(uint256,(uint256,uint256)[])");
        addFunctionSelector("Catalogue", "upsertCatalogueItems((uint256,uint256,uint256,bool)[])");

        addFunctionSelector("Crafting", "craftRecipe(uint256,uint256)");
        addFunctionSelector("Crafting", "createRecipe((uint256,uint256,uint256,bool,uint256[],uint256[]))");
        addFunctionSelector("Crafting", "createRecipes((uint256,uint256,uint256,bool,uint256[],uint256[])[])");
        addFunctionSelector("Crafting", "removeRecipe((uint256,uint256,uint256,bool,uint256[],uint256[]))");

        addFunctionSelector("LandConfig", "approveLandOperator(uint256,address,bool)");
        addFunctionSelector("LandConfig", "getActiveStoves(uint256)");
        addFunctionSelector("LandConfig", "getCookingCost");
        addFunctionSelector("LandConfig", "getLandInfo(uint256)");
        addFunctionSelector("LandConfig", "getLandTablesAndChairsAddress");
        addFunctionSelector("LandConfig", "getSoftCostPerSquare");
        addFunctionSelector("LandConfig", "getSoftDestinationAddress");
        addFunctionSelector("LandConfig", "getSoftToken");
        addFunctionSelector("LandConfig", "setChair(uint256,bool)");
        addFunctionSelector("LandConfig", "setChunkSize(uint256)");
        addFunctionSelector("LandConfig", "setCookingCost(uint256)");
        addFunctionSelector("LandConfig", "setIsStackable(uint256,uint256,bool)");
        addFunctionSelector("LandConfig", "setItemConfigAddress(address)");
        addFunctionSelector("LandConfig", "setItems((uint256,(bool,bool,bool,bool,bool,bool,uint256,uint256,uint256))[])");
        addFunctionSelector("LandConfig", "setItems(address)");
        addFunctionSelector("LandConfig", "setLandNFTs(address)");
        addFunctionSelector("LandConfig", "setLandQuestTaskProgressUpdateAddress(address)");
        addFunctionSelector("LandConfig", "setLandTablesAndChairsAddress(address)");
        addFunctionSelector("LandConfig", "setLandTransformAddress(address)");
        addFunctionSelector("LandConfig", "setMaxLevel(uint256)");
        addFunctionSelector("LandConfig", "setMinStartingLimits(uint256,uint256)");
        addFunctionSelector("LandConfig", "setNonPlaceable(uint256,bool)");
        addFunctionSelector("LandConfig", "setNonPlaceableItems(uint256[])");
        addFunctionSelector("LandConfig", "setNonRemovable(uint256,bool)");
        addFunctionSelector("LandConfig", "setNonRemovableItems(uint256[])");
        addFunctionSelector("LandConfig", "setRedistributor(address)");
        addFunctionSelector("LandConfig", "setReturnItems(uint256[],uint256[])");
        addFunctionSelector("LandConfig", "setReturnsItem(uint256,uint256)");
        addFunctionSelector("LandConfig", "setRotatable(uint256[],bool)");
        addFunctionSelector("LandConfig", "setSoftCost(uint256)");
        addFunctionSelector("LandConfig", "setSoftDestination(address)");
        addFunctionSelector("LandConfig", "setSoftToken(address)");
        addFunctionSelector("LandConfig", "setStackableItems((uint256,uint256,bool)[])");
        addFunctionSelector("LandConfig", "setTable(uint256,bool)");
        addFunctionSelector("LandConfig", "setTool(uint256,bool)");
        addFunctionSelector("LandConfig", "setVesting(address)");

        addFunctionSelector("LandCreation", "calculateLandCost(uint256,uint256,uint256)");
        addFunctionSelector("LandCreation", "calculateLandCost(uint256,uint256)");
        addFunctionSelector("LandCreation", "createLand(uint256,uint256)");
        addFunctionSelector("LandCreation", "createPlayerInitialFreeLand");
        addFunctionSelector("LandCreation", "expandLand(uint256,uint256,uint256)");
        addFunctionSelector("LandCreation", "generateChunk(uint256)");
        addFunctionSelector("LandCreation", "setInitialLandItems((uint256,uint256,uint256)[],uint256,uint256)");
        addFunctionSelector("LandCreation", "setInitialLandLimits(uint256,uint256)");
        addFunctionSelector("LandCreation", "setLandName(uint256,string)");

        addFunctionSelector("LandERC1155Holder", "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)");
        addFunctionSelector("LandERC1155Holder", "onERC1155Received(address,address,uint256,uint256,bytes)");

        addFunctionSelector("LandItemInteraction", "moveItem(uint256,uint256,uint256,uint256,uint256)");
        addFunctionSelector("LandItemInteraction", "placeItem(uint256,uint256,uint256,uint256)");
        addFunctionSelector("LandItemInteraction", "removeItem(uint256,uint256,uint256)");
        addFunctionSelector("LandItemInteraction", "timestampCheck");
        addFunctionSelector("LandItemInteraction", "toggleRotation(uint256,uint256,uint256,uint256)");
        addFunctionSelector("LandItemInteraction", "updateStove(uint256,uint256,uint256)");

        addFunctionSelector("LandItems", "depositItems(uint256,uint256[],uint256[])");
        addFunctionSelector("LandItems", "itemBalanceOf(uint256,uint256)");
        addFunctionSelector("LandItems", "itemBalanceOfBatch(uint256,uint256[])");
        addFunctionSelector("LandItems", "withdrawItems(uint256,uint256[],uint256[])");

        addFunctionSelector("LandQuests", "activateAllQuestGroups(uint256)");
        addFunctionSelector("LandQuests", "activateLandQuestGroup(uint256,uint256)");
        addFunctionSelector("LandQuests", "getActiveLandQuestGroups(uint256)");
        addFunctionSelector("LandQuests", "getLandQuestGroup(uint256,uint256)");
        addFunctionSelector("LandQuests", "removeAllExpiredQuestGroups(uint256)");

        addFunctionSelector("LandScenarioUserTesting", "createUserTestScerarioLand(address,uint256,uint256,(uint256,uint256,uint256,uint256,uint256,bool,uint256,uint256)[])");
        addFunctionSelector("LandScenarioUserTesting", "resetUserTestLandScenario(uint256,uint256,uint256,(uint256,uint256,uint256,uint256,uint256,bool,uint256,uint256)[])");

        addFunctionSelector("LandTokens", "depositTokens(uint256,uint256)");
        addFunctionSelector("LandTokens", "tokenBalanceOf(uint256)");
        addFunctionSelector("LandTokens", "withdrawTokens(uint256,uint256)");

        addFunctionSelector("LandView", "getActiveTables(uint256)");
        addFunctionSelector("LandView", "getChairsOfTables(uint256,uint256,uint256)");
        addFunctionSelector("LandView", "getLandItems(uint256,uint256,uint256)");
        addFunctionSelector("LandView", "getLandItems3d(uint256)");
        addFunctionSelector("LandView", "getPlacementTime(uint256,uint256,uint256)");
        addFunctionSelector("LandView", "getRotation(uint256,uint256,uint256)");
        addFunctionSelector("LandView", "getTablesOfChairs(uint256,uint256,uint256)");

        addFunctionSelector("Leveling", "unlockAllLevels(uint256)");
        addFunctionSelector("Leveling", "unlockLevel(uint256,uint256)");
        addFunctionSelector("Leveling", "unlockLevels(uint256,uint256[])");
        addFunctionSelector("Leveling", "upsertLevelReward((uint256,uint256,uint256,uint256[]))");
        addFunctionSelector("Leveling", "upsertLevelRewards((uint256,uint256,uint256,uint256[])[])");

        addFunctionSelector("QuestsDTO", "addNewQuest((uint256,(uint256,bool,uint256[],string,bytes32[]),(bytes32,(uint256,uint256,bytes32,uint256,bool,string,bytes32[]))[],(uint256,(uint256,uint256,uint256))[]))");
        addFunctionSelector("QuestsDTO", "addNewQuests((uint256,(uint256,bool,uint256[],string,bytes32[]),(bytes32,(uint256,uint256,bytes32,uint256,bool,string,bytes32[]))[],(uint256,(uint256,uint256,uint256))[])[])");
        addFunctionSelector("QuestsDTO", "addRewards((uint256,(uint256,uint256,uint256))[])");
        addFunctionSelector("QuestsDTO", "getAllActiveQuestGroups");
        addFunctionSelector("QuestsDTO", "getAllQuests");
        addFunctionSelector("QuestsDTO", "getQuest(uint256)");
        addFunctionSelector("QuestsDTO", "updateQuest(uint256,(uint256,bool,uint256[],string,bytes32[]))");
        addFunctionSelector("QuestsDTO", "upsertQuestCollections((uint256,uint256[])[])");
        addFunctionSelector("QuestsDTO", "upsertRewardColletions((uint256,uint256[])[])");
        addFunctionSelector("QuestsDTO", "upsertTransformationCategories((uint256,uint256,uint256[])[])");

        addFunctionSelector("Quests", "createDailyQuestIfNotExists");
        addFunctionSelector("Quests", "createWeeklyQuestIfNotExists");
        addFunctionSelector("Quests", "getAllActiveQuestGroupIds");

        addFunctionSelector("Transformations", "getTransformation(uint256,uint256)");
        addFunctionSelector("Transformations", "setTransformation((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,bool,uint256,bool))");
        addFunctionSelector("Transformations", "setTransformations((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,bool,uint256,bool)[])");

        addFunctionSelector("WaterController", "axiomV2Callback(uint64,address,bytes32,uint256,bytes32[],bytes)");
        addFunctionSelector("WaterController", "axiomV2OffchainCallback(uint64,address,bytes32,uint256,bytes32[],bytes)");
        addFunctionSelector("WaterController", "axiomV2QueryAddress");
        addFunctionSelector("WaterController", "getWaterYieldTime");
        addFunctionSelector("WaterController", "InitialiseWaterController(address,uint64,bytes32)");
        addFunctionSelector("WaterController", "setAxionV2QueryAddress(address)");
        addFunctionSelector("WaterController", "setWaterControllerParameters(uint256,uint256,uint256,uint256,uint256,int256,int256)");
    }
}
```

  
