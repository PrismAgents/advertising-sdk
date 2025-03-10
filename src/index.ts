import { ethers } from "ethers";
import config from "./config.json";

export class PrismClient {
    apiKey: string;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async triggerAuction(publisher: string, wallet: string, websiteUrl: string): Promise<any> {
        return this.fetchData(`/auction`, 'POST', { publisher, wallet, websiteUrl });
    }

    async handleUserClick(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        return this.fetchData(`/publisher/click`, 'POST', { publisher, websiteUrl, winnerId });
    }

    async sendViewedFeedback(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        return this.fetchData(`/publisher/impressions`, 'POST', { publisher, websiteUrl, winnerId });
    }

    async getAllPublisherStatsForOwnerByWebsiteUrl(publisher: string, websiteUrl: string): Promise<any> {
        return this.fetchData(`/publisher/stats`, 'GET', { publisher, websiteUrl });
    }

    async fetchData(endpoint: string, method: string, body: any): Promise<any> {
        const _endpoint = `${config["prism-api"]}${endpoint}`;
        try {

            const response = await fetch(_endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(body),
            });
            if (response.status !== 200) {
                const errorMessage = await response.text(); // Capture the error message from the server
                return { status: response.status, message: `HTTP error! status: ${response.status}, message: ${errorMessage}` }; // Include the error message
            }
            return await response.json();
        } catch (error) {
            console.error(`Error with fetch operation:`, _endpoint, error);
            return error;
        }
    }


}