import { PrismClient, PrismResponse, PrismWinner } from "../src/index";
import { vi, expect, it, describe, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock config.json used by fetchData in the SDK
vi.mock('../src/config.json', () => ({
    default: {
        "prism-enclave-url": "http://mock-enclave-url.com",
        "prism-api-url": "http://mock-api-url.com"
    }
}));

// Configuration Constants
const PUBLISHER_ADDRESS = "0xFa000000000000000000000000005F723DC";
const PUBLISHER_DOMAIN = "example.com";
const WEBSITE_URL = "https://example.com/article";
const USER_WALLET = "0xFa21000000000000000000000001BD35F723DC";
const CAMPAIGN_ID = "campaign-123";
const MOCK_JWT_TOKEN = "mock-jwt-token-for-testing";

// --- JSDOM or manual mocks for browser APIs ---
// If not using JSDOM test environment, manually mock window, atob, btoa, and crypto.subtle
// For a simpler setup without full JSDOM, we can do this:
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

const mockSubtleCrypto = {
    importKey: vi.fn().mockResolvedValue({} as CryptoKey), // Mock it to resolve to a dummy CryptoKey object
    encrypt: vi.fn().mockImplementation(async (_algorithm: AlgorithmIdentifier, _key: CryptoKey, data: BufferSource) => {
        const Suffix = "_by_mocked_subtle_encrypt";
        let dataView: ArrayBufferView;
        if (data instanceof ArrayBuffer) {
            dataView = new Uint8Array(data); // Work with a view
        } else if (ArrayBuffer.isView(data)) {
            dataView = data;
        } else {
            throw new Error("Mock encrypt expects ArrayBuffer or ArrayBufferView");
        }
        const dataString = new TextDecoder().decode(dataView); // Decode from the view
        const encryptedString = `encrypted-${dataString}${Suffix}`;
        return new TextEncoder().encode(encryptedString).buffer;
    }),
    // Add missing methods to satisfy TypeScript
    decrypt: vi.fn(),
    deriveBits: vi.fn(),
    deriveKey: vi.fn(),
    digest: vi.fn(),
    exportKey: vi.fn(),
    generateKey: vi.fn(),
    sign: vi.fn(),
    unwrapKey: vi.fn(),
    verify: vi.fn(),
    wrapKey: vi.fn()
};

// Ensure window is defined with crypto property
if (typeof global.window === 'undefined') {
    (global as any).window = {};
}

// Create and attach the crypto object to window
(global as any).window.crypto = {
    subtle: mockSubtleCrypto,
    getRandomValues: vi.fn((array: ArrayBufferView) => {
        if (array && 'length' in array) {
            const view = new Uint8Array(array.buffer);
            for (let i = 0; i < view.length; i++) {
                view[i] = Math.floor(Math.random() * 256);
            }
        }
        return array;
    }),
    randomUUID: vi.fn().mockReturnValue('mock-uuid') // Add missing property
};
// --- End of mocks ---

describe('PrismClient Integration-like Tests with Mocked Fetch and Browser APIs', () => {
    const originalFetch = global.fetch;
    let fetchMock: any;
    let originalWindow: Window & typeof globalThis;
    let originalAtob: typeof atob;
    let originalBtoa: typeof btoa;

    beforeAll(() => {
        // Store original browser-like globals if they exist (e.g. if test env changes to JSDOM)
        originalWindow = (global as any).window;
        originalAtob = global.atob;
        originalBtoa = global.btoa;

        // Apply our mocks
        global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
        global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
        
        // Ensure window is properly set up with crypto
        (global as any).window = {
            crypto: {
                subtle: mockSubtleCrypto,
                getRandomValues: vi.fn((array) => {
                    if (array.length) {
                        for (let i = 0; i < array.length; i++) {
                            array[i] = Math.floor(Math.random() * 256);
                        }
                    }
                    return array;
                }),
                randomUUID: vi.fn().mockReturnValue('mock-uuid-in-beforeall') 
            },
            // Add other window properties if needed by the SDK
        };
    });

    afterAll(() => {
        // Restore original globals
        (global as any).window = originalWindow;
        global.atob = originalAtob;
        global.btoa = originalBtoa;
    });

    beforeEach(() => {
        // Reset mocks for crypto.subtle before each test
        mockSubtleCrypto.importKey.mockClear().mockResolvedValue({} as CryptoKey);
        mockSubtleCrypto.encrypt.mockClear().mockImplementation(async (_algorithm: AlgorithmIdentifier, _key: CryptoKey, data: BufferSource) => {
            const Suffix = "_by_mocked_subtle_encrypt";
            let dataView: ArrayBufferView;
            if (data instanceof ArrayBuffer) {
                dataView = new Uint8Array(data);
            } else if (ArrayBuffer.isView(data)) {
                dataView = data;
            } else {
                 throw new Error("Mock encrypt expects ArrayBuffer or ArrayBufferView");
            }
            const dataString = new TextDecoder().decode(dataView); // Decode from the view
            const encryptedString = `encrypted-${dataString}${Suffix}`;
            return new TextEncoder().encode(encryptedString).buffer;
        });

        fetchMock = vi.fn(async (url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
            // console.log(`Mock Fetch request to: ${url.toString()}`);
            // if (_options) {
            //     console.log(`Mock Request headers:`, _options.headers);
            //     console.log(`Mock Request body:`, _options.body);
            // }

            let responseBody: any;
            const urlString = url.toString();

            if (urlString.includes('/auction')) {
                responseBody = {
                    status: "success",
                    data: {
                        jwt_token: MOCK_JWT_TOKEN,
                        campaignId: CAMPAIGN_ID,
                        bannerIpfsUri: "https://example.com/banner.png",
                        url: "https://example.com/campaign-target",
                        campaignName: "Test Campaign"
                    }
                };
            } else if (urlString.includes('/click') || urlString.includes('/impressions')) {
                responseBody = {
                    data: {
                        status: "success",
                        message: `${urlString.includes('/click') ? 'Click' : 'Impression'} recorded successfully.`
                    }
                };
            } else {
                responseBody = {
                    status: "error",
                    message: "Unknown endpoint for mock"
                };
            }
            
            const responseText = JSON.stringify(responseBody);
            const mockResponse = new Response(responseText, {
                status: 200,
                statusText: "OK",
                headers: { 'Content-Type': 'application/json' }
            });

            // Override the json method for this response
            Object.defineProperty(mockResponse, 'json', {
                writable: true,
                value: vi.fn().mockResolvedValue(responseBody)
            });

            return Promise.resolve(mockResponse);
        });
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch; 
        vi.clearAllMocks(); 
    });

    it('auction should call encryptAddress (which uses mocked window.crypto.subtle) and return campaign data', async () => {
        const auctionResult: PrismWinner = await PrismClient.auction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET
        );

        expect(mockSubtleCrypto.importKey).toHaveBeenCalledTimes(1);
        expect(mockSubtleCrypto.encrypt).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auction'), 
            expect.objectContaining({
                body: expect.stringContaining(Buffer.from(`encrypted-${USER_WALLET}_by_mocked_subtle_encrypt`).toString('base64')) // Ensure we check the base64 encoded body part
            })
        );
        expect(auctionResult.jwt_token).toBe(MOCK_JWT_TOKEN);
        expect(auctionResult.campaignId).toBe(CAMPAIGN_ID);
    });

    it('clicks should succeed with a valid JWT token', async () => {
        const clickResult: PrismResponse = await PrismClient.clicks(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(clickResult.status).toBe(200);
        expect((clickResult.data as any).status).toBe("success");
    });

    it('impressions should succeed with a valid JWT token', async () => {
        const impressionResult: PrismResponse = await PrismClient.impressions(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(impressionResult.status).toBe(200);
        expect((impressionResult.data as any).status).toBe("success");
    });

    it('encryptAddress should use mocked window.crypto.subtle and btoa', async () => {
        const encryptedAddress = await PrismClient.encryptAddress(USER_WALLET);
        
        expect(mockSubtleCrypto.importKey).toHaveBeenCalledTimes(1);
        expect(mockSubtleCrypto.encrypt).toHaveBeenCalledTimes(1);
        
        const expectedEncryptedStringViaMock = `encrypted-${USER_WALLET}_by_mocked_subtle_encrypt`;
        const expectedBase64Output = Buffer.from(expectedEncryptedStringViaMock, 'binary').toString('base64'); // Ensure source encoding is binary for btoa polyfill
        
        expect(encryptedAddress).toBe(expectedBase64Output);
        expect(typeof encryptedAddress).toBe('string');
        expect(encryptedAddress.length).toBeGreaterThan(0);

        // Verify atob/btoa interaction by checking the mock result format
        const intermediateEncryptedBytes = new TextEncoder().encode(expectedEncryptedStringViaMock);
        const finalBtoaOutput = btoa(String.fromCharCode(...new Uint8Array(intermediateEncryptedBytes.buffer)));
        expect(encryptedAddress).toBe(finalBtoaOutput);
    });
});