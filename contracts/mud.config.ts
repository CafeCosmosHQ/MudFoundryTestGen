import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespaces: {
    app: {
      tables: {
        Counter: {
          schema: {
            value: "uint32",
          },
          key: [],
        },
      },
    },
    chickenMan: {
      tables: {
        CounterChickenMan: {
          schema: {
            value: "uint32",
          },
          key: [],
        },
      },
    },
  },
});
