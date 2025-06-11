import { PrismClient, PrismWinner } from "../src/index";
import { expect, it, describe, vi } from 'vitest';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, MOCK_JWT_TOKEN } from './setupTestEnv';

const { fetchMock } = setupTestEnv();

describe('PrismClient Callbacks', () => {
    it('auction should call onSuccess callback when provided', async () => {
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

    it('autoAuction should call onSuccess callback when provided', async () => {
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
