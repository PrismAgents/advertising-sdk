import { PrismClient, PrismResponse } from "../src/index"; // Using import for Jest

// Mock config.json used by fetchData in the SDK
jest.mock('../src/config.json', () => ({
    "prism-enclave-url": "http://mock-enclave-url.com",
    "prism-api-url": "http://mock-api-url.com"
}), { virtual: true });

// Configuration Constants
const PUBLISHER_ADDRESS = "0xFa000000000000000000000000005F723DC";
const PUBLISHER_DOMAIN = "example.com";
const WEBSITE_URL = "https://example.com/article";
const USER_WALLET = "0xFa21000000000000000000000001BD35F723DC";
const CAMPAIGN_ID = "campaign-123";
const MOCK_JWT_TOKEN = "mock-jwt-token-for-testing";

describe('PrismClient Integration-like Tests with Mocked Fetch', () => {
    const originalFetch = global.fetch;
    let fetchMock: jest.Mock;

    beforeEach(() => {
        fetchMock = jest.fn(async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
            console.log(`Mock Fetch request to: ${url.toString()}`);
            if (options) {
                console.log(`Mock Request headers:`, options.headers);
                console.log(`Mock Request body:`, options.body);
            }

            let responseBody: any;
            const urlString = url.toString();

            if (urlString.includes('/auction')) {
                responseBody = {
                    status: "success", // This is part of the server's response *body*
                    jwt_token: MOCK_JWT_TOKEN,
                    data: {
                        campaignId: CAMPAIGN_ID,
                        bannerIpfsUri: "https://example.com/banner.png",
                        url: "https://example.com/campaign-target",
                        campaignName: "Test Campaign"
                    }
                };
            } else if (urlString.includes('/click') || urlString.includes('/impressions')) {
                responseBody = {
                    status: "success",
                    message: `${urlString.includes('/click') ? 'Click' : 'Impression'} recorded successfully.`
                };
            } else {
                responseBody = {
                    status: "error",
                    message: "Unknown endpoint for mock"
                };
            }

            return Promise.resolve({
                ok: true,
                status: 200, // HTTP status
                statusText: "OK",
                headers: new Headers({ 'Content-Type': 'application/json' }),
                redirected: false,
                type: 'basic' as ResponseType,
                url: urlString,
                json: async () => responseBody, // This is the method PrismClient calls
                text: async () => JSON.stringify(responseBody),
                body: null,
                bodyUsed: false,
                clone: function () { return this; },
                arrayBuffer: async () => new ArrayBuffer(0),
                blob: async () => new Blob([]),
                formData: async () => new FormData(),
            } as Response);
        });
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch; // Restore original fetch
        jest.clearAllMocks(); // Clear all mock implementations and calls
    });

    test('auction should return a JWT token and campaign data', async () => {
        const auctionResult: PrismResponse = await PrismClient.auction(
            PUBLISHER_ADDRESS,
            PUBLISHER_DOMAIN,
            USER_WALLET
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auction'), 
            expect.any(Object)
        );
        expect(auctionResult.status).toBe(200); // HTTP status via PrismResponse
        // The entire server response body is in auctionResult.data for PrismResponse
        expect((auctionResult.data as any).jwt_token).toBe(MOCK_JWT_TOKEN);
        expect((auctionResult.data as any).data.campaignId).toBe(CAMPAIGN_ID);
        expect((auctionResult.data as any).data.campaignName).toBe("Test Campaign");
    });

    test('clicks should succeed with a valid JWT token', async () => {
        // We use MOCK_JWT_TOKEN directly, assuming auction provides it as per the mock setup.
        const clickResult: PrismResponse = await PrismClient.clicks(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/click'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${MOCK_JWT_TOKEN}`
                }),
                body: JSON.stringify({
                    publisherAddress: PUBLISHER_ADDRESS,
                    websiteUrl: WEBSITE_URL,
                    campaignId: CAMPAIGN_ID
                })
            })
        );
        expect(clickResult.status).toBe(200);
        expect((clickResult.data as any).status).toBe("success");
        expect((clickResult.data as any).message).toContain('Click recorded successfully.');
    });

    test('impressions should succeed with a valid JWT token', async () => {
        const impressionResult: PrismResponse = await PrismClient.impressions(
            PUBLISHER_ADDRESS,
            WEBSITE_URL,
            CAMPAIGN_ID,
            MOCK_JWT_TOKEN
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/impressions'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': `Bearer ${MOCK_JWT_TOKEN}`
                }),
                body: JSON.stringify({
                    publisherAddress: PUBLISHER_ADDRESS,
                    websiteUrl: WEBSITE_URL,
                    campaignId: CAMPAIGN_ID
                })
            })
        );
        expect(impressionResult.status).toBe(200);
        expect((impressionResult.data as any).status).toBe("success");
        expect((impressionResult.data as any).message).toContain('Impression recorded successfully.');
    });

    test('encryptAddress should return a valid base64 encoded string', () => {
        const encryptedAddress = PrismClient.encryptAddress(USER_WALLET);
        expect(typeof encryptedAddress).toBe('string');
        // Check if it's a plausible base64 string (non-empty and decodes without error)
        expect(encryptedAddress.length).toBeGreaterThan(0);
        let decoded = "";
        try {
            decoded = Buffer.from(encryptedAddress, 'base64').toString('ascii');
        } catch (e) {
            // Fails test if not base64
            expect(e).toBeUndefined(); 
        }
        // This is a weak check, but actual RSA-OAEP output is non-deterministic for the same input.
        // A more robust test would involve mocking crypto.publicEncrypt to return a fixed value.
        expect(decoded).toBeTruthy(); 
    });
});