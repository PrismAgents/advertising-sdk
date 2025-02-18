
import {PrismClient} from "prism-sdk"
import assert from "assert";

const PROVIDER_URL = 'https://arbitrum-sepolia.infura.io/v3/<infura-project-id>';
const PUBLISHER_WL_ADDRESS = "<PUBLISHER_WL_ADDRESS>";
const WALLET_ADDRESS = "<WALLET_ADDRESS>";


async function test() {
    const prismClient = new PrismClient(
        PROVIDER_URL,
        PUBLISHER_WL_ADDRESS
    );

    const result = await prismClient.triggerAuction(WALLET_ADDRESS, PUBLISHER_WL_ADDRESS);
    console.log('result::', result);
    assert.ok(result.id, "default-campaign");
}

test().then(() => {
    console.log('done');
});