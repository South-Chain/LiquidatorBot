pragma solidity 0.5.10;

import "@kollateral/contracts/invoke/KollateralInvokable.sol";
import "./opyn/OptionsContract.sol";
import "./opyn/OptionsExchange.sol";
import "./uniswap/IUniswapExchange.sol";
import "./uniswap/IUniswapFactory.sol";


contract KollateralLiquidator is KollateralInvokable {
    IUniswapFactory public factory;

    constructor(IUniswapFactory _factory) public {
        factory = _factory;
    }

    function execute(bytes calldata data) external payable {
        // 1. parse data
        (address vaultAddr, address oTokenAddr) = abi.decode(
            data,
            (address, address)
        );

        address payable vaultOwner = address(uint160(vaultAddr));
        OptionsContract oToken = OptionsContract(oTokenAddr);

        // 2. Buy oTokens on uniswap
        uint256 oTokensToBuy = oToken.maxOTokensLiquidatable(vaultOwner);
        require(oTokensToBuy > 0, "cannot liquidate a safe vault");

        OptionsExchange exchange = OptionsExchange(oToken.optionsExchange());

        address opynExchangePaymentToken = currentTokenAddress();

        if (!isCurrentTokenEther()) {
            IERC20(opynExchangePaymentToken).approve(
                address(exchange),
                currentTokenAmount()
            );
        } else {
            opynExchangePaymentToken = address(0);
        }

        exchange.buyOTokens(
            address(uint160(address(this))),
            oTokenAddr,
            opynExchangePaymentToken,
            oTokensToBuy
        );
        // 3. Liquidate
        oToken.liquidate(vaultOwner, oTokensToBuy);

        // 4. Use eth to buy back borrowed token
        if (!isCurrentTokenEther()) {
            IUniswapExchange uniswap = IUniswapExchange(
                factory.getExchange(currentTokenAddress())
            );
            uint256 buyAmount = uniswap.getEthToTokenInputPrice(
                address(this).balance
            );
            uniswap.ethToTokenSwapInput.value(address(this).balance)(
                buyAmount,
                now + 10 minutes
            );
        }

        // 5. pay back the $
        repay();

        // 6. pay the user who liquidated
        transfer(
            currentTokenAddress(),
            currentSender(),
            balanceOf(currentTokenAddress())
        );
    }
}
