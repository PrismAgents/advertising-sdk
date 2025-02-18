import { ethers } from "ethers";
import accountingAbi from "./abi/PrismAccounting.json";
import config from "./config.json";


export class PrismClient {
    prismApiUrl: string;
    constructor(JsonRpcProvider: string, publisherAddress: string) {
        const accountingContract = new ethers.Contract(
            config["prism-contract"],
            accountingAbi,
            new ethers.JsonRpcProvider(JsonRpcProvider)
        );

        accountingContract.isPublisher(publisherAddress).then((isPublisher: boolean) => {
            if (!isPublisher) throw new Error('Publisher not whitelisted, please register on app.prismprotocol.xyz/publishers');
        });
    }

    async triggerAuction(publisher: string, wallet: string): Promise<any> {
        return this.fetchData(`/auction/${publisher}/${wallet}`, 'POST');
    }

    async handleUserClick(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        return this.fetchData(`/publisher/click/${publisher}/${websiteUrl}/${winnerId}`, 'POST');
    }

    async sendViewedFeedback(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        return this.fetchData(`/publisher/impressions/${publisher}/${websiteUrl}/${winnerId}`, 'POST');
    }

    async getAllPublisherStatsForOwnerByWebsiteUrl(publisher: string, websiteUrl: string): Promise<any> {
        return this.fetchData(`/publisher/${publisher}/${websiteUrl}`, 'GET');
    }

    async fetchData(endpoint: string, method: string, body?: any): Promise<any> {
        const _endpoint = `${config["prism-api"]}${endpoint}`;
        try {
           
            console.log('endpoint::', _endpoint);
            const response = await fetch(_endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error with fetch operation:`, _endpoint, error);
            return error;
        }
    }


}