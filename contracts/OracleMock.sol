pragma solidity ^0.5.0;


interface Oracle {
    function getPrice(address _token) external pure returns (uint256);

    function updatePrice(address _token, uint256 _newPrice) external;
}
