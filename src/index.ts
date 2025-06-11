import config from "./config.json";


/**
 * Example response from enclave
 * {
    "status": "success",
    "jwt_token": "2NhY2RS...NvkHTN4ZjcU7U",
    "data": {
        "campaignId": "0xcb67cac...699a34eb406f2240092aac4ad",
        "bannerIpfsUri": "https://myBanner..../ipfs/bafybeihrazgdcnzxbnglnot4ks54jvf4y.png",
        "url": "https://www.prismprotocol.xyz/",
        "campaignName": "TeddyBird"
    }
}
 */

// Key to encrypt user's address for anonymous advertising
// Only enclave access decryption key
const SDK_KMS_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuJxeNGaN0dT35BkiRTEp
Gc01x12qPKW0h5f5EZs5UuW0d46GJe3Qusve34RaPbY2ZGBQ0ds0nghnZZwy5IBx
LQxAx5Pr6QP8NQvm9so69OfW0nAK4f5oN7tvQwS8y0RcBEKf3zP3Zt1MS4mJrTRX
h/OpchAPCTDD0faKuhUjjJQ+i399onzmdICmmaYAP6ltw050VGgOR5pjnHSgJk5K
q0iF2HJv5U2Zgxn7d1pGzM/VNpGY8rjZSXsCwx8GCp4OZOI381k7eyzDr2nEYm7n
/qH3r+m+2PD6jbJJp0XQGz13fwUyGY2QyFBsLvPWQ8Qr/SSAjS65f3UcPdTtOy0C
rwIDAQAB
-----END PUBLIC KEY-----`;
 
export interface PrismWinner {
    bannerIpfsUri: string;
    campaignId: string;
    campaignName: string;
    jwt_token: string;
    url: string;
}

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
 * Configuration options for requests
 */
export interface PrismRequestOptions {
    retries?: number;
    timeout?: number;
    onError?: (error: Error) => void;
}

/**
 * Configuration options for auction methods
 */
export interface PrismAuctionOptions extends PrismRequestOptions {
    onSuccess?: (winner: PrismWinner) => void;
}

/**
 * Configuration options for init method
 */
export interface PrismInitOptions extends PrismAuctionOptions {
    connectedWallet?: string;
    autoTrigger?: boolean;
    walletDetectionTimeout?: number;
    walletDetectionInterval?: number;
    getWalletAddress?: () => string | undefined | Promise<string | undefined>;
}

/**
 * Configuration options for tracking methods
 */
export interface PrismTrackingOptions extends PrismRequestOptions {
    onSuccess?: (response: PrismResponse) => void;
}


export class PrismClient {
    
    /**
     * Fallback wallet address for unconnected users
     * Uses Ethereum zero address which backend recognizes as unconnected state
     */
    private static readonly UNCONNECTED_WALLET_ADDRESS = "0x0000000000000000000000000000000000000000";
    
    /**
     * Default configuration values
     */
    private static readonly DEFAULT_CONFIG = {
        retries: 3,
        timeout: 10000, // 10 seconds
        walletDetectionTimeout: 1000, // 3 seconds to wait for wallet
        walletDetectionInterval: 100, // Check every 100ms
    };

    /**
     * Automatically triggers auction on page load with fallback for unconnected users
     * @param publisherAddress Publisher's Ethereum address
     * @param publisherDomain Publisher's domain
     * @param connectedWallet Optional connected wallet address, falls back to unconnected address
     * @param options Configuration options including error handling
     * @returns Promise<PrismWinner> Auction result
     */
    public static async autoAuction(
        publisherAddress: string,
        publisherDomain: string,
        connectedWallet?: string,
        options?: PrismAuctionOptions
    ): Promise<PrismWinner> {
        try {
            const walletToUse = connectedWallet || this.UNCONNECTED_WALLET_ADDRESS;
            // Don't pass callbacks to avoid double-calling
            const auctionOptions = options ? { ...options, onSuccess: undefined, onError: undefined } : undefined;
            const result = await this.auction(publisherAddress, publisherDomain, walletToUse, auctionOptions);
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            options?.onError?.(err);
            throw err;
        }
    }

    /**
     * Retry helper for API calls
     */
    private static async withRetry<T>(
        operation: () => Promise<T>,
        retries: number = this.DEFAULT_CONFIG.retries
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt === retries) {
                    throw lastError;
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError!;
    }

    /**
     * Waits for wallet address to be available with configurable timeout
     * @param getWalletAddress Function to get wallet address
     * @param timeout Maximum time to wait in milliseconds
     * @param interval Check interval in milliseconds
     * @returns Promise<string | undefined> Wallet address or undefined if timeout
     */
    private static async waitForWallet(
        getWalletAddress: () => string | undefined | Promise<string | undefined>,
        timeout: number = this.DEFAULT_CONFIG.walletDetectionTimeout,
        interval: number = this.DEFAULT_CONFIG.walletDetectionInterval
    ): Promise<string | undefined> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const address = await getWalletAddress();
                if (address && address !== this.UNCONNECTED_WALLET_ADDRESS) {
                    return address;
                }
            } catch (error) {
                // Ignore errors during wallet detection
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        return undefined;
    }

    /**
     * Initialize Prism ads automatically when page loads with smart wallet detection
     * This function should be called immediately when the SDK is loaded
     * Waits for wallet connection before proceeding, with fallback to unconnected state
     * @param publisherAddress Publisher's Ethereum address
     * @param publisherDomain Publisher's domain
     * @param options Configuration options including wallet detection settings
     */
    public static async init(
        publisherAddress: string,
        publisherDomain: string,
        options: PrismInitOptions = {}
    ): Promise<PrismWinner | null> {
        const { 
            connectedWallet, 
            autoTrigger = true, 
            walletDetectionTimeout = this.DEFAULT_CONFIG.walletDetectionTimeout,
            walletDetectionInterval = this.DEFAULT_CONFIG.walletDetectionInterval,
            getWalletAddress,
            onSuccess, 
            onError 
        } = options;
        
        if (!autoTrigger) {
            return null;
        }

        try {
            let walletToUse = connectedWallet;
            
            // If no explicit wallet provided but we have a getter function, wait for wallet
            if (!walletToUse && getWalletAddress) {
                walletToUse = await this.waitForWallet(
                    getWalletAddress, 
                    walletDetectionTimeout, 
                    walletDetectionInterval
                );
            }

            const auctionOptions = {
                ...options,
                onSuccess: undefined, // Avoid double-calling callbacks
                onError: undefined
            };

            const winner = await this.autoAuction(publisherAddress, publisherDomain, walletToUse, auctionOptions);
            onSuccess?.(winner);
            return winner;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            return null;
        }
    }

    /**
     * Encrypts an Ethereum address using the SDK's public key
     * @param address Ethereum address to encrypt
     * @returns Base64 encoded encrypted address
     */

    public static async encryptAddress(address: string): Promise<string> {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(address);
    
          // Convert PEM to ArrayBuffer
          const pem = SDK_KMS_PUBLIC_KEY_PEM
            .replace(/-----BEGIN PUBLIC KEY-----/, '')
            .replace(/-----END PUBLIC KEY-----/, '')
            .replace(/\s/g, '');
          const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    
          // Import the public key
          const publicKey = await window.crypto.subtle.importKey(
            'spki',
            binaryDer.buffer,
            {
              name: 'RSA-OAEP',
              hash: 'SHA-256',
            },
            false,
            ['encrypt']
          );
    
          // Encrypt the address
          const encrypted = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            data
          );
    
          return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        } catch (error) {
          console.error('Encryption error:', error);
          throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }


    /** 
     * Call AWS Nitro Enclave to solve auction for a user's attention
     * @param publisher Publisher's Ethereum address
     * @param publisherDomain Publisher's domain
     * @param wallet User's Ethereum address
     * @param options Configuration options including error handling
     * @returns Auction result
     */
    public static async auction(
        publisher: string, 
        publisherDomain: string, 
        wallet: string,
        options?: PrismAuctionOptions
    ): Promise<PrismWinner> {
        try {
            const result = await this.withRetry(async () => {
                const encryptedAddress = await this.encryptAddress(wallet);
                const response : any = await this.fetchData(
                    "enclave", 
                    "/auction",
                    null,
                    {   
                        publisher_address: publisher, 
                        user_address: encryptedAddress,
                        publisher_domain: publisherDomain
                    },
                    options
                );
                return {
                    bannerIpfsUri: response.data.bannerIpfsUri,
                    campaignId: response.data.campaignId,
                    campaignName: response.data.campaignName,
                    jwt_token: response.data.jwt_token,
                    url: response.data.url
                };
            }, options?.retries);
            
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            options?.onError?.(err);
            throw err;
        }
    }

    /**
     * Handles user click event
     * @param publisherAddress Publisher's Ethereum address
     * @param websiteUrl Website URL where click occurred
     * @param campaignId Campaign ID that was clicked
     * @param jwt JWT token from auction
     * @param options Configuration options including error handling
     * @returns Click handling result
     */
    public static async clicks(
        publisherAddress: string, 
        websiteUrl: string, 
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ): Promise<PrismResponse> {
        try {
            const result = await this.withRetry(async () => {
                const body: UserInteractionParams = {
                    publisherAddress: publisherAddress,
                    websiteUrl: websiteUrl,
                    campaignId: campaignId
                };
                return this.fetchData("api", "/clicks", jwt, body, options);
            }, options?.retries);
            
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            options?.onError?.(err);
            throw err;
        }
    }

    /**
     * Sends impression feedback
     * @param publisherAddress Publisher's Ethereum address
     * @param websiteUrl Website URL where impression occurred
     * @param campaignId Campaign ID that was viewed
     * @param jwt JWT token from auction
     * @param options Configuration options including error handling
     * @returns Impression feedback result
     */
    public static async impressions(
        publisherAddress: string, 
        websiteUrl: string, 
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ): Promise<PrismResponse> {
        try {
            const result = await this.withRetry(async () => {
                const body: UserInteractionParams = {
                    publisherAddress: publisherAddress,
                    websiteUrl: websiteUrl,
                    campaignId: campaignId
                };
                return this.fetchData("api", "/impressions", jwt, body, options);
            }, options?.retries);
            
            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            options?.onError?.(err);
            throw err;
        }
    }

    /**
     * Fetch data from Prism API endpoints with timeout support
     * @param source API source ("enclave" or "api")
     * @param endpoint API endpoint
     * @param jwtToken JWT token for authentication
     * @param body Request body
     * @param options Request options including timeout
     * @returns API response
     */
    private static async fetchData(
        source: ApiSource, 
        endpoint: string, 
        jwtToken: string | null,
        body: unknown,
        options?: PrismRequestOptions
    ): Promise<PrismResponse> {
        const baseUrl = source === "enclave" 
            ? config["prism-enclave-url"] 
            : config["prism-api-url"];
        
        const url = `${baseUrl}${endpoint}`;
        const timeout = options?.timeout || this.DEFAULT_CONFIG.timeout;
        
        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(jwtToken ? {'Authorization': `${jwtToken}`} : {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
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
                data: data.data
            };
        } catch (error) {
            console.error(`Error with fetch operation:`, url, error);
            
            // Handle timeout specifically
            if (error instanceof Error && error.name === 'AbortError') {
                return { 
                    status: 408, 
                    message: `Request timeout after ${timeout}ms`
                };
            }
            
            return { 
                status: 500, 
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
}