// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { getKeysWithValue } from "@latticexyz/world-modules/src/modules/keyswithvalue/getKeysWithValue.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Counter } from "../src/namespaces/app/codegen/index.sol";
import { BaseTest } from "./util/BaseTest.t.sol";

contract CounterTest is BaseTest {
  function testWorldExists() public {
    uint256 codeSize;
    address addr = worldAddress;
    assembly {
      codeSize := extcodesize(addr)
    }
    assertTrue(codeSize > 0);
  }

  function testCounter() public {
    // Expect the counter to be 1 because it was incremented in the PostDeploy script.
    uint32 counter = Counter.get();
    assertEq(counter, 0);

    // Expect the counter to be 2 after calling increment.
    IWorld(worldAddress).app__increment(1);
    counter = Counter.get();
    assertEq(counter, 1);
  }

  function testIncrementMore() public {
    // Expect the counter to be 1 because it was incremented in the PostDeploy script.
    uint32 counter = Counter.get();
    assertEq(counter, 0);

    // Expect the counter to be 2 after calling increment.
    IWorld(worldAddress).app__incrementMore(1, 2);
    counter = Counter.get();
    assertEq(counter, 3);
  }
}
