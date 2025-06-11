import { PrismClient, PrismResponse } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, WEBSITE_URL, CAMPAIGN_ID, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('PrismClient Clicks', () => {
    it('should succeed with a valid JWT token', async () => {
        const clickResult: PrismResponse = await PrismClient.clicks(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(clickResult.status).toBe(200);
        expect((clickResult.data as any).status).toBe("success");
    });

    it('should call onSuccess callback when provided', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();

        await PrismClient.clicks(
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
