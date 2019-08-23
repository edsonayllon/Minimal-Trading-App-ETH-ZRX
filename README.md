# Radar-Relay-ZRX-Minimal-Trading-App

## Description

Initially started for sourcing Radar Relay liquidity to Fulcrum. Currently [Fulcrum](https://fulcrum.trade/) sources liquidity form KyberSwap. The objective is to write a typescript client for sourcing 0x order objects using the 0x APIs from Radar Relay: https://developers.radarrelay.com/.

## Structure

1. A user submits an order request.

2. Based on the size of the request, one or multiple orders are made. This example takes ETH, wraps it to WETH, and trades it for ZRX on Radar Relay.

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

Example transaction from this app: https://etherscan.io/tx/0xd10ee916f471881af094b706cd0af0a27526b1a5c14f4d321f42362d1d628596

All code is in `./client/src/App.tsx`.

## Running Frontend Client

This app requires metamask. It works on the mainnet for now. 

Install dependencies:

```
cd client
yarn || npm install
```

Run Client
```
yarn start || npm run start
```

Client should ask for Metamask authorization upon an 0x amount is submitted. Client sends amount to Radar Relay, trading available liquidity in multiple orders if required.

Current Radar Relay market communicating with client set to WETH, 0x pairing.

## Contact the Developer

Follow Edson on [Medium](https://medium.com/@edsonayllon), [Twitter](https://twitter.com/relativeread), and [Twitch](twitch.tv/edson6).

Business Enquiries are best done through [LinkedIn](https://www.linkedin.com/in/edson-ayllon/): [@edson-ayllon](https://www.linkedin.com/in/edson-ayllon/).

