import React, { useEffect, useState, MouseEvent } from 'react';
import './App.css';
import {
    orderHashUtils,
    signatureUtils,
    Web3ProviderEngine
} from '0x.js';

// Data used from api()
/*
exchange address
from https://developers.radarrelay.com/api/feed-api/tokens
token = {
  active: 1
  address: "0xe41d2489571d322189246dafa5ebde1f4699f498"
  createdDate: "2018-01-26 01:18:19"
  decimals: 18
  name: "0x Protocol Token"
  quote: 0
  symbol: "ZRX"
  zeroex_official: 1
}
*/

/*
fee recipients
https://api.radarrelay.com/v2/markets/ZRX-WETH/fills
{
  baseTokenAddress: "0xe41d2489571d322189246dafa5ebde1f4699f498"
  blockNumber: 8320353
  feeRecipientAddress: "0xa258b39954cef5cb142fd567a46cddb31a670124"
  filledBaseTokenAmount: "500"
  filledQuoteTokenAmount: "0.457"
  makerAddress: "0x395d48020ef5e29168706e16258db6c6c4d7d317"
  makerFeePaid: "0"
  orderHash: "0x14da0f76eecf0f97c3d7e422ba948bb3fc5db9c0b91a8b1af0573f63ea79e0f0"
  outlier: false
  quoteTokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
  takerAddress: "0x85c5c26dc2af5546341fc1988b9d178148b4838b"
  takerFeePaid: "0"
  timestamp: 1565406696
  transactionHash: "0xb2165429622103311d868c8d8f3936d833825799e80faaeaa7e6a6f9dd9f087e"
  type: "BUY"
}
*/

// read window.ethereum in Typescript & start web3 instance
declare let window: any;

// varaibles used in pushOrder()
const ZRXmarket: string = "0xe41d2489571d322189246dafa5ebde1f4699f498";
const feeAddress: string = "0xa258b39954cef5cb142fd567a46cddb31a670124".toLowerCase();
const pe = new Web3ProviderEngine();
const fulcrumAddress: string = "0xf6FEcD318228f018Ac5d50E2b7E05c60267Bd4Cd".toLowerCase(); // replace with Fulcrum address

interface Item {
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

  // used to fetch required information used in Order
  async function api(): Promise<void> {
    try {
      let res = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res.json()
      let sell = json.filter( function(item: Item){return (item.type==="SELL");} );
      console.log(json);
      console.log(sell)
    } catch (err) {
      console.log(err);
    }
  }

  // for typescript syntax for handling events
  function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    return requestOrders();
  }

  // POSTs individual orders
  async function pushOrder(quantity: number, maker: string, taker: string): Promise<void> {
    try {
      // ready order, unsigned. Set type to any to bypass bug where getOrderHashHex() wants a full signedOrder object
      let order: any = {
          exchangeAddress: ZRXmarket,
          expirationTimeSeconds: Math.trunc((Date.now() + 1000*60*60*24*7)/1000), // timestamp for expiration in seconds, here set to 1 week
          senderAddress: maker, // addresses must be sent in lowercase
          makerFee: 0,
          makerAddress: maker,
          makerAssetAmount: quantity*10e18, // All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling '1000000000000000000' units by this API).
          takerFee: 0,
          takerAddress: taker,
          takerAssetAmount: quantity*10e18,
          salt: Date.now(),
          feeRecipientAddress: feeAddress, // fee address is address of relayer
          makerAssetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
          takerAssetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
      };

      // use orderHashUtils to ready for a signature, where the order object becomes complete with the signature
      const orderHashHex = orderHashUtils.getOrderHashHex(order);

      // signature is required to confirm the sender owns the private key to the maker public address
      // API throws error if incorrect signature is provided
      const signature = await signatureUtils.ecSignHashAsync(pe, orderHashHex, maker);

      // append signature to order object
      const signedOrder = { ...order, signature };

      // Submit order
      let res = await fetch(`https://api.radarrelay.com/v2/orders`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(signedOrder), // body data type must match "Content-Type" header
      });
      console.log(await res.json)
    } catch (err) {
      console.log(err)
    }
  }

  // parent Order action
  async function requestOrders(): Promise<void> {
    try {
      // enable metamask
      const accounts = await window.ethereum.enable()

      // GET's liquidity (but and sell orders)
      let res1 = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res1.json()

      // sort only available sell orders to buy
      let liquidity = json.filter( function(item: Item){return (item.type==="SELL");} );
      console.log(liquidity);

      // set initial remaining value as user input order amount, and initiate current sell order index
      let remaining = amount;
      let cycle = 0

      while (remaining > 0) {
        // get sell amount for cheapest order
        let available = liquidity[cycle].filledBaseTokenAmount;


        if (available === null) {
          // if we run out of liquidity, make Fulcrum the taker
          pushOrder(remaining, accounts[0], fulcrumAddress);
        }

        if (available < remaining) {
          // if amount is greater than current existing sell order
          setTimeout(()=>{}, 501); // each browser can only send 2 requests per second in Radar Relay API
          pushOrder(available, accounts[0], liquidity[cycle].makerAddress)

          // decrease remaining balance by current sell order amount
          remaining = remaining - available;
        } else {
          // if buy order will be filled with this current sell order
          pushOrder(remaining, accounts[0], liquidity[cycle].makerAddress);

          // set remaining balance to 0 to exit loop
          remaining = 0;
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

