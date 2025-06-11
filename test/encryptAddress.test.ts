import { PrismClient } from "../src/index";
import { expect, it, describe } from 'vitest';
import { setupTestEnv, USER_WALLET, mockSubtleCrypto } from './setupTestEnv';

setupTestEnv();

describe('PrismClient encryptAddress', () => {
    it('should use mocked window.crypto.subtle and btoa', async () => {
        const encryptedAddress = await PrismClient.encryptAddress(USER_WALLET);
        expect(mockSubtleCrypto.importKey).toHaveBeenCalledTimes(1);
        expect(mockSubtleCrypto.encrypt).toHaveBeenCalledTimes(1);
        const expectedEncryptedStringViaMock = `encrypted-${USER_WALLET}_by_mocked_subtle_encrypt`;
        const expectedBase64Output = Buffer.from(expectedEncryptedStringViaMock, 'binary').toString('base64');
        expect(encryptedAddress).toBe(expectedBase64Output);
        expect(typeof encryptedAddress).toBe('string');
        expect(encryptedAddress.length).toBeGreaterThan(0);
        const intermediateEncryptedBytes = new TextEncoder().encode(expectedEncryptedStringViaMock);
        const finalBtoaOutput = btoa(String.fromCharCode(...new Uint8Array(intermediateEncryptedBytes.buffer)));
        expect(encryptedAddress).toBe(finalBtoaOutput);
    });
});
