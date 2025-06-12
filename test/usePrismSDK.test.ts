import { renderHook, act } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { usePrismSDK } from '../src/usePrismSDK';
import { PrismClient } from '../src/index';
import { setupTestEnv, PUBLISHER_ADDRESS, PUBLISHER_DOMAIN, USER_WALLET, MOCK_JWT_TOKEN, CAMPAIGN_ID } from './setupTestEnv';

setupTestEnv();

// Mock PrismClient methods
vi.mock('../src/index', () => ({
    PrismClient: {
        init: vi.fn(),
        auction: vi.fn(),
        autoAuction: vi.fn(),
        clicks: vi.fn(),
        impressions: vi.fn(),
        resetAuctionState: vi.fn(),
        encryptAddress: vi.fn(),
    }
}));

const mockPrismClient = PrismClient as any;

describe('usePrismSDK Hook', () => {
    const config = {
        publisherAddress: PUBLISHER_ADDRESS,
        publisherDomain: PUBLISHER_DOMAIN
    };

    const mockWinner = {
        jwt_token: MOCK_JWT_TOKEN,
        campaignId: CAMPAIGN_ID,
        bannerIpfsUri: "https://example.com/banner.png",
        url: "https://example.com/campaign-target",
        campaignName: "Test Campaign"
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => usePrismSDK(config));

        expect(result.current.isInitializing).toBe(false);
        expect(result.current.winner).toBeNull();
        expect(result.current.error).toBeNull();
        expect(typeof result.current.init).toBe('function');
        expect(typeof result.current.auction).toBe('function');
        expect(typeof result.current.autoAuction).toBe('function');
        expect(typeof result.current.clicks).toBe('function');
        expect(typeof result.current.impressions).toBe('function');
        expect(typeof result.current.resetAuctionState).toBe('function');
        expect(typeof result.current.encryptAddress).toBe('function');
    });

    describe('init method', () => {
        it('should set isInitializing state during init call', async () => {
            // Use a delayed resolution to test isInitializing state
            let resolveInit: (value: any) => void;
            const initPromise = new Promise(resolve => { resolveInit = resolve; });
            mockPrismClient.init.mockReturnValue(initPromise);
            
            const { result } = renderHook(() => usePrismSDK(config));

            let initCall: Promise<any>;
            
            // Start init call and check isInitializing state
            await act(async () => {
                initCall = result.current.init();
                // Give React a tick to update the state
                await new Promise(resolve => setTimeout(resolve, 0));
            });
            
            // Check that isInitializing is true after React has updated
            expect(result.current.isInitializing).toBe(true);
            
            // Resolve the init promise
            await act(async () => {
                resolveInit!(mockWinner);
                await initCall;
            });

            expect(result.current.isInitializing).toBe(false);
            expect(result.current.winner).toEqual(mockWinner);
            expect(mockPrismClient.init).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                expect.objectContaining({
                    onSuccess: expect.any(Function),
                    onError: expect.any(Function)
                })
            );
        });

        it('should prevent duplicate init calls when already initializing', async () => {
            let resolveInit: (value: any) => void;
            const initPromise = new Promise(resolve => { resolveInit = resolve; });
            mockPrismClient.init.mockReturnValue(initPromise);

            const { result } = renderHook(() => usePrismSDK(config));

            let firstInit: Promise<any>;
            
            await act(async () => {
                firstInit = result.current.init();
                // Give React a tick to update the state
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            // Second init call should return null since isInitializing is true
            let secondInit: Promise<any> = Promise.resolve(null);
            await act(async () => {
                secondInit = result.current.init();
            });

            expect(await secondInit).toBeNull();
            
            await act(async () => {
                resolveInit!(mockWinner);
                await firstInit;
            });
            
            expect(mockPrismClient.init).toHaveBeenCalledTimes(1);
        });

        it('should handle init success callback', async () => {
            const onSuccess = vi.fn();
            mockPrismClient.init.mockImplementation(async (_: any, __: any, options: any) => {
                options?.onSuccess?.(mockWinner);
                return mockWinner;
            });

            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                await result.current.init({ onSuccess });
            });

            expect(result.current.winner).toEqual(mockWinner);
            expect(result.current.isInitializing).toBe(false);
            expect(onSuccess).toHaveBeenCalledWith(mockWinner);
        });

        it('should handle init error callback', async () => {
            const onError = vi.fn();
            const testError = new Error('Init failed');
            mockPrismClient.init.mockImplementation(async (_: any, __: any, options: any) => {
                options?.onError?.(testError);
                throw testError;
            });

            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.init({ onError });
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
            expect(result.current.isInitializing).toBe(false);
            expect(onError).toHaveBeenCalledWith(testError);
        });
    });

    describe('auction method', () => {
        it('should call PrismClient.auction and update state', async () => {
            mockPrismClient.auction.mockResolvedValue(mockWinner);
            const { result } = renderHook(() => usePrismSDK(config));

            let auctionResult: any;
            await act(async () => {
                auctionResult = await result.current.auction(USER_WALLET);
            });

            expect(auctionResult).toEqual(mockWinner);
            expect(result.current.winner).toEqual(mockWinner);
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.auction).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                USER_WALLET,
                undefined
            );
        });

        it('should handle auction errors', async () => {
            const testError = new Error('Auction failed');
            mockPrismClient.auction.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.auction(USER_WALLET);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
        });
    });

    describe('autoAuction method', () => {
        it('should call PrismClient.autoAuction and update state', async () => {
            mockPrismClient.autoAuction.mockResolvedValue(mockWinner);
            const { result } = renderHook(() => usePrismSDK(config));

            let autoAuctionResult: any;
            await act(async () => {
                autoAuctionResult = await result.current.autoAuction(USER_WALLET);
            });

            expect(autoAuctionResult).toEqual(mockWinner);
            expect(result.current.winner).toEqual(mockWinner);
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.autoAuction).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                USER_WALLET,
                undefined
            );
        });

        it('should handle autoAuction errors', async () => {
            const testError = new Error('AutoAuction failed');
            mockPrismClient.autoAuction.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.autoAuction(USER_WALLET);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
        });
    });

    describe('clicks method', () => {
        it('should call PrismClient.clicks', async () => {
            const mockResponse = { status: 'success', message: 'Click recorded' };
            mockPrismClient.clicks.mockResolvedValue(mockResponse);
            const { result } = renderHook(() => usePrismSDK(config));

            let clicksResult: any;
            await act(async () => {
                clicksResult = await result.current.clicks(CAMPAIGN_ID, MOCK_JWT_TOKEN);
            });

            expect(clicksResult).toEqual(mockResponse);
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.clicks).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                CAMPAIGN_ID,
                MOCK_JWT_TOKEN,
                undefined
            );
        });

        it('should handle clicks errors', async () => {
            const testError = new Error('Clicks failed');
            mockPrismClient.clicks.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.clicks(CAMPAIGN_ID, MOCK_JWT_TOKEN);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
        });
    });

    describe('impressions method', () => {
        it('should call PrismClient.impressions', async () => {
            const mockResponse = { status: 'success', message: 'Impression recorded' };
            mockPrismClient.impressions.mockResolvedValue(mockResponse);
            const { result } = renderHook(() => usePrismSDK(config));

            let impressionsResult: any;
            await act(async () => {
                impressionsResult = await result.current.impressions(CAMPAIGN_ID, MOCK_JWT_TOKEN);
            });

            expect(impressionsResult).toEqual(mockResponse);
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.impressions).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                CAMPAIGN_ID,
                MOCK_JWT_TOKEN,
                undefined
            );
        });

        it('should handle impressions errors', async () => {
            const testError = new Error('Impressions failed');
            mockPrismClient.impressions.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.impressions(CAMPAIGN_ID, MOCK_JWT_TOKEN);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
        });
    });

    describe('resetAuctionState method', () => {
        it('should call PrismClient.resetAuctionState and reset local state', () => {
            const { result } = renderHook(() => usePrismSDK(config));

            // Set some state first
            act(() => {
                result.current.resetAuctionState(USER_WALLET);
            });

            expect(result.current.winner).toBeNull();
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.resetAuctionState).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                USER_WALLET
            );
        });
    });

    describe('encryptAddress method', () => {
        it('should call PrismClient.encryptAddress', async () => {
            const encryptedAddress = 'encrypted-address';
            mockPrismClient.encryptAddress.mockResolvedValue(encryptedAddress);
            const { result } = renderHook(() => usePrismSDK(config));

            let encryptResult: any;
            await act(async () => {
                encryptResult = await result.current.encryptAddress(USER_WALLET);
            });

            expect(encryptResult).toBe(encryptedAddress);
            expect(result.current.error).toBeNull();
            expect(mockPrismClient.encryptAddress).toHaveBeenCalledWith(USER_WALLET);
        });

        it('should handle encryptAddress errors', async () => {
            const testError = new Error('Encryption failed');
            mockPrismClient.encryptAddress.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            await act(async () => {
                try {
                    await result.current.encryptAddress(USER_WALLET);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);
        });
    });

    describe('error state management', () => {
        it('should clear error state when making new calls', async () => {
            const testError = new Error('Test error');
            mockPrismClient.auction.mockRejectedValue(testError);
            const { result } = renderHook(() => usePrismSDK(config));

            // First call that fails
            await act(async () => {
                try {
                    await result.current.auction(USER_WALLET);
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toEqual(testError);

            // Second call that succeeds should clear error
            mockPrismClient.auction.mockResolvedValue(mockWinner);
            await act(async () => {
                await result.current.auction(USER_WALLET);
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('options forwarding', () => {
        it('should forward options to PrismClient methods', async () => {
            mockPrismClient.auction.mockResolvedValue(mockWinner);
            const { result } = renderHook(() => usePrismSDK(config));

            const options = { retries: 5, timeout: 15000 };
            await act(async () => {
                await result.current.auction(USER_WALLET, options);
            });

            expect(mockPrismClient.auction).toHaveBeenCalledWith(
                PUBLISHER_ADDRESS,
                PUBLISHER_DOMAIN,
                USER_WALLET,
                options
            );
        });
    });
});