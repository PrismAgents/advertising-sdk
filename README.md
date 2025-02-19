## Importing and Initializing PrismClient

Before you can use the `PrismClient`, ensure that the publisher address whitelisted by the Prism Protocol team. This is essential to utilize the SDK for publishing ads and generating revenue.

## Get an API Key
Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get an API KEY & get whitelisted as publisher.

# Two options to integrate with Prism Protocol
- By using the PrismClient SDK
- By using the Prism Publisher API

## Prism SDK

- Install the prism-sdk
```typescript
npm install prism-sdk
```
- Import the PrismClient
```typescript
import { PrismClient } from 'prism-sdk';
```
## Trigger an Auction

1. Initialize the `PrismClient` with your publisher address;
- Ensure Publisher is whitelisted  in the Prism contract before initializing the `PrismClient`
   ```typescript
    const prismClient = new PrismClient(API_KEY);
    const result = await prismClient.triggerAuction(WALLET_ADDRESS, PUBLISHER_WL_ADDRESS);
    assert.ok(result.id, "default-campaign");
   ```

2. **Important:** The methods on the `PrismClient` must be called to submit feedback, reviews, and clicks. This is crucial for tracking the analytics of your publishing websites and the displayed ads on the Prism Protocol publishers' space. Additionally, it allows you to claim the profit as a publisher.

Make sure to handle the responses from these methods appropriately to ensure accurate tracking and feedback submission.


## Prism Publisher API

#### API Key
  - header: 'x-api-key': <your-api-key>,

#### Trigger auction:
- Requisits: Publisher wallet address must be whitelisted by the Prism Protocol team.
- POST call to Trigger auction: debits the campaign budget, credits the publisher wallet with 2% of the auction winning bid.
- Returns: advertising image and landing page url

   ```typescript
      https://tint.prismprotocol.xyz/api/auction/<userWallet>/<publisherWallet>
   ```
#### Manage publisher stats:
- Requisits: Publisher website url must be given to the Prism team.
- POST calls for number for clicks, impressions, and revenue on prism publisher website
- Returns: success or error
   ```typescript
      https://tint.prismprotocol.xyz/api/publisher/impressions/<publisherWallet>/<websiteUrl>/<auctionWinnerId>
   ```
   ```typescript
   https://tint.prismprotocol.xyz/api/publisher/click/<publisherWallet>/<websiteUrl>/<auctionWinnerId>
   ```

#### Get all publisher stats by website url:
- Requisits: Publisher website url must be given to the Prism team.
- Returns: publisher stats
   ```typescript
      https://tint.prismprotocol.xyz/api/publisher/<publisherWallet>/<websiteUrl>
   ```
