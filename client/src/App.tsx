import React, { useEffect, useState, MouseEvent } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';

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

declare let window: any;
const web3 = new Web3(Web3.givenProvider);
const ZRXmarket: string = "0xe41d2489571d322189246dafa5ebde1f4699f498";
const feeAddress: string = "0xa258b39954cef5cb142fd567a46cddb31a670124".toLowerCase();

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
  const [amount, setAmount] = useState(0);
  const [account, setAccount] = useState('');
  const [web3enabled, setWeb3enabled] = useState(false);
  const [makerBalance, setMakerBalance] = useState(0);
  const [takerBalance, setTakerBalance] = useState(0);

  async function api(): Promise<void> {
    try {
      let res = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);

      let json = await res.json()
      let sell = json.filter( function(item: Item){return (item.type=="SELL");} );
      console.log(json);
      console.log(sell)
    } catch (err) {
      console.log(err);
    }
  }

  function handleEnableWeb3(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    return enableWeb3();
  }

  async function enableWeb3(): Promise<void> {
    try {

    } catch (err) {
      console.log(err);
    }
  }

  function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    return requestOrders();
  }

  function handleSignature(address: string): Promise<any> {
    return new Promise(function(resolve, reject) {
      try {
        //const signature = eth.personal_sign(fromAddress, hexEncodedUtf8Message)
        const signature = window.web3.personal.sign(
          `I approve this order`,
          address,
          function (err: any, result: any) {
            if (err) return console.error(err)
            console.log('PERSONAL SIGNED:' + result);
            resolve(result);
          }
        );
      } catch (err) {
        console.log(err);
        throw new Error('You need to sign the message to be able to log in.');
      }
    })
  }

  async function pushOrder(quantity: number, sender: string, filler: string, signature: string): Promise<void> {
    console.log(sender);
    console.log(filler);
    try {
      let order = {
          exchangeAddress: ZRXmarket,
          expirationTimeSeconds: Math.trunc((Date.now() + 1000*60*60*24*7)/1000), // timestamp for expiration in seconds, here set to 1 week
          senderAddress: sender, // addresses must be sent in lowercase
          makerFee: 0,
          makerAddress: sender,
          makerAssetAmount: quantity*10e18, // All token amounts are sent in amounts of the smallest level of precision (base units). (e.g if a token has 18 decimal places, selling 1 token would show up as selling '1000000000000000000' units by this API).
          takerFee: 0,
          takerAddress: filler,
          takerAssetAmount: quantity*10e18,
          salt: Date.now(),
          feeRecipientAddress: feeAddress, // fee address is address of relayer
          signature: signature,
          makerAssetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
          takerAssetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48'
      };

      let res = await fetch(`https://api.radarrelay.com/v2/orders`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(order), // body data type must match "Content-Type" header
      });
      console.log(await res.json)
    } catch (err) {
      console.log(err)
    }
  }



  async function requestOrders(): Promise<void> {
    try {
      // enable metamask
      const accounts = await window.ethereum.enable()
      setAccount(accounts[0]);
      console.log(account);
      // sign order
      let signature = await handleSignature(accounts[0]);

      let res1 = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res1.json()
      let liquidity = json.filter( function(item: Item){return (item.type=="SELL");} );
      console.log(liquidity);

      let remaining = amount;
      let cycle = 0

      while (remaining > 0) {
        let available = liquidity[cycle].filledBaseTokenAmount
        if (available < remaining) {
          pushOrder(available, accounts[0], liquidity[cycle].makerAddress, signature);
          remaining = remaining - available;
        } else {
          pushOrder(remaining, accounts[0], liquidity[cycle].makerAddress, signature);
          remaining = 0;
          console.log('done')
        }
        cycle++;
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(()=>{
    api()
  }, []);

  console.log(account);
  console.log(amount);

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
