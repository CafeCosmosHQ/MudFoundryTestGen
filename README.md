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

  string player = "bob"
  bool isCool = true;
  
  function setUp() public{
    super.setUp()
    MyCoolTableA.setIsCool(player, isCool);
    //rest of table configurations. Normally would happen in script/PostDeploy.s.sol
  }

}
```

Using it in unit tests inside `my_mud_proj/contracts/test`

```Solidity
import {MyAwesomeBaseTest} from "./MudTestFoundry.t.sol";

contract MyUnitTest is MyAwesomeBaseTest {

  function setUp() public {
    super.setUp()
  }

  function test_isCool() public {
    assertEq(true, MyCoolTableA.getIsCool(player))
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
        addFunctionSelector("Catalogue", "function getTotalCost((uint256 itemId, uint256 quantity)[] items) view returns (uint256 totalCost)");
        addFunctionSelector("Catalogue", "function getTotalCostAndSufficientBalanceToPurchaseItem(uint256 landId, uint256 itemId, uint256 quantity) view returns (bool sufficient, uint256 totalCost)");
        addFunctionSelector("Catalogue", "function getTotalCostAndSufficientBalanceToPurchaseItems(uint256 landId, (uint256 itemId, uint256 quantity)[] items) view returns (bool sufficient, uint256 totalCost)");
        addFunctionSelector("Catalogue", "function purchaseCatalogueItem(uint256 landId, uint256 itemId, uint256 quantity)");
        addFunctionSelector("Catalogue", "function purchaseCatalogueItems(uint256 landId, (uint256 itemId, uint256 quantity)[] items)");
        addFunctionSelector("Catalogue", "function upsertCatalogueItems((uint256 itemId, uint256 price, uint256 catalogueId, bool exists)[] items)");

        addFunctionSelector("Crafting", "function craftRecipe(uint256 landId, uint256 output)");
        addFunctionSelector("Crafting", "function createRecipe((uint256 output, uint256 outputQuantity, uint256 xp, bool exists, uint256[] inputs, uint256[] quantities) recipe)");
        addFunctionSelector("Crafting", "function createRecipes((uint256 output, uint256 outputQuantity, uint256 xp, bool exists, uint256[] inputs, uint256[] quantities)[] recipes)");
        addFunctionSelector("Crafting", "function removeRecipe((uint256 output, uint256 outputQuantity, uint256 xp, bool exists, uint256[] inputs, uint256[] quantities) recipe)");

        addFunctionSelector("LandConfig", "function approveLandOperator(uint256 landId, address operator, bool status)");
        addFunctionSelector("LandConfig", "function getActiveStoves(uint256 stoveId) view returns (uint256)");
        addFunctionSelector("LandConfig", "function getCookingCost() view returns (uint256)");
        addFunctionSelector("LandConfig", "function getLandInfo(uint256 landId) view returns ((uint256 limitX, uint256 limitY, uint256 activeTables, uint256 activeStoves, bool isInitialized, uint32 seed, uint256 tokenBalance, uint256 cumulativeXp, uint256 lastLevelClaimed, uint256[] yBound) landInfo)");
        addFunctionSelector("LandConfig", "function getLandTablesAndChairsAddress() view returns (address)");
        addFunctionSelector("LandConfig", "function getSoftCostPerSquare() view returns (uint256)");
        addFunctionSelector("LandConfig", "function getSoftDestinationAddress() view returns (address)");
        addFunctionSelector("LandConfig", "function getSoftToken() view returns (address)");
        addFunctionSelector("LandConfig", "function setChair(uint256 _chair, bool _isChair)");
        addFunctionSelector("LandConfig", "function setChunkSize(uint256 chunkSize)");
        addFunctionSelector("LandConfig", "function setCookingCost(uint256 cookingCost_)");
        addFunctionSelector("LandConfig", "function setIsStackable(uint256 _base, uint256 _input, bool _isStackable)");
        addFunctionSelector("LandConfig", "function setItemConfigAddress(address itemConfigAddress_)");
        addFunctionSelector("LandConfig", "function setItems((uint256 itemId, (bool nonRemovable, bool nonPlaceable, bool isTool, bool isTable, bool isChair, bool isRotatable, uint256 themeId, uint256 itemCategory, uint256 returnsItem) itemInfo)[] items)");
        addFunctionSelector("LandConfig", "function setItems(address items)");
        addFunctionSelector("LandConfig", "function setLandNFTs(address landNFTs_)");
        addFunctionSelector("LandConfig", "function setLandQuestTaskProgressUpdateAddress(address landQuestTaskProgressUpdateAddress_)");
        addFunctionSelector("LandConfig", "function setLandTablesAndChairsAddress(address landTablesAndChairsAddress_)");
        addFunctionSelector("LandConfig", "function setLandTransformAddress(address landTransformAddress_)");
        addFunctionSelector("LandConfig", "function setMaxLevel(uint256 maxLevel_)");
        addFunctionSelector("LandConfig", "function setMinStartingLimits(uint256 minStartingX, uint256 minStartingY)");
        addFunctionSelector("LandConfig", "function setNonPlaceable(uint256 _nonPlaceable, bool _placeable)");
        addFunctionSelector("LandConfig", "function setNonPlaceableItems(uint256[] items)");
        addFunctionSelector("LandConfig", "function setNonRemovable(uint256 _nonRemovables, bool _removable)");
        addFunctionSelector("LandConfig", "function setNonRemovableItems(uint256[] items)");
        addFunctionSelector("LandConfig", "function setRedistributor(address _redistributor)");
        addFunctionSelector("LandConfig", "function setReturnItems(uint256[] items, uint256[] itemsReturned)");
        addFunctionSelector("LandConfig", "function setReturnsItem(uint256 _itemId, uint256 _itemReturned)");
        addFunctionSelector("LandConfig", "function setRotatable(uint256[] _itemIds, bool _isRotatable)");
        addFunctionSelector("LandConfig", "function setSoftCost(uint256 softCost_)");
        addFunctionSelector("LandConfig", "function setSoftDestination(address softDestination_)");
        addFunctionSelector("LandConfig", "function setSoftToken(address softToken_)");
        addFunctionSelector("LandConfig", "function setStackableItems((uint256 base, uint256 input, bool stackable)[] stackableItems)");
        addFunctionSelector("LandConfig", "function setTable(uint256 _table, bool _isTable)");
        addFunctionSelector("LandConfig", "function setTool(uint256 _tool, bool _isTool)");
        addFunctionSelector("LandConfig", "function setVesting(address vesting_)");

        addFunctionSelector("LandCreation", "function calculateLandCost(uint256 landId, uint256 x1, uint256 y1) view returns (uint256 softCost)");
        addFunctionSelector("LandCreation", "function calculateLandCost(uint256 x0, uint256 y0) view returns (uint256 softCost)");
        addFunctionSelector("LandCreation", "function createLand(uint256 limitX, uint256 limitY) returns (uint256 landId)");
        addFunctionSelector("LandCreation", "function createPlayerInitialFreeLand() returns (uint256 landId)");
        addFunctionSelector("LandCreation", "function expandLand(uint256 landId, uint256 x1, uint256 y1)");
        addFunctionSelector("LandCreation", "function generateChunk(uint256 landId)");
        addFunctionSelector("LandCreation", "function setInitialLandItems((uint256 x, uint256 y, uint256 itemId)[] items, uint256 landIndex, uint256 _initialLandItemsDefaultIndex)");
        addFunctionSelector("LandCreation", "function setInitialLandLimits(uint256 limitX, uint256 limitY)");
        addFunctionSelector("LandCreation", "function setLandName(uint256 landId, string name)");

        addFunctionSelector("LandERC1155Holder", "function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) returns (bytes4)");
        addFunctionSelector("LandERC1155Holder", "function onERC1155Received(address, address, uint256, uint256, bytes) returns (bytes4)");

        addFunctionSelector("LandItemInteraction", "function moveItem(uint256 landId, uint256 srcX, uint256 srcY, uint256 dstX, uint256 dstY)");
        addFunctionSelector("LandItemInteraction", "function placeItem(uint256 landId, uint256 x, uint256 y, uint256 itemId)");
        addFunctionSelector("LandItemInteraction", "function removeItem(uint256 landId, uint256 x, uint256 y)");
        addFunctionSelector("LandItemInteraction", "function timestampCheck()");
        addFunctionSelector("LandItemInteraction", "function toggleRotation(uint256 landId, uint256 x, uint256 y, uint256 z)");
        addFunctionSelector("LandItemInteraction", "function updateStove(uint256 landId, uint256 x, uint256 y)");

        addFunctionSelector("LandItems", "function depositItems(uint256 landId, uint256[] itemIds, uint256[] amounts)");
        addFunctionSelector("LandItems", "function itemBalanceOf(uint256 landId, uint256 itemId) view returns (uint256)");
        addFunctionSelector("LandItems", "function itemBalanceOfBatch(uint256 landId, uint256[] ids) view returns (uint256[])");
        addFunctionSelector("LandItems", "function withdrawItems(uint256 landId, uint256[] itemIds, uint256[] amounts)");

        addFunctionSelector("LandQuests", "function activateAllQuestGroups(uint256 landId)");
        addFunctionSelector("LandQuests", "function activateLandQuestGroup(uint256 landId, uint256 questGroupId)");
        addFunctionSelector("LandQuests", "function getActiveLandQuestGroups(uint256 landId) view returns ((uint256 landId, uint256 questGroupId, (bool active, uint256 numberOfQuests, uint256 numberOfCompletedQuests, bool claimed, uint256 expiresAt) landQuestGroup, (uint256 landId, uint256 questGroupId, uint256 questId, (uint256 numberOfTasks, uint256 numberOfCompletedTasks, bool claimed, bool active, uint256 expiresAt) landQuest, (bytes32 taskId, uint256 landId, uint256 questGroupId, uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, (uint256 taskProgress, bool taskCompleted) landQuestTask)[] landQuestTasks)[] landQuests)[])");
        addFunctionSelector("LandQuests", "function getLandQuestGroup(uint256 landId, uint256 questGroupId) view returns ((uint256 landId, uint256 questGroupId, (bool active, uint256 numberOfQuests, uint256 numberOfCompletedQuests, bool claimed, uint256 expiresAt) landQuestGroup, (uint256 landId, uint256 questGroupId, uint256 questId, (uint256 numberOfTasks, uint256 numberOfCompletedTasks, bool claimed, bool active, uint256 expiresAt) landQuest, (bytes32 taskId, uint256 landId, uint256 questGroupId, uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, (uint256 taskProgress, bool taskCompleted) landQuestTask)[] landQuestTasks)[] landQuests))");
        addFunctionSelector("LandQuests", "function removeAllExpiredQuestGroups(uint256 landId)");

        addFunctionSelector("LandScenarioUserTesting", "function createUserTestScerarioLand(address player, uint256 limitX, uint256 limitY, (uint256 x, uint256 y, uint256 itemId, uint256 placementTime, uint256 stackIndex, bool isRotated, uint256 dynamicUnlockTime, uint256 dynamicTimeoutTime)[] landItems)");
        addFunctionSelector("LandScenarioUserTesting", "function resetUserTestLandScenario(uint256 landId, uint256 limitX, uint256 limitY, (uint256 x, uint256 y, uint256 itemId, uint256 placementTime, uint256 stackIndex, bool isRotated, uint256 dynamicUnlockTime, uint256 dynamicTimeoutTime)[] landItems)");

        addFunctionSelector("LandTokens", "function depositTokens(uint256 landId, uint256 amount)");
        addFunctionSelector("LandTokens", "function tokenBalanceOf(uint256 landId) view returns (uint256)");
        addFunctionSelector("LandTokens", "function withdrawTokens(uint256 landId, uint256 amount)");

        addFunctionSelector("LandView", "function getActiveTables(uint256 landId) view returns (uint256)");
        addFunctionSelector("LandView", "function getChairsOfTables(uint256 landId, uint256 x, uint256 y) view returns (uint256[3])");
        addFunctionSelector("LandView", "function getLandItems(uint256 landId, uint256 x, uint256 y) view returns ((uint256 x, uint256 y, uint256 itemId, uint256 placementTime, uint256 stackIndex, bool isRotated, uint256 dynamicUnlockTime, uint256 dynamicTimeoutTime)[] landItems)");
        addFunctionSelector("LandView", "function getLandItems3d(uint256 landId) view returns ((uint256 x, uint256 y, uint256 itemId, uint256 placementTime, uint256 stackIndex, bool isRotated, uint256 dynamicUnlockTime, uint256 dynamicTimeoutTime)[][][] land3d)");
        addFunctionSelector("LandView", "function getPlacementTime(uint256 landId, uint256 x, uint256 y) view returns (uint256)");
        addFunctionSelector("LandView", "function getRotation(uint256 landId, uint256 x, uint256 y) view returns (bool)");
        addFunctionSelector("LandView", "function getTablesOfChairs(uint256 landId, uint256 x, uint256 y) view returns (uint256[3])");

        addFunctionSelector("Leveling", "function unlockAllLevels(uint256 landId)");
        addFunctionSelector("Leveling", "function unlockLevel(uint256 landId, uint256 level)");
        addFunctionSelector("Leveling", "function unlockLevels(uint256 landId, uint256[] levels)");
        addFunctionSelector("Leveling", "function upsertLevelReward((uint256 level, uint256 tokens, uint256 cumulativeXp, uint256[] items) levelReward)");
        addFunctionSelector("Leveling", "function upsertLevelRewards((uint256 level, uint256 tokens, uint256 cumulativeXp, uint256[] items)[] levelRewards)");

        addFunctionSelector("QuestsDTO", "function addNewQuest((uint256 id, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest, (bytes32 taskId, (uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, bool exists, string name, bytes32[] taskKeys) task)[] tasks, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards) questDTO)");
        addFunctionSelector("QuestsDTO", "function addNewQuests((uint256 id, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest, (bytes32 taskId, (uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, bool exists, string name, bytes32[] taskKeys) task)[] tasks, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards)[] quests)");
        addFunctionSelector("QuestsDTO", "function addRewards((uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewardDTO)");
        addFunctionSelector("QuestsDTO", "function getAllActiveQuestGroups() view returns ((uint256 id, (uint256 startsAt, uint256 expiresAt, bool sequential, uint256 questGroupType, uint256[] questIds, uint256[] rewardIds) questGroup, (uint256 id, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest, (bytes32 taskId, (uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, bool exists, string name, bytes32[] taskKeys) task)[] tasks, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards)[] quests, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards)[] questGroups)");
        addFunctionSelector("QuestsDTO", "function getAllQuests() view returns ((uint256 id, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest, (bytes32 taskId, (uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, bool exists, string name, bytes32[] taskKeys) task)[] tasks, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards)[] quests)");
        addFunctionSelector("QuestsDTO", "function getQuest(uint256 questId) view returns ((uint256 id, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest, (bytes32 taskId, (uint256 questId, uint256 taskType, bytes32 key, uint256 quantity, bool exists, string name, bytes32[] taskKeys) task)[] tasks, (uint256 id, (uint256 itemId, uint256 rewardType, uint256 quantity) reward)[] rewards) questDTO)");
        addFunctionSelector("QuestsDTO", "function updateQuest(uint256 questId, (uint256 duration, bool exists, uint256[] rewardIds, string questName, bytes32[] tasks) quest)");
        addFunctionSelector("QuestsDTO", "function upsertQuestCollections((uint256 questGroupType, uint256[] questIds)[] questCollections)");
        addFunctionSelector("QuestsDTO", "function upsertRewardColletions((uint256 rewardType, uint256[] rewardIds)[] rewardCollections)");
        addFunctionSelector("QuestsDTO", "function upsertTransformationCategories((uint256 base, uint256 input, uint256[] categories)[] transformationCategories)");

        addFunctionSelector("Quests", "function createDailyQuestIfNotExists()");
        addFunctionSelector("Quests", "function createWeeklyQuestIfNotExists()");
        addFunctionSelector("Quests", "function getAllActiveQuestGroupIds() view returns (uint256[] questGroupIds)");

        addFunctionSelector("Transformations", "function getTransformation(uint256 base, uint256 input) view returns ((uint256 next, uint256 yield, uint256 inputNext, uint256 yieldQuantity, uint256 unlockTime, uint256 timeout, uint256 timeoutYield, uint256 timeoutYieldQuantity, uint256 timeoutNext, bool isRecipe, bool isWaterCollection, uint256 xp, bool exists) transformation)");
        addFunctionSelector("Transformations", "function setTransformation((uint256 base, uint256 input, uint256 next, uint256 yield, uint256 inputNext, uint256 yieldQuantity, uint256 unlockTime, uint256 timeout, uint256 timeoutYield, uint256 timeoutYieldQuantity, uint256 timeoutNext, bool isRecipe, bool isWaterCollection, uint256 xp, bool exists) newTransformation)");
        addFunctionSelector("Transformations", "function setTransformations((uint256 base, uint256 input, uint256 next, uint256 yield, uint256 inputNext, uint256 yieldQuantity, uint256 unlockTime, uint256 timeout, uint256 timeoutYield, uint256 timeoutYieldQuantity, uint256 timeoutNext, bool isRecipe, bool isWaterCollection, uint256 xp, bool exists)[] newTransformations)");

        addFunctionSelector("WaterController", "function axiomV2Callback(uint64 sourceChainId, address caller, bytes32 querySchema, uint256 queryId, bytes32[] axiomResults, bytes extraData)");
        addFunctionSelector("WaterController", "function axiomV2OffchainCallback(uint64 sourceChainId, address caller, bytes32 querySchema, uint256 queryId, bytes32[] axiomResults, bytes extraData)");
        addFunctionSelector("WaterController", "function axiomV2QueryAddress() view returns (address)");
        addFunctionSelector("WaterController", "function getWaterYieldTime() view returns (uint256)");
        addFunctionSelector("WaterController", "function InitialiseWaterController(address _axiomV2QueryAddress, uint64 _callbackSourceChainId, bytes32 _querySchema)");
        addFunctionSelector("WaterController", "function setAxionV2QueryAddress(address _axiomV2QueryAddress)");
        addFunctionSelector("WaterController", "function setWaterControllerParameters(uint256 numSamples, uint256 blockInterval, uint256 minYieldTime, uint256 maxYieldTime, uint256 endBlockSlippage, int256 minDelta, int256 maxDelta)");
    }
}
```

  
