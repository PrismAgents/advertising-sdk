# Prism SDK


TypeScript client for [Prism protocol](https://www.prismprotocol.xyz/) onchain advertising. Prism Engine finds high-value users for your campaign using on-chain data. Compete in a real-time auction and display your ads to relevant users.

https://www.npmjs.com/package/prism-sdk

## Installation

```bash
npm install prism-sdk
# or
yarn add prism-sdk
```

## React Hook (Recommended)

For React applications, use the `usePrismSDK` hook for simplified state management:

```typescript
import { useEffect } from 'react';
import { usePrismSDK } from 'prism-sdk/react';

function AdBanner({ publisherAddress, publisherDomain, userWallet }: {
  publisherAddress: string;
  publisherDomain: string;
  userWallet?: string;
}) {
  const { isInitializing, winner, error, init, clicks, impressions } = usePrismSDK({
    publisherAddress,
    publisherDomain
  });

  useEffect(() => {
    // The hook prevents duplicate initialization calls automatically
    init({
      getWalletAddress: async () => userWallet,
      walletDetectionTimeout: 2000,
      onSuccess: (winner) => {
        console.log('Ad loaded:', winner.campaignName);
      },
      onError: (error) => {
        console.error('Failed to load ad:', error.message);
      }
    });
  }, [userWallet, init]);

  const handleAdClick = async () => {
    if (winner) {
      try {
        await clicks(winner.campaignId, winner.jwt_token);
        window.open(winner.url, '_blank');
      } catch (error) {
        console.error('Click tracking failed:', error);
        window.open(winner.url, '_blank');
      }
    }
  };

  const handleImageLoad = async () => {
    if (winner) {
      try {
        await impressions(winner.campaignId, winner.jwt_token);
        console.log('Impression tracked');
      } catch (error) {
        console.error('Impression tracking failed:', error);
      }
    }
  };

  if (isInitializing) return <div>Loading ad...</div>;
  if (error) return <div>Failed to load ad: {error.message}</div>;
  if (!winner) return <div>No ad available</div>;

  return (
    <div onClick={handleAdClick} style={{ cursor: 'pointer' }}>
      <img
        src={winner.bannerIpfsUri}
        alt={winner.campaignName}
        onLoad={handleImageLoad}
        onError={() => console.error('Failed to load ad image')}
      />
    </div>
  );
}
```

**Key Benefits of the Hook:**
- **Automatic State Management**: Tracks loading, success, and error states
- **Duplicate Prevention**: `isInitializing` prevents multiple concurrent init calls
- **Error Handling**: Centralized error state management
- **TypeScript Support**: Full type safety and IntelliSense

## Auth
- Address whitelisted: Please refer to the [Prism Protocol documentation](https://github.com/PrismAgents/documentation/wiki/TINT-Home) for more information on how to get whitelisted as publisher.

## Publisher SDK Demo

- [Publisher website](https://prism-ads-publisher-1.netlify.app/)
- Implementation [example](https://github.com/PrismAgents/advertising-sdk-publisher-demo/blob/main/src/pages/index.tsx) with NextJS

## Usage

### Import and Initialize

```typescript
import { PrismClient, PrismWinner } from 'prism-sdk';
```

### Quick Start - Auto Initialize on Page Load (Recommended)

The easiest way to get started is to use the auto-initialization feature that works whether users have connected their wallet or not:

```typescript
// Initialize immediately when your page loads
PrismClient.init(
  "0xYourPublisherAddress", 
  "yourdomain.com",
  {
    connectedWallet: userWalletAddress, // Optional - if user hasn't connected wallet, fallback is used
    onSuccess: (winner: PrismWinner) => {
      // Display the banner and register impression when image loads
      displayBanner(winner.bannerIpfsUri, winner.url, () => {
        // Register impression only after image successfully loads
        PrismClient.impressions(
          "0xYourPublisherAddress",
          "yourdomain.com", 
          winner.campaignId,
          winner.jwt_token
        );
      });
    },
    onError: (error) => {
      console.log('Failed to load ads:', error.message);
      // Optionally show fallback content
    }
  }
);
```

### React/Next.js Example

```typescript
import { useEffect, useState } from 'react';
import { PrismClient, PrismWinner } from 'prism-sdk';

function AdBanner({ userWallet }: { userWallet?: string }) {
  const [winner, setWinner] = useState<PrismWinner | null>(null);

  useEffect(() => {
    PrismClient.init(
      "0xYourPublisherAddress",
      "yourdomain.com",
      {
        connectedWallet: userWallet, // Works even if undefined
        onSuccess: (winner) => {
          setWinner(winner);
          // Note: Impression will be registered when image loads (see img onLoad below)
        },
        onError: (error) => console.error('Ad load failed:', error)
      }
    );
  }, [userWallet]);

  if (!winner) return <div>Loading ads...</div>;

  return (
    <div onClick={() => handleAdClick(winner)}>
      <img 
        src={winner.bannerIpfsUri} 
        alt={winner.campaignName}
        onLoad={() => {
          // Register impression when image successfully loads
          PrismClient.impressions(
            "0xYourPublisherAddress",
            "yourdomain.com",
            winner.campaignId,
            winner.jwt_token,
            {
              onError: (error) => console.error('Failed to track impression:', error.message)
            }
          );
        }}
        onError={() => {
          console.error('Failed to load ad image');
        }}
      />
    </div>
  );

  function handleAdClick(winner: PrismWinner) {
    // Register click and redirect
    PrismClient.clicks(
      "0xYourPublisherAddress",
      winner.url,
      winner.campaignId,
      winner.jwt_token
    );
    window.open(winner.url, '_blank');
  }
}
```

### Manual Auction (Legacy Method)

If you prefer manual control or need to trigger auctions conditionally:

```typescript
// Manual auction - requires wallet address
const winner = await PrismClient.auction(
  publisherAddress,
  publisherDomain,
  userWalletAddress
);

// Auto auction - uses fallback address if no wallet provided
const winner = await PrismClient.autoAuction(
  publisherAddress,
  publisherDomain,
  userWalletAddress // Optional
);
```
- Auction Response : PrismWinner
```typescript
interface PrismWinner {
    jwt_token: string; // SDK will add jwt token to clicks and impressions calls
    bannerIpfsUri: string;
    campaignId: string;
    campaignName: string;
    url: string;
}
```

## API Methods

### PrismClient.init() - Recommended

Automatically initializes ads when your page loads. Handles both connected and unconnected wallet states.

**Parameters:**
- `publisherAddress` (string): Your whitelisted publisher Ethereum address
- `publisherDomain` (string): Your domain (e.g., "yourdomain.com")
- `options` (PrismInitOptions): Configuration object. See above for all supported fields.
  - `connectedWallet?` (string): User's wallet address (optional)
  - `autoTrigger?` (boolean): Whether to automatically trigger auction (default: true)
  - `walletDetectionTimeout?` (number): Max time (ms) to wait for wallet connection
  - `walletDetectionInterval?` (number): Interval (ms) to check for wallet
  - `getWalletAddress?` (function): Custom async wallet getter
  - `onSuccess?` (function): Callback when auction succeeds
  - `onError?` (function): Callback when auction fails
  - `retries?` (number): Retry attempts
  - `timeout?` (number): Request timeout (ms)

### PrismClient.autoAuction()

Triggers auction with automatic fallback for unconnected users.

**Parameters:**
- `publisherAddress` (string): Your publisher address
- `publisherDomain` (string): Your domain
- `connectedWallet?` (string): User's wallet (uses zero address if not provided)

### PrismClient.auction() - Legacy

Original auction method that requires a wallet address.

**Parameters:**
- `publisherAddress` (string): Your publisher address
- `publisherDomain` (string): Your domain  
- `walletAddress` (string): User's wallet address (required)
- `options?` (object): Configuration options including error handling

## Error Handling and Configuration

All methods now support comprehensive error handling with callbacks, retries, and timeouts:

```typescript
// Advanced error handling example
PrismClient.init(publisherAddress, publisherDomain, {
  connectedWallet: userWallet,
  retries: 3,           // Retry failed requests 3 times
  timeout: 15000,       // 15 second timeout
  onSuccess: (winner) => {
    console.log('Ad loaded successfully:', winner.campaignName);
    displayAd(winner);
  },
  onError: (error) => {
    console.error('Failed to load ads:', error.message);
    showFallbackContent();
  }
});

// Manual method with error handling
try {
  const winner = await PrismClient.autoAuction(
    publisherAddress,
    publisherDomain,
    userWallet,
    {
      retries: 2,
      timeout: 10000,
      onSuccess: (winner) => console.log('Success:', winner.campaignName),
      onError: (error) => console.log('Error:', error.message)
    }
  );
  
  // Register impression with error handling
  await PrismClient.impressions(
    publisherAddress,
    publisherDomain,
    winner.campaignId,
    winner.jwt_token,
    {
      retries: 2,
      onError: (error) => console.log('Failed to track impression:', error.message)
    }
  );
} catch (error) {
  console.error('Auction failed:', error.message);
}
```

## Configuration Options

### Default Settings
- **Retries**: 3 attempts with exponential backoff (1s, 2s, 4s delays)
- **Timeout**: 10 seconds per request
- **Auto-trigger**: Enabled for `init()` method

### Custom Configuration
```typescript
// Override defaults
const options = {
  retries: 5,           // More retries for critical operations
  timeout: 30000,       // Longer timeout for slow networks
  onSuccess: (result) => trackSuccess(result),
  onError: (error) => reportError(error)
};
```

## Unconnected Wallet Handling

When users haven't connected their wallet, the SDK automatically uses the Ethereum zero address (`0x0000000000000000000000000000000000000000`) which your backend recognizes as an unconnected user state. This allows you to:

- Show ads immediately when users visit your site
- Provide a seamless experience for both connected and unconnected users
- Still participate in the advertising auction and earn revenue

**Important:** The methods clicks/impressions on the `PrismClient` are
crucial for tracking and claiming publishers profit.

### - Register ads impressions

```typescript
// Register impressions (essential for revenue tracking)
await PrismClient.impressions(
  publisherAddress,
  publisherDomain,
  prismWinner.campaignId,
  prismWinner.jwt_token,
  {
    onSuccess: () => console.log('Impression tracked'),
    onError: (error) => console.error('Failed to track impression:', error.message)
  }
);
```

### - Register ads clicks

```typescript
// Register clicks on ads (essential for revenue tracking)
await PrismClient.clicks(
  publisherAddress,
  publisherDomain, // Use domain, not the ad URL
  prismWinner.campaignId,
  prismWinner.jwt_token,
  {
    onSuccess: () => {
      // Redirect after successful tracking
      window.open(prismWinner.url, '_blank');
    },
    onError: (error) => {
      console.error('Failed to track click:', error.message);
      // Still redirect on tracking failure
      window.open(prismWinner.url, '_blank');
    }
  }
);
```

### Best Practices for Tracking

```typescript
// Example: Complete ad interaction flow with proper timing
function createAdBanner(winner: PrismWinner) {
  const img = document.createElement('img');
  img.src = winner.bannerIpfsUri;
  img.alt = winner.campaignName;
  
  // 1. Register impression ONLY when image successfully loads
  img.onload = () => {
    PrismClient.impressions(
      publisherAddress,
      publisherDomain,
      winner.campaignId,
      winner.jwt_token,
      {
        retries: 3, // Ensure impression is tracked
        onSuccess: () => console.log('Impression tracked for:', winner.campaignName),
        onError: (error) => console.error('Impression tracking failed:', error.message)
      }
    );
  };
  
  img.onerror = () => {
    console.error('Failed to load ad image, no impression tracked');
  };

  // 2. Register click when user interacts with ad
  img.onclick = async () => {
    try {
      await PrismClient.clicks(
        publisherAddress,
        publisherDomain,
        winner.campaignId,
        winner.jwt_token,
        {
          retries: 2,
          timeout: 5000 // Quick timeout for clicks
        }
      );
      
      // Redirect after successful tracking
      window.open(winner.url, '_blank');
    } catch (error) {
      console.error('Click tracking failed:', error);
      // Always redirect, even if tracking fails
      window.open(winner.url, '_blank');
    }
  };

  return img;
}

// Alternative: React Hook for proper tracking timing
function useAdTracking(winner: PrismWinner) {
  const [impressionTracked, setImpressionTracked] = useState(false);
  
  const trackImpression = useCallback(() => {
    if (!impressionTracked) {
      PrismClient.impressions(
        publisherAddress,
        publisherDomain,
        winner.campaignId,
        winner.jwt_token,
        {
          onSuccess: () => {
            console.log('Impression tracked');
            setImpressionTracked(true);
          },
          onError: (error) => console.error('Impression failed:', error.message)
        }
      );
    }
  }, [winner, impressionTracked]);
  
  const trackClick = useCallback(async () => {
    try {
      await PrismClient.clicks(
        publisherAddress,
        publisherDomain,
        winner.campaignId,
        winner.jwt_token
      );
      window.open(winner.url, '_blank');
    } catch (error) {
      console.error('Click tracking failed:', error);
      window.open(winner.url, '_blank');
    }
  }, [winner]);
  
  return { trackImpression, trackClick };
}
```

---

> **Why use wallet detection options?**
>
> When a user visits your site, their wallet address may not be available immediately—even if their wallet is already connected. It can take a few hundred milliseconds for wallet providers (like MetaMask) to inject the address into the page. The `walletDetectionTimeout`, `walletDetectionInterval`, and `getWalletAddress` options allow the SDK to wait a short period for the wallet address to become available before sending the auction request. This ensures you get the user's real address if possible, maximizing campaign targeting and revenue, while still falling back to the unconnected state if no wallet is detected in time.

### Advanced Wallet Detection Use Case

You can use the new `walletDetectionTimeout`, `walletDetectionInterval`, and `getWalletAddress` options to customize how the SDK waits for a wallet connection before running the auction. This is useful for dApps that want to give users a chance to connect their wallet before showing ads, or want to integrate with custom wallet providers.

**Example: Wait up to 3 seconds for a wallet connection, checking every 200ms**

```typescript
PrismClient.init(
  "0xYourPublisherAddress",
  "yourdomain.com",
  {
    // Custom async wallet getter (e.g., from MetaMask or other provider)
    getWalletAddress: async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts[0];
      }
      return undefined;
    },
    walletDetectionTimeout: 3000, // Wait up to 3 seconds for wallet connection
    walletDetectionInterval: 200, // Check every 200ms
    onSuccess: (winner) => {
      // Show ad, track impression, etc.
    },
    onError: (err) => {
      // Handle error or fallback
    }
  }
);
```

If no wallet is detected within the timeout, the SDK will proceed using the fallback (unconnected) address, ensuring ads are still shown.

---

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