const Liquidator = artifacts.require('Liquidator');

module.exports = function(deployer, network) {
  deployer.then(async () => {
    let lendingPoolAddress;
    let uniswapFactoryAddress;
    if (network === 'mainnet') {
      lendingPoolAddress = '0x24a42fD28C976A61Df5D00D0599C34c4f90748c8';
      uniswapFactoryAddress = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95';
    } else if (network === 'kovan') {
      uniswapFactoryAddress = '0xd3e51ef092b2845f10401a0159b2b96e8b6c3d30';
      lendingPoolAddress = '0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5';
    }
    await deployer.deploy(
      Liquidator,
      lendingPoolAddress,
      uniswapFactoryAddress
    );
  });
};
