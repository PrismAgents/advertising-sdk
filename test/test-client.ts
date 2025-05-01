// Using require instead of import to work with ts-node
const { PrismClient } = require("../dist/index");

// Configuration
const API_KEY = "test-api-key"; // Replace with your actual API key for real testing
const PUBLISHER_ADDRESS = "0xFa000000000000000000000000005F723DC";
const PUBLISHER_DOMAIN = "example.com";
const WEBSITE_URL = "https://example.com/article";
const USER_WALLET = "0xFa21000000000000000000000001BD35F723DC";
const CAMPAIGN_ID = "campaign-123";

// Mock global fetch for testing
const originalFetch = global.fetch;
global.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  console.log(`Fetch request to: ${url.toString()}`);
  if (options) {
    console.log(`Request headers:`, options.headers);
    console.log(`Request body:`, options.body);
  }
  
  // Create a Response object that matches the expected interface
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ 'Content-Type': 'application/json' }),
    redirected: false,
    type: 'basic' as ResponseType,
    url: url.toString(),
    json: async () => ({ 
      success: true, 
      mock: true,
      timestamp: new Date().toISOString(),
      endpoint: url.toString()
    }),
    text: async () => "Success",
    body: null,
    bodyUsed: false,
    clone: function() { return this; },
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([]),
    formData: async () => new FormData(),
    // Add other required methods if needed
  } as Response);
};

async function runTests() {
  console.log("Initializing PrismClient...");
  const client = new PrismClient(API_KEY);
  
  try {
    // Test auction function
    console.log("\n1. Testing auction function...");
    try {
      const auctionResult = await client.auction(
        PUBLISHER_ADDRESS,
        PUBLISHER_DOMAIN,
        USER_WALLET
      );
      console.log("Auction result:", JSON.stringify(auctionResult, null, 2));
    } catch (error: any) {
      console.error("Auction test failed:", error.message || error);
    }
    
    // Test clicks function
    console.log("\n2. Testing clicks function...");
    try {
      const clickResult = await client.clicks(
        PUBLISHER_ADDRESS,
        WEBSITE_URL,
        CAMPAIGN_ID
      );
      console.log("Click result:", JSON.stringify(clickResult, null, 2));
    } catch (error: any) {
      console.error("Clicks test failed:", error.message || error);
    }
    
    // Test impressions function
    console.log("\n3. Testing impressions function...");
    try {
      const impressionResult = await client.impressions(
        PUBLISHER_ADDRESS,
        WEBSITE_URL,
        CAMPAIGN_ID
      );
      console.log("Impression result:", JSON.stringify(impressionResult, null, 2));
    } catch (error: any) {
      console.error("Impressions test failed:", error.message || error);
    }
    
    console.log("\nAll tests completed!");
  } catch (error: any) {
    console.error("Error during tests:", error.message || error);
  }
}

// Run the tests
runTests().finally(() => {
  // Restore original fetch
  global.fetch = originalFetch;
});