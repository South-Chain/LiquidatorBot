pragma solidity 0.5.10;


// Solidity Interface
contract IUniswapFactory {
    // Public Variables
    address public exchangeTemplate;
    uint256 public tokenCount;

    // Get Exchange and Token Info
    function getExchange(address token)
        external
        view
        returns (address exchange);
}
