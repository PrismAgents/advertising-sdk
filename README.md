## Importing and Initializing PrismClient

Before you can use the `PrismClient`, ensure that the publisher address and publisher website URL are whitelisted by the Prism Protocol team. This is essential to utilize the SDK for publishing ads and generating revenue.

# Beta version 
   - advertising-sdk is in beta version and smart contracts are deployed on arbitrum sepolia network.
   
# Two options to integrate with Prism Protocol
- By using the PrismClient SDK
- By using the Prism Publisher API

## Prism Publisher API

### Configuration
   - config.json contains the prism-contract address and the provider url

#### Trigger auction:
- Requisits: Publisher wallet address must be whitelisted by the Prism Protocol team.
- POST call to Trigger auction: debits the campaign budget, credits the publisher wallet with 2% of the auction winning bid.
- Returns: advertising image and landing page url

   ```typescript
      https://prismprotocol.xyz/api/auction/<userWallet>/<publisherWallet>
   ```
#### Manage publisher stats:
- Requisits: Publisher website url must be given to the Prism team.
- POST calls for number for clicks, impressions, and revenue on prism publisher website
- Returns: success or error
   ```typescript
      https://prismprotocol.xyz/api/publisher/impressions/<publisherWallet>/<websiteUrl>/<auctionWinnerId>
   ```
   ```typescript
   https://prismprotocol.xyz/api/publisher/click/<publisherWallet>/<websiteUrl>/<auctionWinnerId>
   ```

#### Get all publisher stats by website url:
- Requisits: Publisher website url must be given to the Prism team.
- Returns: publisher stats
   ```typescript
      https://prismprotocol.xyz/api/publisher/<publisherWallet>/<websiteUrl>
   ```
## PrismClient SDK

As the client library us not yet on npm we suggest to get the Class from this repo:
To import and initialize the `PrismClient`, follow these steps:

1. Import the `PrismClient` in your component:
   ```typescript
   import { PrismClient } from '../../../src/PrismClient';
   ```

2. Initialize the `PrismClient` with your publisher address and website URL:
   ```typescript
   const prismClient = new PrismClient(publisherReceiverAddress, examplePublishingWebsite);
   ```

3. **Important:** The methods on the `PrismClient` must be called to submit feedback, reviews, and clicks. This is crucial for tracking the analytics of your publishing websites and the displayed ads on the Prism Protocol publishers' space. Additionally, it allows you to claim the profit as a publisher.

Make sure to handle the responses from these methods appropriately to ensure accurate tracking and feedback submission.

