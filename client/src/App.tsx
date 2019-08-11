import React, { useEffect, useState, MouseEvent } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';
import { SdkManager } from '@radarrelay/sdk';

/*
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

declare let window: any;
const web3 = new Web3(Web3.givenProvider);
const ZRXmarket: string = "0xe41d2489571d322189246dafa5ebde1f4699f498";
const fulcrumAddress: string = "0xf6FEcD318228f018Ac5d50E2b7E05c60267Bd4Cd";

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

  async function pushOrder(quantity: number, signature: string): Promise<void> {
    try {
      // create order
      let order = {
          exchangeAddress: ZRXmarket,
          expirationTimeSeconds: 1527115521,
          senderAddress: account,
          makerFee: 0,
          makerAddress: account,
          makerAssetAmount: quantity,
          takerFee: 0,
          takerAddress: fulcrumAddress,
          takerAssetAmount: quantity,
          salt: Date.now(),
          feeRecipientAddress: fulcrumAddress,
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
      })
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
          pushOrder(available, signature);
          remaining = remaining - available;
        } else {
          pushOrder(remaining, signature);
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
