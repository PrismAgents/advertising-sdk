import { PrismClient, PrismWinner } from "../src/index";
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, CAMPAIGN_ID, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('PrismClient Retry and Timeout', () => {
    beforeEach(() => {
        // Reset auction state before each test
        PrismClient.resetAuctionState(PUBLISHER_ADDRESS, PUBLISHER_DOMAIN);
    });
    it('should retry failed requests with exponential backoff', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        fetchSpy.mockRejectedValueOnce(new Error('Network error'));
        fetchSpy.mockRejectedValueOnce(new Error('Network error'));
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                data: {
                    jwt_token: MOCK_JWT_TOKEN,
                    campaignId: CAMPAIGN_ID,
                    bannerIpfsUri: "https://example.com/banner.png",
                    url: "https://example.com/campaign-target",
                    campaignName: "Test Campaign"
                }
            })
        } as Response);

        const result = await PrismClient.autoAuction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET,
            { retries: 3 }
        );
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(result.jwt_token).toBe(MOCK_JWT_TOKEN);
        fetchSpy.mockRestore();
    });

    it('should handle timeout errors correctly', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => {
            return new Promise((_, reject) => {
                setTimeout(() => {
                    const abortError = new Error('AbortError');
                    abortError.name = 'AbortError';
                    reject(abortError);
                }, 150);
            });
        });
        const onError = vi.fn();
        try {
            await PrismClient.autoAuction(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                USER_WALLET,
                { timeout: 100, retries: 1, onError }
            );
        } catch (error) {
            expect(error).toBeDefined();
        }
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        fetchSpy.mockRestore();
    }, 10000);
});
