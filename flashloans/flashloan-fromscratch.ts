import { flashBorrowReserveLiquidityInstruction, flashRepayReserveLiquidityInstruction } from '@solendprotocol/solend-sdk';
import BN from 'bn.js';
import { Connection, Keypair, PublicKey, Transaction, SendTransactionError, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import * as fs from 'fs';
import { ComputeBudgetProgram } from '@solana/web3.js';
const connection = new Connection("https://api.mainnet-beta.solana.com");

const keypairPath = "./keypair.json";


const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));

const liquidityAmount = new BN(1000000000);

const tokenAccount = new PublicKey("4zWF361mSK3CKAYYiZZGhMZfpKBQEfoNd432J1rjNb41");

const lendingMarket = new PublicKey("Epa6Sy5rhxCxEdmYu6iKKoFjJamJUJw8myjxuhfX2YJi");
const sourceLiquidity = new PublicKey("9wyWAgg91rsVe3xjibFdvKgSw4c8FCLDZfYgFWWTnA5w");
const lendingProgramId = new PublicKey("So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo");
const reserve = new PublicKey("FcMXW4jYR2SPDGhkSQ8zYTqWdYXMQR3yqyMLpEbt1wrs");
const reserveLiquidityFeeReceiver = new PublicKey("5wo1tFpi4HaVKnemqaXeQnBEpezrJXcXvuztYaPhvgC7");


async function flashLoan() {

    const computeUnitMaxLimit = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 });
    const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    
    const flashBorrow = flashBorrowReserveLiquidityInstruction(
        liquidityAmount, 
        sourceLiquidity,
        tokenAccount,
        reserve,
        lendingMarket,
        lendingProgramId
    );

    const flashRepay = flashRepayReserveLiquidityInstruction(
        liquidityAmount, 
        1, 
        tokenAccount, 
        sourceLiquidity, 
        reserveLiquidityFeeReceiver, 
        tokenAccount, 
        reserve, 
        lendingMarket, 
        wallet.publicKey, 
        lendingProgramId
    );

    try{
    const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [computeUnitMaxLimit, flashBorrow, flashRepay]
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    tx.sign([wallet]);
     
     const simulation = await connection.simulateTransaction(tx);
     console.log("Simulation result:", simulation.value);

     if (simulation.value.err) {
         throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
     }

     
     const signature = await connection.sendTransaction(tx, {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed',
    });
   
     //const txHash = await connection.sendTransaction(tx);
     console.log("⏳ Waiting for confirmation...");
     //await connection.confirmTransaction(txHash, 'processed');

     console.log("Transaction sent successfully with hash:", `https://solscan.io/tx/${signature}`);
    } catch (error) {
        if (error instanceof SendTransactionError) {
            console.error("Transaction Error:", {
                message: error.message,
                logs: error.logs,
                details: error
            });
        } else {
            console.error("Error:", error);
        }
        throw error;
    }
}

flashLoan();
