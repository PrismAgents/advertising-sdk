# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
npm run dev          # Watch mode build with tsup
npm run build        # Production build (CJS + ESM + types)
npm run typecheck    # Type checking without emit
npm run clean        # Remove dist directory

# Testing
npm test             # Run Vitest tests once
npm run test:watch   # Run Vitest in watch mode
npm run test:ui      # Run Vitest with UI
npm run test:client  # Run test client with tsx

# Package management - Uses pnpm
pnpm install         # Install dependencies
```

## Architecture Overview

This is the **Prism SDK** - a TypeScript client for onchain advertising that connects publishers with the Prism protocol's real-time auction system.

### Core Architecture

- **Single Client Class**: `PrismClient` provides static methods for all SDK functionality
- **Dual API Communication**: Communicates with both AWS Nitro Enclave (for auctions) and standard API (for tracking)
- **Browser-First Design**: Uses Web Crypto API for address encryption, requires browser environment
- **Zero-State Design**: All methods are static, no instance state management required
- **Auto-Initialization**: `init()` and `autoAuction()` methods handle both connected and unconnected wallet states
- **Enterprise Error Handling**: Comprehensive retry logic, timeouts, and callback-based error handling

### Key Components

1. **Auto-Initialization System** (`src/index.ts:90-115`)
   - `init()` method for immediate page load advertising
   - `autoAuction()` method with unconnected wallet fallback
   - Uses Ethereum zero address (`0x0000000000000000000000000000000000000000`) for unconnected users
   - Callback-based success/error handling

2. **Auction System** (`src/index.ts:239-275`)
   - Encrypts user addresses using RSA-OAEP with hardcoded public key
   - Calls Nitro Enclave for privacy-preserving auction resolution
   - Returns winning campaign data with JWT token for subsequent tracking
   - Supports retry logic and timeout configuration

3. **Tracking Methods** (`src/index.ts:284-345`)
   - `clicks()` and `impressions()` methods for publisher revenue tracking
   - Both require JWT tokens from auction responses
   - Critical for publisher profit claiming
   - Enhanced with error handling and retry capabilities

4. **Address Encryption** (`src/index.ts:192-228`)
   - Uses Web Crypto API with RSA-OAEP + SHA-256
   - Hardcoded public key for consistent encryption across publishers
   - Browser-only - will not work in Node.js without polyfills

5. **Error Handling & Resilience** (`src/index.ts:127-150`)
   - Configurable retry logic with exponential backoff (default: 3 retries)
   - Request timeout handling with AbortController (default: 10s)
   - Success/error callback patterns for all async operations
   - Comprehensive error types and messages

### Configuration

- API endpoints configured in `src/config.json`
- Production endpoints: Enclave at `prism-enclave.xyz`, API at Railway deployment
- Contract address: `0xF2720929421eEFa11dBe627d818A9D0E68372f08`

### Build System

- **tsup**: Builds both CommonJS and ESM formats with TypeScript declarations
- **Dual Output**: `dist/index.js` (CJS), `dist/index.esm.js` (ESM), `dist/index.d.ts` (types)
- **Source Maps**: Generated for debugging

### Testing Approach

Tests extensively mock browser APIs (`window.crypto.subtle`, `atob`, `btoa`) since the SDK requires browser environment. The test suite validates:

- Complete auction flow including address encryption and API communication
- Auto-initialization with connected and unconnected wallet scenarios  
- Error handling and retry mechanisms with exponential backoff
- Timeout handling and AbortController functionality
- Success/error callback execution
- Mock isolation to prevent test interference

### Common Development Patterns

**Adding New Methods:**
1. Add to `PrismClient` class with static method
2. Include error handling with `try/catch` and `withRetry()`
3. Support optional configuration via options parameter
4. Add comprehensive tests with both success and error scenarios
5. Update TypeScript interfaces for new options

**Error Handling Pattern:**
```typescript
public static async newMethod(params..., options?: ConfigOptions) {
    try {
        const result = await this.withRetry(async () => {
            return this.fetchData(source, endpoint, jwt, body, options);
        }, options?.retries);
        
        options?.onSuccess?.(result);
        return result;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options?.onError?.(err);
        throw err;
    }
}
```