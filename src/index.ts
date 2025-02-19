import { ethers } from "ethers";
import config from "./config.json";

export class PrismClient {
    apiKey: string;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
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
        
            const response = await fetch(_endpoint, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'Access-Control-Allow-Origin': '*'
                },
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