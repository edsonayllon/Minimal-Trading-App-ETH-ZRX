# Contract-Fillable-0x-Liquidity-For-Fulcrum

## Description

Currently [Fulcrum](https://fulcrum.trade/) sources liquidity form KyberSwap. The objective is to write a typescript client for sourcing 0x order objects using the 0x APIs from Radar Relay: https://developers.radarrelay.com/.

## Structure

1. A user submits an open order.

2. Based on the size of the trade, liquidity is sourced from RadarRelay and submitted along with the trade in the form of an array of one or more 0x orders.

Structure of each order:

```
struct Order0x {
  address makerAddress;           // Address that created the order.
  address takerAddress;           // Address that is allowed to fill the order. If set to 0, any address is allowed to fill the order.
  address feeRecipientAddress;    // Address that will recieve fees when order is filled.
  address senderAddress;          // Address that is allowed to call Exchange contract methods that affect this order. If set to 0, any address is allowed to call these methods.
  uint256 makerAssetAmount;       // Amount of makerAsset being offered by maker. Must be greater than 0.
  uint256 takerAssetAmount;       // Amount of takerAsset being bid on by maker. Must be greater than 0.
  uint256 makerFee;               // Amount of ZRX paid to feeRecipient by maker when order is filled. If set to 0, no transfer of ZRX from maker to feeRecipient will be attempted.
  uint256 takerFee;               // Amount of ZRX paid to feeRecipient by taker when order is filled. If set to 0, no transfer of ZRX from taker to feeRecipient will be attempted.
  uint256 expirationTimeSeconds;  // Timestamp in seconds at which order expires.
  uint256 salt;                   // Arbitrary number to facilitate uniqueness of the order's hash.
  bytes makerAssetData;           // Encoded data that can be decoded by a specified proxy contract when transferring makerAsset. The last byte references the id of this proxy.
  bytes takerAssetData;           // Encoded data that can be decoded by a specified proxy contract when transferring takerAsset. The last byte references the id of this proxy.
  bytes signature;                // Signature for the order
}
```

3. After being passed with the trade, Fulcrum acts as "taker" for each 0x order presented until the full amount of the margin trade has been filled.

Reference: https://github.com/bZxNetwork/bZx-monorepo/blob/development/packages/contracts/contracts/zeroex/BZxTo0xV2.sol

All code is in `./client/src/App.tsx`.

## Running Frontend Client

This app requires metamask. A test network can be used (optional).

1. Set Metamask network to a testnetwork (here Kovan will be used)
2. Acquire testnet tokens (One Kovan faucet found at https://faucet.kovan.network/)
3. Wrapped ETH (WETH) generated at https://0x.org/portal/account


Install dependencies:

```
cd client
yarn || npm install
```

Run Client
```
yarn start || npm run yarn
```

Client should ask for Metamask authorization upon an 0x amount is submitted. Client sends amount to Radar Relay, trading available liquidity in multiple orders if required.

Current Radar Relay market communicating with client set to WETH, 0x pairing.

## Contact the Developer

Follow Edson on [Medium](https://medium.com/@edsonayllon), [Twitter](https://twitter.com/relativeread), and [Twitch](twitch.tv/edson6).

Business Enquiries are best done through [LinkedIn](https://www.linkedin.com/in/edson-ayllon/): [@edson-ayllon](https://www.linkedin.com/in/edson-ayllon/).

