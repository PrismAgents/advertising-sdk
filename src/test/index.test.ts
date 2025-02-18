
import { PrismClient } from "prism-sdk"
import assert from "assert";




async function test() {
    const PROVIDER_URL = 'https://arbitrum-sepolia.infura.io/v3/<infura-project-id>';
    const PUBLISHER_WL_ADDRESS = "<PUBLISHER_WL_ADDRESS>";
    const WALLET_ADDRESS = "<WALLET_ADDRESS>";
    const prismClient = new PrismClient(
        PROVIDER_URL,
        PUBLISHER_WL_ADDRESS
    );

    const result = await prismClient.triggerAuction(WALLET_ADDRESS, PUBLISHER_WL_ADDRESS);
    assert.ok(result.id, "default-campaign");
}

test().then(() => {
    console.log('done');
});