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

### Key Components

1. **Auction System** (`src/index.ts:113-137`)
   - Encrypts user addresses using RSA-OAEP with hardcoded public key
   - Calls Nitro Enclave for privacy-preserving auction resolution
   - Returns winning campaign data with JWT token for subsequent tracking

2. **Tracking Methods** (`src/index.ts:146-181`)
   - `clicks()` and `impressions()` methods for publisher revenue tracking
   - Both require JWT tokens from auction responses
   - Critical for publisher profit claiming

3. **Address Encryption** (`src/index.ts:67-103`)
   - Uses Web Crypto API with RSA-OAEP + SHA-256
   - Hardcoded public key for consistent encryption across publishers
   - Browser-only - will not work in Node.js without polyfills

### Configuration

- API endpoints configured in `src/config.json`
- Production endpoints: Enclave at `prism-enclave.xyz`, API at Railway deployment
- Contract address: `0xF2720929421eEFa11dBe627d818A9D0E68372f08`

### Build System

- **tsup**: Builds both CommonJS and ESM formats with TypeScript declarations
- **Dual Output**: `dist/index.js` (CJS), `dist/index.esm.js` (ESM), `dist/index.d.ts` (types)
- **Source Maps**: Generated for debugging

### Testing Approach

Tests extensively mock browser APIs (`window.crypto.subtle`, `atob`, `btoa`) since the SDK requires browser environment. The test suite validates the complete auction flow including address encryption and API communication.