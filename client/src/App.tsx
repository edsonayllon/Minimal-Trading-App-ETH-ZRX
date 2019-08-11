import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

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

const App: React.FC = () => {
  async function api(): Promise<void> {
    try {
      let res = await fetch(`https://api.radarrelay.com/v2/markets/ZRX-WETH/fills`);
      let json = await res.json()
      console.log(json);
    } catch (err) {
      console.log(err);
    }

  }

  useEffect(()=>{
    api()
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
