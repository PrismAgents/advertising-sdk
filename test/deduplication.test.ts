import { PrismClient } from "../src/index";
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('Auction Deduplication', () => {
    beforeEach(() => {
        // Reset auction state before each test
        PrismClient.resetAuctionState(PUBLISHER_ADDRESS, PUBLISHER_DOMAIN);
    });

    it('should prevent duplicate auction requests for same publisher+domain', async () => {
        const getWalletAddress = () => USER_WALLET;
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();

        // First init call should succeed
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess1
            }
        );

        // Second init call should be blocked and return null
        const result2 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess2
            }
        );

        expect(result1).toBeTruthy();
        expect(result1?.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(onSuccess1).toHaveBeenCalledTimes(1);

        expect(result2).toBeNull();
        expect(onSuccess2).not.toHaveBeenCalled();

        // Should only have made one fetch call total
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should allow auction for different publisher addresses', async () => {
        const getWalletAddress = () => USER_WALLET;
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();
        const differentPublisher = "0x9999999999999999999999999999999999999999";

        // First init call
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess1
            }
        );

        // Second init call with different publisher should succeed
        const result2 = await PrismClient.init(
            differentPublisher,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess2
            }
        );

        expect(result1).toBeTruthy();
        expect(result2).toBeTruthy();
        expect(onSuccess1).toHaveBeenCalledTimes(1);
        expect(onSuccess2).toHaveBeenCalledTimes(1);

        // Should have made two fetch calls
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should allow auction for different domains', async () => {
        const getWalletAddress = () => USER_WALLET;
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();
        const differentDomain = "different-domain.com";

        // First init call
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess1
            }
        );

        // Second init call with different domain should succeed
        const result2 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            differentDomain,
            {
                getWalletAddress,
                onSuccess: onSuccess2
            }
        );

        expect(result1).toBeTruthy();
        expect(result2).toBeTruthy();
        expect(onSuccess1).toHaveBeenCalledTimes(1);
        expect(onSuccess2).toHaveBeenCalledTimes(1);

        // Should have made two fetch calls
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should allow auction after resetAuctionState is called', async () => {
        const getWalletAddress = () => USER_WALLET;
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();

        // First init call should succeed
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess1
            }
        );

        // Reset auction state
        PrismClient.resetAuctionState(PUBLISHER_ADDRESS, PUBLISHER_DOMAIN);

        // Second init call should now succeed
        const result2 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                onSuccess: onSuccess2
            }
        );

        expect(result1).toBeTruthy();
        expect(result2).toBeTruthy();
        expect(onSuccess1).toHaveBeenCalledTimes(1);
        expect(onSuccess2).toHaveBeenCalledTimes(1);

        // Should have made two fetch calls
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should prevent concurrent auction requests for same publisher+domain', async () => {
        let walletCallCount = 0;
        const getWalletAddress = vi.fn().mockImplementation(() => {
            walletCallCount++;
            // Return wallet on 50th call to simulate delayed wallet connection
            return walletCallCount >= 50 ? USER_WALLET : undefined;
        });
        
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();

        // Start two concurrent init calls
        const promise1 = PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 2000,
                walletDetectionInterval: 10,
                onSuccess: onSuccess1
            }
        );

        // Start second call immediately (simulating React double-effect or wallet state change)
        const promise2 = PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 1000,
                walletDetectionInterval: 10,
                onSuccess: onSuccess2
            }
        );

        const [result1, result2] = await Promise.all([promise1, promise2]);

        // One should succeed, one should be blocked
        const successfulResults = [result1, result2].filter(r => r !== null);
        expect(successfulResults).toHaveLength(1);
        
        // One callback should be called
        const callbackCalls = onSuccess1.mock.calls.length + onSuccess2.mock.calls.length;
        expect(callbackCalls).toBe(1);

        // Should only have made one fetch call total
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should allow new auction when wallet connects after unconnected auction', async () => {
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();

        // First init call without wallet (unconnected)
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                // No getWalletAddress provided, so it uses unconnected state
                onSuccess: onSuccess1
            }
        );

        // Second init call with wallet connected
        const result2 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress: () => USER_WALLET,
                walletDetectionTimeout: 100,
                onSuccess: onSuccess2
            }
        );

        // Both should succeed since they have different wallet states
        expect(result1).toBeTruthy();
        expect(result1?.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(onSuccess1).toHaveBeenCalledTimes(1);

        expect(result2).toBeTruthy();
        expect(result2?.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(onSuccess2).toHaveBeenCalledTimes(1);

        // Should have made two fetch calls (one for unconnected, one for connected)
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should allow new auction when user switches wallets', async () => {
        const differentWallet = "0x1111111111111111111111111111111111111111";
        const onSuccess1 = vi.fn();
        const onSuccess2 = vi.fn();

        // First init call with first wallet
        const result1 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress: () => USER_WALLET,
                walletDetectionTimeout: 100,
                onSuccess: onSuccess1
            }
        );

        // Second init call with different wallet
        const result2 = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress: () => differentWallet,
                walletDetectionTimeout: 100,
                onSuccess: onSuccess2
            }
        );

        // Both should succeed since they have different wallets
        expect(result1).toBeTruthy();
        expect(result1?.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(onSuccess1).toHaveBeenCalledTimes(1);

        expect(result2).toBeTruthy();
        expect(result2?.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(onSuccess2).toHaveBeenCalledTimes(1);

        // Should have made two fetch calls (one for each wallet)
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});