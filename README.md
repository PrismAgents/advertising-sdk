# Prism SDK

TypeScript client for Prism protocol onchain advertising. Prism Engine finds high-value users for your campaign using on-chain data. Compete in a real-time auction and display your ads to relevant users.

## Installation

```bash
npm install prism-sdk
# or
yarn add prism-sdk
```

## Auth

- API Key: Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get an API KEY & get whitelisted as publisher.
- Address whitelisted: Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get whitelisted as publisher.

## Publisher SDK Demo

- [Publisher website](https://tint.prismprotocol.xyz/client)
- Implementation [example](https://github.com/PrismAgents/advertising-sdk-publisher-demo/blob/main/src/pages/api/route.ts) with NextJS

## Usage

### Import and Initialize

```typescript
import { PrismClient } from 'prism-sdk';

// Initialize the client with your API key
const client = new PrismClient('your-api-key');
```

### Get Auction Winner Campaign from Nitro Enclave TEE

```typescript
// Trigger an auction when publisher wants to display an ad
await client.auction(
  'publisher-address',     // Publisher's Ethereum address
  'publisher-domain.com',  // Publisher's domain
  'user-wallet-address'    // User's Ethereum address
);
```
- Auction Response
```typescript
{
    "status": "success",
    "data": {
        "campaignId": "0xcb67...4c4ad",
        "bannerIpfsUri": "https://ad-winner-banner.com/img.png",
        "url": "https://auction-winner-url.com",
        "campaignName": "TeddyBird"
    }
}
```


### - Register ads impressions

```typescript
await client.impressions(
  'publisher-address',     // Publisher's Ethereum address
  'website-url.com',       // Website URL where impression occurred
  'campaign-id'            // Auction winner ID that was viewed
);
```

### - Register ads clicks

```typescript
// Register clicks on ads
await client.clicks(
  'publisher-address',     // Publisher's Ethereum address
  'website-url.com',       // Website URL where click occurred
  'campaign-id'            // Auction winner ID that was clicked
);
```



**Important:** The methods on the `PrismClient` must be called to count:
- impressions
- clicks
 
 These are crucial for tracking and claiming publishers profit.

## Publisher Dashboard

Access your analytics and earnings at the [Publisher's Dashboard](https://tint.prismprotocol.xyz/dashboard/publisher)

![Dashboard](./src/img/my-domains.png)

## Development

```bash
# Install dependencies
npm install

# Run development build with watch mode
npm run dev

# Run tests
npm test

# Build for production
npm run start
```

## License

MIT