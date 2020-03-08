import {
  LiquidatorInstance,
  LendingPoolInstance,
  OptionsContractInstance,
  OptionsExchangeInstance,
  OracleInstance
} from '../build/types/truffle-types';

import {BigNumber} from 'bignumber.js';
const Liquidator = artifacts.require('Liquidator');
const LendingPool = artifacts.require('LendingPool');
const OptionsContract = artifacts.require('OptionsContract');
const OptionsExchange = artifacts.require('OptionsExchange');
const OracleMock = artifacts.require('Oracle');

contract('Liquidator', accounts => {
  console.log(`Running test as ${accounts[0]}`);
  const vaultOwner = accounts[0]; //'0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C', 0xfe1A6F214CDc4BC4d511f81DB891362FC13eEd62
  const ETHReserveAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

  let liquidator: LiquidatorInstance;
  let lendingPool: LendingPoolInstance;
  let oToken: OptionsContractInstance;
  let optionsExchange: OptionsExchangeInstance;
  let oracle: OracleInstance;

  const isDeployed = true;
  const strikeAsset = '0xcD65af218058C3Ec5e41645202513a8d9aAa25e2'; // mock usdc
  const liquidatorAddress = '0x4444a08A9095cC07c3b2985BAe9B317a505f02dE';
  const lendingPoolAdress = '0x580D4Fdc4BF8f9b5ae2fb9225D584fED4AD5375c';
  const optionContractAddress = '0xcb8652fde60294aa90c10a55d0ace01ce84df757';
  const optionExchangeAddress = '0x5CD96a4c652E6A317B6e5f3b7a7394425A320817';
  const oracleAddress = '0x5face1cee8733672242b12bddac2c2f1f1c0237f';

  const priceBefore = '4367289005349929'; //  228 usd -> 1 eth
  const priceAfter = '8367289005349929'; // 119 usd -> 1 eth

  before('set up contracts', async () => {
    if (!isDeployed) {
      liquidator = await Liquidator.deployed();
      console.log(`Using liquidator deployed @ ${liquidator.address}`);
    } else {
      liquidator = await Liquidator.at(liquidatorAddress);
    }
    lendingPool = await LendingPool.at(lendingPoolAdress);
    oToken = await OptionsContract.at(optionContractAddress);
    optionsExchange = await OptionsExchange.at(optionExchangeAddress);
    oracle = await OracleMock.at(oracleAddress);
  });

  before('make vault liquidatable', async () => {
    const liquidatable = await oToken.maxOTokensLiquidatable(vaultOwner);
    if (liquidatable.toNumber() > 0) return;

    // Setup something to liquidate
    const hasVault = await oToken.hasVault(vaultOwner);

    if (!hasVault) {
      console.log(`Open Vault...`);
      // open vault and add calleteral
      await oToken.openVault();
      const colleteralInWei = '200000000000000000'; // 0.2 eth
      await oToken.addETHCollateral(vaultOwner, {
        value: colleteralInWei
      });
    }

    await oracle.updatePrice(strikeAsset, priceBefore);
    const vault = await oToken.getVault(vaultOwner);
    const collateral = vault[0];
    const issued = vault[1];
    const maxIssueable = await oToken.maxOTokensIssuable(collateral);
    const amountToIssue = new BigNumber(maxIssueable).minus(issued);
    if (amountToIssue.gt(0)) {
      console.log(`Issue more tokens to reach maximum`);
      await oToken.issueOTokens(amountToIssue, vaultOwner);
    }

    await oracle.updatePrice(strikeAsset, priceAfter);
  });

  describe('#liquidate()', async () => {
    it('test the bytes return values', async () => {
      const oTokenAddressBytes = web3.utils.hexToBytes(
        web3.utils.toHex(oToken.address)
      );
      const vaultAddressBytes = web3.utils.hexToBytes(
        web3.utils.toHex(vaultOwner)
      );
      const data = oTokenAddressBytes.concat(vaultAddressBytes);

      const params = await liquidator.getParams(data);
      expect(params[0].toString()).to.equal(oToken.address);
      expect(params[1].toString()).to.equal(vaultOwner);
    });

    it('get ETH in AAVE', async () => {
      const ethBalance = (
        await lendingPool.getReserveData(ETHReserveAddress)
      )[1];
      expect(ethBalance.gt(0)).to.equal(true);
    });

    it('test flash loan liquidate', async () => {
      const oTokenAddressBytes = web3.utils.hexToBytes(
        web3.utils.toHex(oToken.address)
      );
      const vaultAddressBytes = web3.utils.hexToBytes(
        web3.utils.toHex(vaultOwner)
      );
      const data = oTokenAddressBytes.concat(vaultAddressBytes);
      const amountOTokens = await oToken.maxOTokensLiquidatable(vaultOwner);
      console.log(`amountOTokens liquidatable ${amountOTokens}`);
      const premiumToPay = await optionsExchange.premiumToPay(
        oToken.address,
        '0x0000000000000000000000000000000000000000',
        amountOTokens
      );

      // Use liquidator to liquidate our own position
      await lendingPool.flashLoan(
        liquidator.address,
        ETHReserveAddress,
        premiumToPay,
        data
      );
    });
  });
});
