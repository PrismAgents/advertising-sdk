import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useEffect, useState } from "react";
import { useAccount } from 'wagmi';
import { getEthersSigner } from '../signer';
import styles from '../styles/Home.module.css';
import { wagmiConfig } from '../wagmi';
import { PrismClient } from '../../../src/PrismClient';
import Image from 'next/image';

 const publisherReceiverAddress = '0x....'; // receive % of auction revenue
 const examplePublishingWebsite = 'example.com';

const Home: NextPage = () => {
  const { address } = useAccount()
  const [winner, setWinner] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // New state for loading
  const [error, setError] = useState<any | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);
  const [impressionsCounter, setImpressionsCounter] = useState<number>(0);

  const [prismClient, setPrismClient] = useState<PrismClient | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };


  useEffect(() => {
    
    // init prism Client
    const prismClient = new PrismClient(
      publisherReceiverAddress,
      examplePublishingWebsite
    );

    setPrismClient(prismClient);
    if (address && prismClient) {
      setIsLoading(true);
      console.log('triggering auction');
      prismClient.triggerAuction(address).then((winner: any) => {
        setWinner(winner);
      }).catch((error: any) => {
        setError(error);
        console.error('Error triggering auction:', error);
      }).finally(() => {
        setIsLoading(false); // Stop loading
      });
    }
  }, [address]);

  const handleSearch = () => {
    if (inputValue && prismClient) {
      setIsLoading(true); // Start loading
      prismClient.triggerAuction(inputValue).then((winner: any) => {
        setWinner(winner);
        setImpressionsCounter(prevCount => prevCount + 1);

      }).finally(() => {
        setIsLoading(false); // Stop loading
      });
    }
  };

  const handleLinkClick = () => {
    prismClient && prismClient.handleUserClick(winner.campaign_id).then(() => {
      setClickCount(prevCount => prevCount + 1);
    });
  };

  const sendCompletionFeedback = () => {
    console.log('feedback',winner)
    prismClient && prismClient.sendViewedFeedback(winner.campaign_id);
  }

  useEffect(() => {
    if (winner) {
      setRenderCount(prevCount => prevCount + 1);
    }
  }, [winner]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Prism Client</title>
        <meta
          content="Prism Client"
          name="prism sdk testing client publisher"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>

        <h1 className={styles.title}>
          Prismatic App
        </h1>

        <p className={styles.description}>
          Get started by connecting your wallet.
        </p>

        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange} // Add this line
            className={styles.inputField}
            placeholder="Enter wallet address"
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            Search
          </button>
        </div>
        {isLoading && <div className={styles.loader}></div>} {/* Loader */}


        <ConnectButton />
        <div className={styles.grid}>

          {winner && (
            <a
              className={styles.card}
              href="https://www.berachain.com/"
              target="_blank"
              onClick={handleLinkClick}
            >
              <h2>{winner.campaign_name}</h2>
              <Image
                width={500}
                height={500}
                src={winner.banner_ipfs_uri}
                alt={winner.campaign_name}
                onLoad={() => sendCompletionFeedback()}
              />
            </a>
          )}
        </div>
        <div>
          <p>Link clicked: {clickCount} times</p>
          <p>Image rendered: {renderCount} times</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <a href="https://rainbow.me" rel="noopener noreferrer" target="_blank">
          Made with ⚡ by your frens at Hype
        </a>
      </footer>
    </div>
  );
};

export default Home;