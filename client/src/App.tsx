import React, { useEffect, useState, MouseEvent } from 'react';
import './App.css';
import {
    orderHashUtils,
    signatureUtils,
    Web3ProviderEngine,
    assetDataUtils,
    ContractWrappers,
    Order,
    BigNumber,
    RPCSubprovider,
} from '0x.js';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SignerSubprovider, MetamaskSubprovider } from '@0x/subproviders';
const Web3 = require('web3');
BigNumber.set({ DECIMAL_PLACES: 14 })

declare let window: any;
const web3 = new Web3(Web3.givenProvider)
const signer = (web3.currentProvider as any).isMetaMask
                ? new MetamaskSubprovider(web3.currentProvider)
                : new SignerSubprovider(web3.currentProvider);

// Provider documentation found at https://0x.org/wiki#Web3-Provider-Examples
const providerEngine = new Web3ProviderEngine(); // if none provided, should look for injected provider via browser
providerEngine.addProvider(signer); //replace with Fulcrum's user chosen provider at a later point

// https://mainnet.infura.io/XyzEcUCJOQunP1PHWBJF
providerEngine.addProvider(new RPCSubprovider('https://mainnet.infura.io/XyzEcUCJOQunP1PHWBJF'));
providerEngine.start();

const NETWORK_ID = 1 // mainnet network

const contractAddresses = getContractAddressesForNetworkOrThrow(NETWORK_ID);

const contractWrappers = new ContractWrappers(providerEngine, { networkId: NETWORK_ID, gasPrice: new BigNumber(20000000000) });

const web3Wrapper = new Web3Wrapper(providerEngine);

// addresses used in orders must be lowercase
const fulcrumAddress: string = "0xf6FEcD318228f018Ac5d50E2b7E05c60267Bd4Cd".toLowerCase(); // replace with Fulcrum address

interface ZRXOrderItem {
  baseTokenAddress: string
  blockNumber: number
  feeRecipientAddress: string
  filledBaseTokenAmount: string
  filledQuoteTokenAmount: string
  makerAddress: string
  makerFeePaid: string
  orderHash: string
  outlier: boolean
  quoteTokenAddress: string
  takerAddress: string
  takerFeePaid: string
  timestamp: number
  transactionHash: string
  type: string
}

const App: React.FC = () => {
  // hook to read user input 0x amount wanted
  const [amount, setAmount] = useState(0);
  const [asset, setAsset] = useState('ZRX');
  const [collateral, setCollateral] = useState('ETH');

  // used to fetch required information used in Order
  async function api(): Promise<void> {
    try {
      let res = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res.json()
      let sell = json.filter( function(item: ZRXOrderItem){return (item.type==="SELL");} );
      console.log(json);
      console.log(sell)
    } catch (err) {
      console.log(err);
    }
  }

  // for typescript syntax for handling events
  function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    return radarZrxSubmit();
  }

  // POSTs individual orders
  const pushRadarRelayOrder = async (
    makerSellingQuanity: number | string,
    makerBuyingQuantity: number | string,
    maker: string,
    taker: string,
    feeAddr: string,
    type: string
  ): Promise<void> => {
    try {
      // format buying and selling amounts
      // All token amounts are sent in amounts of the smallest level of precision (base units).
      // (e.g if a token has 18 decimal places, selling 1 token would show up as selling '1000000000000000000' units by this API).

      let ZERO = new BigNumber(0);
      let DECIMALS = 18;
      let NULL_ADDRESS = '0x0000000000000000000000000000000000000000'.toLowerCase();
      let makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerSellingQuanity), DECIMALS); // amount of token we sell
      let takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(makerBuyingQuantity), DECIMALS); // amount of token we buy

      let wethTokenAddr = `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`;
      let zrxTokenAddr = `0xe41d2489571d322189246dafa5ebde1f4699f498`;

      var takerWETHDepositTxHash;
      let makerToken = type === "BUY" ? wethTokenAddr : zrxTokenAddr;
      let takerToken = type === "BUY" ? zrxTokenAddr : wethTokenAddr;
      let takerWETHDepositTxHash = type === "BUY" ? await contractWrappers.etherToken.depositAsync(
        wethTokenAddr,
        makerAssetAmount,
        maker,
      ) : null;

      // Allow the 0x ERC20 Proxy to move ZRX on behalf of makerAccount
      const makerApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
          makerToken,
          maker,
      );

      const makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken);
      const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken);

      // ready order, unsigned. Set type to any to bypass bug where getOrderHashHex() wants a full signedOrder object
      let order: Order = {
          exchangeAddress: contractAddresses.exchange,
          expirationTimeSeconds: new BigNumber(Math.trunc((Date.now() + 1000*60*60*24*7)/1000)), // timestamp for expiration in seconds, here set to 1 week
          senderAddress: NULL_ADDRESS, // addresses must be sent in lowercase
          makerFee: ZERO,
          makerAddress: maker,
          makerAssetAmount: makerAssetAmount,
          takerFee: ZERO,
          takerAddress: NULL_ADDRESS,
          takerAssetAmount: takerAssetAmount,
          salt: new BigNumber(Date.now()),
          feeRecipientAddress: feeAddr, // fee address is address of relayer
          makerAssetData: makerAssetData, // The token address the Maker is offering
          takerAssetData: takerAssetData, // The token address the Maker is requesting from the Taker.
      };

      // use orderHashUtils to ready for a signature, where the order object becomes complete with the signature
      const orderHashHex = orderHashUtils.getOrderHashHex(order);

      // signature is required to confirm the sender owns the private key to the maker public address
      // API throws error if incorrect signature is provided
      const signature = await signatureUtils.ecSignHashAsync(providerEngine, orderHashHex, maker);

      // append signature to order object
      const signedOrder = { ...order, signature };

      // Submit order
      let res = await fetch(`https://api.radarrelay.com/v2/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(signedOrder),
      });
      let json = await res.json
      console.log(json);
      console.log(await res.text())
    } catch (err) {
      console.log(err)
    }
  }

  const radarZrxSubmit = async (): Promise<void> => {
    try {
      // is user buying ZRX with ETH or selling ZRX for ETH?
      const zrxTradeType = asset === "ZRX" && collateral === "ETH" ? 'BUY' : 'SELL';
      // are the takers selling ZRX or Buying ZRX?
      const zrxTakerType = asset === "ZRX" && collateral === "ETH" ? 'SELL' : 'BUY';

      // get user's public key, assumes metamask for now
      const accounts = await window.ethereum.enable();
      let maker = accounts[0];

      // GET's liquidity (buy and sell orders)
      let res1 = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res1.json()

      console.log('All available orders: ' + json);

      // sort only available sell orders to buy
      const liquidity = json.filter( function(item: ZRXOrderItem){return (item.type === zrxTakerType);} );
      console.log('Liquidity for order type: ' + liquidity);

      // set initial remaining value as user input order amount, and initiate current sell order index
      // remaining is the amount the user typed for how much they are selling

      var remaining = new BigNumber(amount); // leave as big number;\
      var cycle = 0;

      // pushes orders until requested amount is filled, or liquidity run out
      // if liquidity runs out, fulcrum becomes the taker
      while (remaining.isGreaterThan(new BigNumber(0))) {
        // get sell amount for cheapest order
        // because we subtract from the amount in the token we are buying in, available must be priced in the token we buy
        // if we are buying 0x with ETH, available must be ETH price, vice versa
        var available = zrxTradeType === "BUY" ? new BigNumber(liquidity[cycle].filledQuoteTokenAmount) : new BigNumber(liquidity[cycle].filledBaseTokenAmount);
        // this will be the price of the token we are buying
        var takerTokenAvailable = zrxTradeType === "BUY" ? new BigNumber(liquidity[cycle].filledBaseTokenAmount) : new BigNumber(liquidity[cycle].filledQuoteTokenAmount);

        // if we run out of liquidity liquidity[cycle] should retun null
        if (available === null) {
          // if we run out of liquidity, make Fulcrum the taker

          // get previous prices before liquidity ran out
          takerTokenAvailable = zrxTradeType === "BUY" ? new BigNumber(liquidity[cycle-1].filledBaseTokenAmount) : new BigNumber(liquidity[cycle-1].filledQuoteTokenAmount);

          available = zrxTradeType === "BUY" ? new BigNumber(liquidity[cycle-1].filledQuoteTokenAmount) : new BigNumber(liquidity[cycle-1].filledBaseTokenAmount);

          // scale down request to remain with previous price
          let ratio = takerTokenAvailable.div(available);
          takerTokenAvailable = await remaining.multipliedBy(ratio);

          // request remaining fund from Fulcrum
          pushRadarRelayOrder(remaining.toString(), takerTokenAvailable.toString(), accounts[0], fulcrumAddress, liquidity[cycle-1].feeRecipientAddress, zrxTradeType);

          remaining = new BigNumber(0);

        } else if (available.isLessThan(remaining)) {
          // if amount is greater than current existing sell order, make one order, then go to the next

          pushRadarRelayOrder(available.toString(), takerTokenAvailable.toString(), accounts[0], liquidity[cycle].makerAddress, liquidity[cycle].feeRecipientAddress,  zrxTradeType)

          // each browser can only send 2 requests per second in Radar Relay API
          setTimeout(()=>{}, 501);

          // decrease remaining balance by current sell order amount
          remaining = remaining.minus(available);
        } else if (available.isGreaterThanOrEqualTo(remaining)) {
          // if buy order will be filled with this current sell order

          // scale down order to remaining amount

          let ratio = takerTokenAvailable.div(available);

          takerTokenAvailable = await remaining.multipliedBy(ratio);

          pushRadarRelayOrder(remaining.toString(), takerTokenAvailable.toString(), accounts[0], liquidity[cycle].makerAddress, liquidity[cycle].feeRecipientAddress, zrxTradeType);

          // set remaining balance to 0 to exit loop
          remaining = new BigNumber(0);
          console.log('done')
        }

        // move to next order
        cycle++;
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(()=>{
    // used for fetching data of exchange address and fee address, can be removed
    api()
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        0x amount:
        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
        <button onClick={handleSubmit}>Buy</button>
      </header>
    </div>
  );
}

export default App;

