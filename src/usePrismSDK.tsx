import { useState, useCallback } from 'react';

// Debug logging for React hooks
if (typeof useState === 'undefined' || useState === null) {
    console.error('usePrismSDK: useState is not available. This usually indicates a React version mismatch or bundling issue.');
    console.log('React import check:', { useState, useCallback });
}
import { 
    PrismClient, 
    PrismWinner, 
    PrismResponse, 
    PrismInitOptions, 
    PrismAuctionOptions, 
    PrismTrackingOptions 
} from './index';

export interface UsePrismSDKConfig {
    publisherAddress: string;
    publisherDomain: string;
}

export interface UsePrismSDKReturn {
    isInitializing: boolean;
    winner: PrismWinner | null;
    error: Error | null;
    init: (options?: PrismInitOptions) => Promise<PrismWinner | null>;
    auction: (
        wallet: string,
        options?: PrismAuctionOptions
    ) => Promise<PrismWinner>;
    autoAuction: (
        connectedWallet?: string,
        options?: PrismAuctionOptions
    ) => Promise<PrismWinner>;
    clicks: (
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ) => Promise<PrismResponse>;
    impressions: (
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ) => Promise<PrismResponse>;
    resetAuctionState: (walletAddress?: string) => void;
    encryptAddress: (address: string) => Promise<string>;
}

export const usePrismSDK = ({ publisherAddress, publisherDomain }: UsePrismSDKConfig): UsePrismSDKReturn => {
    const [isInitializing, setIsInitializing] = useState(false);
    const [winner, setWinner] = useState<PrismWinner | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const init = useCallback(async (
        options?: PrismInitOptions
    ): Promise<PrismWinner | null> => {
        if (isInitializing) {
            console.log('usePrismSDK: init already in progress, skipping duplicate call');
            return null;
        }

        setIsInitializing(true);
        setError(null);

        try {
            const result = await PrismClient.init(publisherAddress, publisherDomain, {
                ...options,
                onSuccess: (winner: PrismWinner) => {
                    setWinner(winner);
                    setIsInitializing(false);
                    options?.onSuccess?.(winner);
                },
                onError: (err: Error) => {
                    setError(err);
                    setIsInitializing(false);
                    options?.onError?.(err);
                }
            });

            if (result) {
                setWinner(result);
            }
            setIsInitializing(false);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            setIsInitializing(false);
            throw error;
        }
    }, [isInitializing, publisherAddress, publisherDomain]);

    const auction = useCallback(async (
        wallet: string,
        options?: PrismAuctionOptions
    ): Promise<PrismWinner> => {
        setError(null);
        try {
            const result = await PrismClient.auction(publisherAddress, publisherDomain, wallet, options);
            setWinner(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        }
    }, [publisherAddress, publisherDomain]);

    const autoAuction = useCallback(async (
        connectedWallet?: string,
        options?: PrismAuctionOptions
    ): Promise<PrismWinner> => {
        setError(null);
        try {
            const result = await PrismClient.autoAuction(publisherAddress, publisherDomain, connectedWallet, options);
            setWinner(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        }
    }, [publisherAddress, publisherDomain]);

    const clicks = useCallback(async (
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ): Promise<PrismResponse> => {
        setError(null);
        try {
            return await PrismClient.clicks(publisherAddress, publisherDomain, campaignId, jwt, options);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        }
    }, [publisherAddress, publisherDomain]);

    const impressions = useCallback(async (
        campaignId: string,
        jwt: string,
        options?: PrismTrackingOptions
    ): Promise<PrismResponse> => {
        setError(null);
        try {
            return await PrismClient.impressions(publisherAddress, publisherDomain, campaignId, jwt, options);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        }
    }, [publisherAddress, publisherDomain]);

    const resetAuctionState = useCallback((
        walletAddress?: string
    ): void => {
        PrismClient.resetAuctionState(publisherAddress, publisherDomain, walletAddress);
        setWinner(null);
        setError(null);
    }, [publisherAddress, publisherDomain]);

    const encryptAddress = useCallback(async (address: string): Promise<string> => {
        setError(null);
        try {
            return await PrismClient.encryptAddress(address);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        }
    }, []);

    return {
        isInitializing,
        winner,
        error,
        init,
        auction,
        autoAuction,
        clicks,
        impressions,
        resetAuctionState,
        encryptAddress
    };
};

export default usePrismSDK;