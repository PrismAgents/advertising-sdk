import { ethers } from "ethers";
import accountingAbi from "./abi/PrismAccounting.json";
import dotenv from 'dotenv';
dotenv.config();

class Web3Api {
    public accountingContract: any;
    public url: any;
    constructor() {
        this.url = process.env.BARTIO_RPC_URL!;
        const provider = new ethers.JsonRpcProvider(this.url);
        this.accountingContract = new ethers.Contract(process.env.PRISM_ACCOUNTING_CONTRACT_ADDRESS!, accountingAbi, provider);
    }
}

class Web2Api {
    public url: any;
    constructor() {
        this.url = `${process.env.PRISM_API_URL}/api`;
    }

    async triggerAuction(publisher: string, wallet: string): Promise<any> {
        console.log('triggerAuction', publisher, wallet);
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
        try {
            const response = await fetch(`${this.url}${endpoint}`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error with fetch operation:`, endpoint, error);
            return error;
        }
    }
}

export class PrismClient {
    public web3Api: Web3Api;
    public web2Api: Web2Api;
    public publisherAddress;
    public websiteUrl;

    constructor(publisherAddress: string, websiteUrl: string) {
        this.web3Api = new Web3Api();
        this.web2Api = new Web2Api();

        this.web3Api.accountingContract.isPublisher(publisherAddress).then((isPublisher: boolean) => {
            if (!isPublisher) throw new Error('Publisher not whitelisted, please register on app.prismprotocol.xyz/publishers');
            // this.web2Api.getAllPublisherStatsForOwnerByWebsiteUrl(publisherAddress, websiteUrl).then((stats: any) => {
            //     if (stats.length < 1) throw new Error('Website URL not found, please register on app.prismprotocol.xyz/publishers');
            // });
        });
        this.publisherAddress = publisherAddress;
        this.websiteUrl = websiteUrl;
    }

    async triggerAuction(wallet: string): Promise<any> {
        console.log('triggerAuction publisherAddress', this.publisherAddress, 'wallet', wallet);
        return this.web2Api.triggerAuction(this.publisherAddress, wallet);
    }

    async handleUserClick(winnerId: string): Promise<any> {
        return this.web2Api.handleUserClick(this.publisherAddress, this.websiteUrl, winnerId);
    }

    async sendViewedFeedback(campaignId: string): Promise<any> {
        return this.web2Api.sendViewedFeedback(this.publisherAddress, this.websiteUrl, campaignId);
    }
}