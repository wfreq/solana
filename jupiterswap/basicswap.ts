import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import * as fs from 'fs';


// It is recommended that you use your own RPC endpoint.
// This RPC endpoint is only for demonstration purposes so that this example will run.
const connection = new Connection('https://api.mainnet-beta.solana.com');

//const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || '')));

const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./keypair.json', 'utf-8'))));

async function swap() {
    try {
        // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
        const quoteResponse = await (
            await fetch('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=100')
        ).json();
        
        console.log('Quote Response:', quoteResponse);




        /////
        const response = await (
            await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true, // allow dynamic compute limit instead of max 1,400,000
                    // custom priority fee
                      prioritizationFeeLamports: {
                      priorityLevelWithMaxLamports: {
                        maxLamports: 1000000,
                        priorityLevel: "veryHigh" // If you want to land transaction fast, set this to use `veryHigh`. You will pay on average higher priority fee.
                      }
                    }
                })
            })
        ).json();

        console.log('Swap Response:', response);

        if (!response.swapTransaction) {
            throw new Error(`No swap transaction in response: ${JSON.stringify(response)}`);
        }

        const swapTransactionBuf = Buffer.from(response.swapTransaction, 'base64');
        var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        console.log(transaction);

        // sign the transaction
        transaction.sign([wallet]);

        // get the latest block hash
        const latestBlockHash = await connection.getLatestBlockhash();

        // Execute the transaction
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });
       // await connection.confirmTransaction({
       //     blockhash: latestBlockHash.blockhash,
       //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
       //     signature: txid
       // });
        console.log(`https://solscan.io/tx/${txid}`);
    } catch (error) {
        console.error('Error in swap function:', error);
    }
}

swap();
