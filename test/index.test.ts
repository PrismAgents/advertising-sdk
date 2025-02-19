
import { PrismClient } from "../src/index"

const API_KEY = "...";
const PUBLISHER_ADDRESS = "0xFa...5F723DC";
const WALLET_ADDRESS = "0xFa21...1BD35F723DC";

test("test", async () => {
    const prismClient = new PrismClient(API_KEY);
    const res = await prismClient.triggerAuction(PUBLISHER_ADDRESS, WALLET_ADDRESS);
    console.log(res);
    expect(res.status).toBe(200);
});