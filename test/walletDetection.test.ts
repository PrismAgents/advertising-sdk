import { PrismClient } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, UNCONNECTED_WALLET, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('Wallet Detection', () => {
    it('should use getWalletAddress when wallet is immediately available', async () => {
        const getWalletAddress = vi.fn().mockReturnValue(USER_WALLET);
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            { getWalletAddress, onSuccess }
        );

        expect(getWalletAddress).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should wait for wallet address and use it when it becomes available', async () => {
        let callCount = 0;
        const getWalletAddress = vi.fn().mockImplementation(() => {
            callCount++;
            return callCount >= 3 ? USER_WALLET : undefined;
        });
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 1000,
                walletDetectionInterval: 50,
                onSuccess
            }
        );

        expect(getWalletAddress).toHaveBeenCalledTimes(3);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should fallback to unconnected state when wallet detection times out', async () => {
        const getWalletAddress = vi.fn().mockReturnValue(undefined);
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 200,
                walletDetectionInterval: 50,
                onSuccess
            }
        );

        expect(getWalletAddress).toHaveBeenCalledTimes(4);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should ignore zero address from getWalletAddress and wait for real address', async () => {
        let callCount = 0;
        const getWalletAddress = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return UNCONNECTED_WALLET;
            if (callCount >= 3) return USER_WALLET;
            return undefined;
        });
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 500,
                walletDetectionInterval: 50,
                onSuccess
            }
        );

        expect(getWalletAddress).toHaveBeenCalledTimes(3);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should handle errors from getWalletAddress gracefully', async () => {
        let callCount = 0;
        const getWalletAddress = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 2) throw new Error('Wallet not ready');
            return USER_WALLET;
        });
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 500,
                walletDetectionInterval: 50,
                onSuccess
            }
        );

        expect(getWalletAddress).toHaveBeenCalledTimes(3);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should use connectedWallet parameter over getWalletAddress', async () => {
        const getWalletAddress = vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999');
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                connectedWallet: USER_WALLET,
                getWalletAddress,
                onSuccess
            }
        );

        expect(getWalletAddress).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should work with async getWalletAddress', async () => {
        const getWalletAddress = vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return USER_WALLET;
        });
        const onSuccess = vi.fn();

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                walletDetectionTimeout: 500,
                onSuccess
            }
        );

        expect(getWalletAddress).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should not call getWalletAddress when autoTrigger is false', async () => {
        const getWalletAddress = vi.fn().mockReturnValue(USER_WALLET);

        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                getWalletAddress,
                autoTrigger: false
            }
        );

        expect(getWalletAddress).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
