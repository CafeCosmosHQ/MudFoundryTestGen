// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Counter } from "../codegen/index.sol";

contract IncrementMoreSystem is System {
  function incrementMore(uint32 amount1, uint32 amount2) public returns (uint32) {
    uint32 counter = Counter.get();
    uint32 newValue = counter + amount1 + amount2;
    Counter.set(newValue);
    return newValue;
  }
}
