import { MudTestFoundry } from "./MudTestFoundry.t.sol";


contract BaseTest is MudTestFoundry {

    function setUp() public virtual override {
        super.setUp();
    }

}