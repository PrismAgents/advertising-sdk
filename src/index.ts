import { ethers } from "ethers";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from "./config.json";

export class PrismClient {
    apiKey: string;
    constructor(
        pemFilePath: string,
        apiKey: string
    ) {
        this.apiKey = apiKey;
    }

    encryptAddress(address: string) {
        try {
            console.log("Starting encryption process...");
    
            const pemFilePath = path.resolve(__dirname, 'sdk-kms.pem');
            // 1. Read the PEM public key directly using the resolved path
            const publicKeyPem = fs.readFileSync(pemFilePath, 'utf8');
            console.log("Public key loaded from PEM file");
    
            // 2. Create public key object
            const publicKey = crypto.createPublicKey({
                key: publicKeyPem,
                format: 'pem',
                type: 'spki',
            });
    
            console.log("Encrypting...");
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                Buffer.from(address)
            );
    
            console.log("Encryption completed");
            return encrypted.toString('base64');
    
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }

    async triggerAuction(publisher: string, publisherDomain: string, wallet: string): Promise<any> {
        return this.fetchData(
                "enclave", 
                `/auction`, 'POST',
                {   
                    publisher_address: publisher, 
                    user_address: this.encryptAddress(wallet),
                    publisher_domain: publisherDomain
                }
            );
    }

    async handleUserClick(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        const body = {
            publisher:publisher,
            websiteUrl:websiteUrl,
            winnerId:winnerId
        }

        console.log('SDK -> handleUserClick',body);
        return this.fetchData("api", `/click`, 'POST', body);
    }

    async sendViewedFeedback(publisher: string, websiteUrl: string, winnerId: any): Promise<any> {
        return this.fetchData("api", `/impressions`, 'POST', { publisher:publisher, websiteUrl:websiteUrl, winnerId:winnerId });
    }

    async fetchData(source: "enclave" | "api", endpoint: string, method: string, body: any): Promise<any> {
        const _endpoint = `${source === "enclave" ? config["prism-enclave-url"] : config["prism-api-url"]}${endpoint}`;
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