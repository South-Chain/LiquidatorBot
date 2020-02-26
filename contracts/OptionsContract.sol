pragma solidity 0.5.10;


contract OptionsContract {
    function liquidate(address payable vaultOwner, uint256 oTokensToLiquidate)
        public;

    function optionsExchange() public returns (address);

    function maxOTokensLiquidatable(address payable vaultOwner)
        public
        view
        returns (uint256);

    function isUnsafe(address payable vaultOwner) public view returns (bool);

    function hasVault(address valtowner) public view returns (bool);

    function openVault() public returns (bool);

    function addETHCollateral(address payable vaultOwner)
        public
        payable
        returns (uint256);

    function maxOTokensIssuable(uint256 collateralAmt)
        public
        view
        returns (uint256);

    function getVault(address payable vaultOwner)
        public
        view
        returns (uint256, uint256, uint256, bool);

    function issueOTokens(uint256 oTokensToIssue, address receiver) public;

    function approve(address spender, uint256 amount) public returns (bool);
}
