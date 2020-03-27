pragma solidity 0.5.10;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./aave/FlashLoanReceiverBase.sol";
import "./aave/ILendingPoolAddressesProvider.sol";
import "./opyn/OptionsContract.sol";
import "./opyn/OptionsExchange.sol";

import "./uniswap/IUniswapFactory.sol";
import "./uniswap/IUniswapExchange.sol";


contract ERC20Liquidator is FlashLoanReceiverBase {
    using SafeMath for uint256;
    IUniswapFactory public factory;

    constructor(
        ILendingPoolAddressesProvider _provider,
        IUniswapFactory _factory
    ) public FlashLoanReceiverBase(_provider) {
        factory = _factory;
    }

    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    ) external {
        // 1. Parse params
        (address oTokenAddr, address vaultAddr) = getParams(_params);
        address payable vaultOwner = address(uint160(vaultAddr));
        OptionsContract oToken = OptionsContract(oTokenAddr);

        // 2. Buy oTokens on uniswap
        uint256 oTokensToBuy = oToken.maxOTokensLiquidatable(vaultOwner);
        require(oTokensToBuy > 0, "cannot liquidate a safe vault");

        OptionsExchange exchange = OptionsExchange(oToken.optionsExchange());

        IERC20(_reserve).approve(address(exchange), _amount);
        exchange.buyOTokens(
            address(uint160(address(this))),
            oTokenAddr,
            _reserve,
            oTokensToBuy
        );
        // 3. Liquidate
        oToken.liquidate(vaultOwner, oTokensToBuy);

        // 4. Use eth to buy back _reserve
        IUniswapExchange uniswap = IUniswapExchange(
            factory.getExchange(_reserve)
        );
        uint256 buyAmount = uniswap.getEthToTokenInputPrice(
            address(this).balance
        );
        uniswap.ethToTokenSwapInput.value(address(this).balance)(
            buyAmount,
            now + 10 minutes
        );

        // // 5. pay back the $
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));

        // // 6. pay the user who liquidated
        uint256 balance = IERC20(_reserve).balanceOf(address(this));
        IERC20(_reserve).transfer(tx.origin, balance);
    }

    function bytesToAddress(bytes memory bys)
        private
        pure
        returns (address addr)
    {
        //solium-disable-next-line
        assembly {
            addr := mload(add(bys, 20))
        }
    }

    function getParams(bytes memory source)
        public
        pure
        returns (address, address)
    {
        bytes memory half1 = new bytes(20);
        bytes memory half2 = new bytes(20);
        for (uint256 j = 0; j < 20; j++) {
            half1[j] = source[j];
            half2[j] = source[j + 20];
        }
        return (bytesToAddress(half1), bytesToAddress(half2));
    }
}
