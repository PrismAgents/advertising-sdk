import { PrismClient, PrismWinner } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, UNCONNECTED_WALLET, CAMPAIGN_ID, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('PrismClient autoAuction', () => {
    it('should use connected wallet when provided', async () => {
        const auctionResult: PrismWinner = await PrismClient.autoAuction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET
        );
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

    it('should use unconnected wallet address when no wallet provided', async () => {
        const auctionResult: PrismWinner = await PrismClient.autoAuction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auction'),
            expect.objectContaining({
                body: expect.stringContaining(Buffer.from(`encrypted-${UNCONNECTED_WALLET}_by_mocked_subtle_encrypt`).toString('base64'))
            })
        );
        expect(auctionResult.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(auctionResult.campaignId).toBe(CAMPAIGN_ID);
    });

    it('should call onSuccess callback when provided', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        await PrismClient.autoAuction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET,
            { onSuccess, onError }
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});
