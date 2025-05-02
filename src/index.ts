import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from "./config.json";

/**
 * Response from API endpoints
 */
export interface PrismResponse<T = unknown> {
    status: number;
    message?: string;
    data?: T;
}

/**
 * Parameters for user interaction events
 */
export interface UserInteractionParams {
    publisherAddress: string;
    websiteUrl: string;
    campaignId: string | number;
}

/**
 * Source for API endpoints
 */
type ApiSource = "enclave" | "api";

/**
 * HTTP methods
 */
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class PrismClient {
    private readonly apiKey: string;

    constructor(
        apiKey: string
    ) {
        this.apiKey = apiKey;
    }

    /**
     * Encrypts an Ethereum address using the SDK's public key
     * @param address Ethereum address to encrypt
     * @returns Base64 encoded encrypted address
     */
    public encryptAddress(address: string): string {
        try {
            const pemFilePath = path.resolve(__dirname, 'sdk-kms.pem');
            // 1. Read the PEM public key directly using the resolved path
            const publicKeyPem = fs.readFileSync(pemFilePath, 'utf8');
            
            // 2. Create public key object
            const publicKey = crypto.createPublicKey({
                key: publicKeyPem,
                format: 'pem',
                type: 'spki',
            });
            
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                Buffer.from(address)
            );
            
            return encrypted.toString('base64');
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }


    /** 
     * Call AWS Nitro Enclave to solve auction for a user's attention
     * @param publisher Publisher's Ethereum address
     * @param publisherDomain Publisher's domain
     * @param wallet User's Ethereum address
     * @returns Auction result
     */
    public async auction(
        publisher: string, 
        publisherDomain: string, 
        wallet: string
    ): Promise<PrismResponse> {
        return this.fetchData(
            "enclave", 
            "/auction", 
            "POST",
            {   
                publisher_address: publisher, 
                user_address: this.encryptAddress(wallet),
                publisher_domain: publisherDomain
            }
        );
    }

    /**
     * Handles user click event
     * @param publisher Publisher's Ethereum address
     * @param websiteUrl Website URL where click occurred
     * @param winnerId Campaign ID that was clicked
     * @returns Click handling result
     */
    public async clicks(
        publisher: string, 
        websiteUrl: string, 
        winnerId: string | number
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisher,
            websiteUrl: websiteUrl,
            campaignId: winnerId
        };

        return this.fetchData("api", "/click", "POST", body);
    }

    /**
     * Sends impression feedback
     * @param publisher Publisher's Ethereum address
     * @param websiteUrl Website URL where impression occurred
     * @param winnerId Campaign ID that was viewed
     * @returns Impression feedback result
     */
    public async impressions(
        publisher: string, 
        websiteUrl: string, 
        winnerId: string | number
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisher,
            websiteUrl: websiteUrl,
            campaignId: winnerId
        };

        return this.fetchData("api", "/impressions", "POST", body);
    }

    /**
     * Fetch data from Prism API endpoints
     * @param source API source ("enclave" or "api")
     * @param endpoint API endpoint
     * @param method HTTP method
     * @param body Request body
     * @returns API response
     */
    private async fetchData(
        source: ApiSource, 
        endpoint: string, 
        method: HttpMethod, 
        body: unknown
    ): Promise<PrismResponse> {
        const baseUrl = source === "enclave" 
            ? config["prism-enclave-url"] 
            : config["prism-api-url"];
        
        const url = `${baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(body),
            });
            
            if (!response.ok) {
                const errorMessage = await response.text();
                return { 
                    status: response.status, 
                    message: `HTTP error! status: ${response.status}, message: ${errorMessage}` 
                };
            }
            
            const data = await response.json();
            return {
                status: response.status,
                data
            };
        } catch (error) {
            console.error(`Error with fetch operation:`, url, error);
            return { 
                status: 500, 
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
}