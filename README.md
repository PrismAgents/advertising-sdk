## Importing and Initializing PrismClient

 Prism Engine finds high-value users for your campaign using on-chain data. Compete in a real-time auction and display your ads to relevant users

## Auth

- Api Key: Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get an API KEY & get whitelisted as publisher.
- Address whitelisted: Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get whitelisted as publisher.

## Publisher sdk demo
- [Publisher website](https://tint.prismprotocol.xyz/client)
- Implementation [example](https://github.com/PrismAgents/advertising-sdk-publisher-demo/blob/main/src/pages/api/route.ts) with NextJS

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
- Class functions
```typescript
// Initialize the PrismClient 
- constructor(apiKey: string);

    // To be called when publisher wants to trigger an auction to display an ad
    triggerAuction(publisher: string, wallet: string, websiteUrl: string);

    // To be called when the user clicks on the ad (img onClick())
    handleUserClick(publisher: string, websiteUrl: string, winnerId: any);

    // To be called when the user views the ad (img onLoad())
    sendViewedFeedback(publisher: string, websiteUrl: string, winnerId: any);
```
#### Auction

1. Initialize the `PrismClient` with your publisher address;
- Ensure Publisher is whitelisted  in the Prism contract before initializing the `PrismClient`
   ```typescript
    const prismClient = new PrismClient(API_KEY);
    const result = await prismClient.triggerAuction(WALLET_ADDRESS, PUBLISHER_WL_ADDRESS, DOMAIN_URL);
   ```

2. **Important:** The methods on the `PrismClient` must be called to submit feedback, reviews, and clicks. This is crucial for tracking the analytics of your publishing websites and the displayed ads on the Prism Protocol publishers' space. Additionally, it allows you to claim the profit as a publisher.

Make sure to handle the responses from these methods appropriately to ensure accurate tracking and feedback submission.

- [Publisher's Dashboard](https://tint.prismprotocol.xyz/dashboard/publisher)

![Dashboard](./src/img/my-domains.png)



## Prism Publisher API

#### API Key
  - ⚠️ Ensure to add the header: 'x-api-key': <your-api-key>, in all requests ⚠️
  - [SDK Swagger Documentation](https://tint.prismprotocol.xyz/service/api/sdk)

  ![Swagger](./src/img/sdk-docs.png)
  