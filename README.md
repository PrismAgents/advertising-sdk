## Importing and Initializing PrismClient

Before you can use the `PrismClient`, ensure that the publisher address and publisher website URL are whitelisted by the Prism Protocol team. This is essential to utilize the SDK for publishing ads and generating revenue.

Prism Accounting contract on bartio network: 0x7a7183F68ab5ea7Fc51bfA7c6D1AE4DD789d0e7D
# Two options to integrate with Prism Protocol
- By using the PrismClient SDK
- By using the Prism Publisher API

## Prism Publisher API

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

# Example App

This is a [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh) + [Next.js](https://nextjs.org/) project bootstrapped with [`create-rainbowkit`](/packages/create-rainbowkit).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Running the Example App

To run the example app, follow these steps:

1. Ensure you have all dependencies installed by running:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3002](http://localhost:3002) in your browser to view the example app.

## Learn More

To learn more about this stack, take a look at the following resources:

- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Next.js Documentation](https://nextjs.org/docs) - Learn how to build a Next.js application.

You can check out [the RainbowKit GitHub repository](https://github.com/rainbow-me/rainbowkit) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
