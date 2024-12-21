// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { CounterChickenMan } from "../codegen/index.sol";

contract IncrementMoreSystem is System {
  function incrementMore(uint32 amount1, uint32 amount2) public returns (uint32) {
    uint32 counter = CounterChickenMan.get();
    uint32 newValue = counter + amount1 + amount2;
    CounterChickenMan.set(newValue);
    return newValue;
  }
}
