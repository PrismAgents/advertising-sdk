import { PrismClient } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, MOCK_JWT_TOKEN } from './setupTestEnv';

setupTestEnv();

describe('PrismClient init', () => {
    it('should trigger auto auction by default and call success callback', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                connectedWallet: USER_WALLET,
                onSuccess,
                onError
            }
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
        expect(result).toBeTruthy();
        expect(result?.jwt_token).toBe(MOCK_JWT_TOKEN);
    });

    it('should not trigger auction when autoTrigger is false', async () => {
        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                autoTrigger: false
            }
        );
        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should call error callback when auction fails', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const result = await PrismClient.init(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            {
                onSuccess,
                onError
            }
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toBeNull();
        fetchSpy.mockRestore();
    });
});
