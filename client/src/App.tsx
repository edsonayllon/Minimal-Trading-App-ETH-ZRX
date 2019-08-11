import React, { useEffect, useState, MouseEvent } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';

/*
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
const fulcrumAddress: string = "0x129D6b5Eba82F2ca348B3F8B218F9F20Add14Ad5";
const erc20Abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]

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
      console.log(json);
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
      const accounts = await window.ethereum.enable()
      setAccount(accounts[0]);

      if (accounts[0]) {
        setWeb3enabled(true)
      }
    } catch (err) {
      console.log(err);
    }
  }

  function handleSubmit() {

  }

  async function getAssetAmount() {
    const address = '0xe41d2489571d322189246dafa5ebde1f4699f498'; // ZRX
    const contract = new web3.eth.Contract(erc20Abi, address);
    const accounts = await window.ethereum.enable();
    const maker = await contract.methods.balanceOf(accounts[0]).call();
    setMakerBalance(maker);
    const taker = await contract.methods.balanceOf(fulcrumAddress).call();
    setTakerBalance(taker);
  }

  async function order(): Promise<void> {
    getAssetAmount()
    try {
      let order = {
          exchangeAddress: ZRXmarket,
          expirationTimeSeconds: 1527115521,
          senderAddress: account,
          makerFee: 0,
          makerAddress: fulcrumAddress,
          makerAssetAmount: "20000000000000000",
          takerFee: 0,
          takerAddress: account,
          takerAssetAmount: amount,
          salt: Date.now(),
          feeRecipientAddress: fulcrumAddress,
          signature: "0x396a20a0589a7b9189f0d90ad377d7fd32d25d380402dc85954c227391fcc1c1"
      };
      let res = await fetch(`https://api.radarrelay.com/v2/orders`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(order), // body data type must match "Content-Type" header
      })
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
        <button onClick={handleEnableWeb3}>Trade</button>
        {web3enabled && (
          <form onSubmit={handleSubmit}>
            <label>
              0x amount:
              <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
            </label>
            <input type="submit" value="Buy" />
          </form>
        )}
      </header>
    </div>
  );
}

export default App;
