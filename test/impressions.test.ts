import { PrismClient, PrismResponse } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, WEBSITE_URL, CAMPAIGN_ID, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('PrismClient Impressions', () => {
    it('should succeed with a valid JWT token', async () => {
        const impressionResult: PrismResponse = await PrismClient.impressions(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(impressionResult.status).toBe(200);
        expect((impressionResult.data as any).status).toBe("success");
    });

    it('should call onSuccess callback when provided', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();

        await PrismClient.impressions(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN,
            { onSuccess, onError }
        );

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});
