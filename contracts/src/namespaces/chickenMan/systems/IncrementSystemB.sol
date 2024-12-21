// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { CounterChickenMan } from "../codegen/index.sol";

contract IncrementSystem is System {
  function increment(uint32 amount) public returns (uint32) {
    uint32 counter = CounterChickenMan.get();
    uint32 newValue = counter + amount;
    CounterChickenMan.set(newValue);
    return newValue;
  }
}
