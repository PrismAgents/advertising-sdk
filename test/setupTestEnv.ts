// Shared test setup for PrismClient SDK tests
import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

export const PUBLISHER_ADDRESS = "0xFa000000000000000000000000005F723DC";
export const PUBLISHER_DOMAIN = "example.com";
export const WEBSITE_URL = "https://example.com/article";
export const USER_WALLET = "0xFa21000000000000000000000001BD35F723DC";
export const UNCONNECTED_WALLET = "0x0000000000000000000000000000000000000000";
export const CAMPAIGN_ID = "campaign-123";
export const MOCK_JWT_TOKEN = "mock-jwt-token-for-testing";

export const mockSubtleCrypto = {
    importKey: vi.fn().mockResolvedValue({} as CryptoKey),
    encrypt: vi.fn().mockImplementation(async (_algorithm: AlgorithmIdentifier, _key: CryptoKey, data: BufferSource) => {
        const Suffix = "_by_mocked_subtle_encrypt";
        let dataView: ArrayBufferView;
        if (data instanceof ArrayBuffer) {
            dataView = new Uint8Array(data);
        } else if (ArrayBuffer.isView(data)) {
            dataView = data;
        } else {
            throw new Error("Mock encrypt expects ArrayBuffer or ArrayBufferView");
        }
        const dataString = new TextDecoder().decode(dataView);
        const encryptedString = `encrypted-${dataString}${Suffix}`;
        return new TextEncoder().encode(encryptedString).buffer;
    }),
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

let originalFetch: any;
let fetchMock: any;
let originalWindow: any;
let originalAtob: any;
let originalBtoa: any;

export function setupTestEnv() {
    beforeAll(() => {
        originalWindow = (global as any).window;
        originalAtob = global.atob;
        originalBtoa = global.btoa;

        global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
        global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
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
            }
        };
    });

    afterAll(() => {
        (global as any).window = originalWindow;
        global.atob = originalAtob;
        global.btoa = originalBtoa;
    });

    beforeEach(() => {
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
            const dataString = new TextDecoder().decode(dataView);
            const encryptedString = `encrypted-${dataString}${Suffix}`;
            return new TextEncoder().encode(encryptedString).buffer;
        });

        fetchMock = vi.fn(async (url: string | URL | Request, _options?: RequestInit): Promise<Response> => {
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

            Object.defineProperty(mockResponse, 'json', {
                writable: true,
                value: vi.fn().mockResolvedValue(responseBody)
            });

            return Promise.resolve(mockResponse);
        });
        originalFetch = global.fetch;
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    return { fetchMock };
}
