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
    ): Promise<PrismWinner> {
        const encryptedAddress = await this.encryptAddress(wallet);
        const response : any = await this.fetchData(
            "enclave", 
            "/auction",
            null,
            {   
                publisher_address: publisher, 
                user_address: encryptedAddress,
                publisher_domain: publisherDomain
            }
        );
        return {
            bannerIpfsUri: response.data.bannerIpfsUri,
            campaignId: response.data.campaignId,
            campaignName: response.data.campaignName,
            jwt_token: response.data.jwt_token,
            url: response.data.url
        }

    }

    /**
     * Handles user click event
     * @param publisher Publisher's Ethereum address
     * @param websiteUrl Website URL where click occurred
     * @param campaignId Campaign ID that was clicked
     * @returns Click handling result
     */
    public static async clicks(
        publisherAddress: string, 
        websiteUrl: string, 
        campaignId: string,
        jwt: string,
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisherAddress,
            websiteUrl: websiteUrl,
            campaignId: campaignId
        };

        return this.fetchData("api", "/clicks", jwt, body);
    }

    /**
     * Sends impression feedback
     * @param publisher Publisher's Ethereum address
     * @param websiteUrl Website URL where impression occurred
     * @param campaignId Campaign ID that was viewed
     * @returns Impression feedback result
     */
    public static async impressions(
        publisherAddress: string, 
        websiteUrl: string, 
        campaignId: string,
        jwt: string,
    ): Promise<PrismResponse> {
        const body: UserInteractionParams = {
            publisherAddress: publisherAddress,
            websiteUrl: websiteUrl,
            campaignId: campaignId
        };

        return this.fetchData("api", "/impressions", jwt, body);
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
        jwtToken: string | null,
        body: unknown
    ): Promise<PrismResponse> {
        const baseUrl = source === "enclave" 
            ? config["prism-enclave-url"] 
            : config["prism-api-url"];
        
        const url = `${baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(jwtToken ? {'Authorization': `${jwtToken}`} : {}),
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
                data: data.data
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