import { PrismClient } from "../src/index";
import fs from 'fs';

// Mock crypto and fs modules
jest.mock('crypto', () => ({
    createPublicKey: jest.fn().mockReturnValue('mocked-public-key'),
    publicEncrypt: jest.fn().mockReturnValue(Buffer.from('encrypted-data')),
    constants: {
        RSA_PKCS1_OAEP_PADDING: 'padding'
    }
}));

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('mocked-pem-content')
}));

// Replace with real API key for actual testing
const API_KEY = "test-api-key";
const PUBLISHER_ADDRESS = "0xFa000000000000000000000000005F723DC";
const PUBLISHER_DOMAIN = "example.com";
const WEBSITE_URL = "https://example.com";
const WALLET_ADDRESS = "0xFa21000000000000000000000001BD35F723DC";
const CAMPAIGN_ID = "campaign-123";

describe("PrismClient", () => {
    let prismClient: PrismClient;
    let mockFetchData: jest.SpyInstance;
    let mockEncryptAddress: jest.SpyInstance;
    let globalFetch: jest.Mock;

    beforeEach(() => {
        // Mock global fetch before each test
        globalFetch = jest.fn().mockImplementation(() => 
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true }),
                text: () => Promise.resolve("Error text")
            })
        );
        global.fetch = globalFetch;
        
        prismClient = new PrismClient(API_KEY);
        
        // Mock the fetchData method
        mockFetchData = jest.spyOn(prismClient as any, "fetchData");
        mockFetchData.mockResolvedValue({ status: 200, data: { success: true } });
        
        // Mock the encryptAddress method
        mockEncryptAddress = jest.spyOn(prismClient, "encryptAddress");
        mockEncryptAddress.mockReturnValue("encrypted-address");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should initialize properly", () => {
        expect(prismClient).toBeInstanceOf(PrismClient);
        expect((prismClient as any).apiKey).toBe(API_KEY);
    });

    describe("encryptAddress", () => {
        test("should encrypt an address using public key", () => {
            // Reset mock to test actual implementation
            mockEncryptAddress.mockRestore();
            
            const result = prismClient.encryptAddress(WALLET_ADDRESS);
            
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(result).toBe("ZW5jcnlwdGVkLWRhdGE="); // Base64 of "encrypted-data"
        });

        test("should handle encryption errors", () => {
            // Reset mock to test actual implementation
            mockEncryptAddress.mockRestore();
            
            // Mock fs to throw an error
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("File not found");
            });
            
            expect(() => {
                prismClient.encryptAddress(WALLET_ADDRESS);
            }).toThrow("File not found");
        });
    });

    describe("auction", () => {
        test("should make request to enclave endpoint", async () => {
            const result = await prismClient.auction(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                WALLET_ADDRESS
            );
            
            expect(mockEncryptAddress).toHaveBeenCalledWith(WALLET_ADDRESS);
            expect(mockFetchData).toHaveBeenCalledWith(
                "enclave",
                "/auction",
                "POST",
                {
                    publisher_address: PUBLISHER_ADDRESS,
                    user_address: "encrypted-address",
                    publisher_domain: PUBLISHER_DOMAIN
                }
            );
            expect(result.status).toBe(200);
        });
    });

    describe("clicks", () => {
        test("should make request to api click endpoint", async () => {
            const result = await prismClient.clicks(
                PUBLISHER_ADDRESS,
                WEBSITE_URL,
                CAMPAIGN_ID
            );
            
            expect(mockFetchData).toHaveBeenCalledWith(
                "api",
                "/click",
                "POST",
                {
                    publisherAddress: PUBLISHER_ADDRESS,
                    websiteUrl: WEBSITE_URL,
                    campaignId: CAMPAIGN_ID
                }
            );
            expect(result.status).toBe(200);
        });
    });

    describe("impressions", () => {
        test("should make request to api impressions endpoint", async () => {
            const result = await prismClient.impressions(
                PUBLISHER_ADDRESS,
                WEBSITE_URL,
                CAMPAIGN_ID
            );
            
            expect(mockFetchData).toHaveBeenCalledWith(
                "api",
                "/impressions",
                "POST",
                {
                    publisherAddress: PUBLISHER_ADDRESS,
                    websiteUrl: WEBSITE_URL,
                    campaignId: CAMPAIGN_ID
                }
            );
            expect(result.status).toBe(200);
        });
    });

    describe("fetchData", () => {
        beforeEach(() => {
            // Reset the fetchData mock to test actual implementation
            mockFetchData.mockRestore();
        });

        test("should call fetch with correct parameters", async () => {
            await (prismClient as any).fetchData(
                "api",
                "/test-endpoint",
                "POST",
                { test: "data" }
            );
            
            expect(globalFetch).toHaveBeenCalledWith(
                expect.stringContaining("/test-endpoint"),
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': API_KEY,
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ test: "data" })
                }
            );
        });

        test("should handle successful response", async () => {
            globalFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ result: "success" })
                })
            );
            
            const result = await (prismClient as any).fetchData(
                "api",
                "/test-endpoint",
                "POST",
                { test: "data" }
            );
            
            expect(result).toEqual({
                status: 200,
                data: { result: "success" }
            });
        });

        test("should handle error response", async () => {
            globalFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: false,
                    status: 400,
                    text: () => Promise.resolve("Bad request")
                })
            );
            
            const result = await (prismClient as any).fetchData(
                "api",
                "/test-endpoint",
                "POST",
                { test: "data" }
            );
            
            expect(result).toEqual({
                status: 400,
                message: "HTTP error! status: 400, message: Bad request"
            });
        });

        test("should handle fetch exceptions", async () => {
            globalFetch.mockImplementationOnce(() => 
                Promise.reject(new Error("Network error"))
            );
            
            const result = await (prismClient as any).fetchData(
                "api",
                "/test-endpoint",
                "POST",
                { test: "data" }
            );
            
            expect(result).toEqual({
                status: 500,
                message: "Network error"
            });
        });

        // Addresses interacted with uniswap v3 & v4 on all chains supported
// https://app.gitbook.com/o/6TiAGJx1zk5l8qGICwUF/s/DqeVX4h920HNCXWhIjVJ/~/changes/5/getting-started/supported-chains
const SAMPLE_ONCHAIN_HISTORY_ADDRESSES_SET = [
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9",
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    "0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf",
    "0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2",
    "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
    "0xedf6066a2b290C185783862C7F4776A2C8077AD1",
    "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    "0x0F797dC7efaEA995bB916f268D919d0a1950eE3C",
    "0xa00F34A632630EFd15223B1968358bA4845bEEC7",
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    "0x541aB7c31A119441eF3575F6973277DE0eF460bd",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493bae0",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf1",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A5",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A6",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A7",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A8",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf2",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf3",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf4",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf5",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf6",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf7",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf8",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493baf9",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493bafa",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493bab0",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493bab1",
    "0x68f6e289ede9b1559aae6bbd0cfaecf72493bab2",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A3",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A4",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A5",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A6",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A7",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A8",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529A9",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529AA",
    "0x8C738F9D0994090cB0dB64b6026f4d415b7529AB"
];
// ... existing code ...


        test("should handle fetch exceptions", async () => {
            let encrypted: string[] = [];
            SAMPLE_ONCHAIN_HISTORY_ADDRESSES_SET.forEach(async (element) => {
                encrypted.push(prismClient.encryptAddress(element));
            });
            console.log(encrypted);
        });
    });
});