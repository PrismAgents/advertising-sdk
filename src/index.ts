import config from "./config.json";


/**
 * 
 * {
    "status": "success",
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjs2N2NhY2RkNGUzMzc4MzQ3NjgyNDUxNTA1MTkxM2MyM2VjMGVlNjk5YTM0ZWI0MDZmMjI0MDA5MmFhYzRhZCIsInRpbWVzdGFtcCI6IjIwMjUtMDUtMDZUMTI6NDI6MzcuMTU1MzYwKzAwOjAwIiwiZXhwIjoxNzQ2NTM1NjU3fQ.NHKUNJ0vTnuSpyU09X_cnwxMy5c6K3NvkHTN4ZjcU7U",
    "data": {
        "campaignId": "0xcb67cacdd4e33783476824515051913c23ec0ee699a34eb406f2240092aac4ad",
        "bannerIpfsUri": "https://aqua-holy-rhinoceros-561.mypinata.cloud/ipfs/bafybeihra7bkupgkuj7t6us2ocsn7ibttjzgdcnzxbnglnot4ks54jvf4y/Screenshot%202025-04-30%20at%2011.55.32%E2%80%AFAM.png",
        "url": "https://www.prismprotocol.xyz/",
        "campaignName": "TeddyBird"
    }
}
 */

// Key to encrypt user's address for anonymous advertising
const SDK_KMS_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuJxeNGaN0dT35BkiRTEp
Gc01x12qPKW0h5f5EZs5UuW0d46GJe3Qusve34RaPbY2ZGBQ0ds0nghnZZwy5IBx
LQxAx5Pr6QP8NQvm9so69OfW0nAK4f5oN7tvQwS8y0RcBEKf3zP3Zt1MS4mJrTRX
h/OpchAPCTDD0faKuhUjjJQ+i399onzmdICmmaYAP6ltw050VGgOR5pjnHSgJk5K
q0iF2HJv5U2Zgxn7d1pGzM/VNpGY8rjZSXsCwx8GCp4OZOI381k7eyzDr2nEYm7n
/qH3r+m+2PD6jbJJp0XQGz13fwUyGY2QyFBsLvPWQ8Qr/SSAjS65f3UcPdTtOy0C
rwIDAQAB
-----END PUBLIC KEY-----`;

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
     * @returns Auction result
     */
    public static async auction(
        publisher: string, 
        publisherDomain: string, 
        wallet: string
    ): Promise<PrismResponse> {
        const encryptedAddress = await this.encryptAddress(wallet);
        return this.fetchData(
            "enclave", 
            "/auction", 
            "POST",
            null,
            {   
                publisher_address: publisher, 
                user_address: encryptedAddress,
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
    public static async clicks(
        publisher: string, 
        websiteUrl: string, 
        winnerId: string,
        jwtToken: string,
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisher,
            websiteUrl: websiteUrl,
            campaignId: winnerId
        };

        return this.fetchData("api", "/click", "POST", jwtToken, body);
    }

    /**
     * Sends impression feedback
     * @param publisher Publisher's Ethereum address
     * @param websiteUrl Website URL where impression occurred
     * @param winnerId Campaign ID that was viewed
     * @returns Impression feedback result
     */
    public static async impressions(
        publisher: string, 
        websiteUrl: string, 
        winnerId: string,
        jwtToken: string,
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisher,
            websiteUrl: websiteUrl,
            campaignId: winnerId
        };

        return this.fetchData("api", "/impressions", "POST", jwtToken, body);
    }

    /**
     * Fetch data from Prism API endpoints
     * @param source API source ("enclave" or "api")
     * @param endpoint API endpoint
     * @param method HTTP method
     * @param body Request body
     * @returns API response
     */
    private static async fetchData(
        source: ApiSource, 
        endpoint: string, 
        method: HttpMethod, 
        jwtToken: string | null,
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
                    ...(jwtToken ? {'Authorization': `Bearer ${jwtToken}`} : {}),
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