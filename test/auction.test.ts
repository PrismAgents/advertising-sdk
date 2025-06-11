import { PrismClient, PrismWinner } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, CAMPAIGN_ID, MOCK_JWT_TOKEN, mockSubtleCrypto } from './setupTestEnv';

setupTestEnv();

describe('PrismClient Auction', () => {
    it('should call encryptAddress and return campaign data', async () => {
        const auctionResult: PrismWinner = await PrismClient.auction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET
        );

        expect(mockSubtleCrypto.importKey).toHaveBeenCalledTimes(1);
        expect(mockSubtleCrypto.encrypt).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auction'), 
            expect.objectContaining({
                body: expect.stringContaining(Buffer.from(`encrypted-${USER_WALLET}_by_mocked_subtle_encrypt`).toString('base64'))
            })
        );
        expect(auctionResult.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(auctionResult.campaignId).toBe(CAMPAIGN_ID);
    });

    it('should call onSuccess callback when provided', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();

        await PrismClient.auction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET,
            { onSuccess, onError }
        );

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});
