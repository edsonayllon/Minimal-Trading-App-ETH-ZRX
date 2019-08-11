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

## Trading Concepts

Fulcrum is a platform that allows short and long selling.

### Short Selling

A short sell predicts a market will go down, instead of up.

1. Short sellers buy by borrowing assets and selling at market price
2. Once the price drops, the short seller buys the asset again, and returns it to the lender

For example, selling $10,000 of borrowed asset for $10/fungible item. If cost goes down to $7/fungible item, the short seller profits $3000.

### Long Selling

A trader buys shares hoping to sell at a higher price.

### Margin Trade

Margin is borrowed money used to purchase an asset.

Margin trading refers to using borrowed funds to trade a financial asset, which forms collateral for the loan from the lender.

The collateralized loan comes with a periodic interest rate that the investor must repay to the lender.

### Maker

Account creating an order.

### Taker

Account filling an order.