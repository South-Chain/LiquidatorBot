const KollateralLiquidator = artifacts.require('KollateralLiquidator');

module.exports = function(deployer, network) {
  deployer.then(async () => {
    let uniswapFactoryAddress;
    if (network === 'mainnet' || network === 'mainnet-fork') {
      uniswapFactoryAddress = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95';
    } else if (network === 'kovan') {
      uniswapFactoryAddress = '0xd3e51ef092b2845f10401a0159b2b96e8b6c3d30';
    }
    await deployer.deploy(KollateralLiquidator, uniswapFactoryAddress);
  });
};
