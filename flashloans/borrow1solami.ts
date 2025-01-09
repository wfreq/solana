import { Connection, Keypair, Transaction, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  flashBorrowReserveLiquidityInstruction,
  flashRepayReserveLiquidityInstruction,
} from "@solendprotocol/solend-sdk";
import * as fs from "fs";

async function testFlashLoan() {
  const connection = new Connection("your-rpc-endpoint-here");

  const keypairPath = "./keypair.json-path-to-your-keypair-file";
  const payerKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
  );

  const RESERVE_ADDRESS = new PublicKey("FcMXW4jYR2SPDGhkSQ8zYTqWdYXMQR3yqyMLpEbt1wrs");
  const LIQUIDITY_ADDRESS = new PublicKey("9wyWAgg91rsVe3xjibFdvKgSw4c8FCLDZfYgFWWTnA5w");
  const LENDING_MARKET = new PublicKey("Epa6Sy5rhxCxEdmYu6iKKoFjJamJUJw8myjxuhfX2YJi");
  const LENDING_PROGRAM_ID = new PublicKey("So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo");
  const tokenAccount = new PublicKey("4zWF361mSK3CKAYYiZZGhMZfpKBQEfoNd432J1rjNb41");
  const FEE_RECEIVER_ADDRESS = new PublicKey("5wo1tFpi4HaVKnemqaXeQnBEpezrJXcXvuztYaPhvgC7");

  const borrowAmount = new BN(1000000000); // 1 SOL in lamports

  // Borrow Instruction
  const borrowInstruction = flashBorrowReserveLiquidityInstruction(
    borrowAmount,
    LIQUIDITY_ADDRESS,
    tokenAccount,
    RESERVE_ADDRESS,
    LENDING_MARKET,
    LENDING_PROGRAM_ID
  );

  // Repay Instruction
  const repayInstruction = flashRepayReserveLiquidityInstruction(
    borrowAmount,
    0,                           // Borrow instruction index
    tokenAccount,                // Source liquidity (your token account)
    LIQUIDITY_ADDRESS,           // Destination liquidity (reserve's SPL token account)
    FEE_RECEIVER_ADDRESS,        // Correct reserve liquidity fee receiver
    tokenAccount,                // Host fee receiver (can be set as token account if unused)
    RESERVE_ADDRESS,
    LENDING_MARKET,
    payerKeypair.publicKey,
    LENDING_PROGRAM_ID
  );

  console.log("Borrow Instruction Data:", borrowInstruction.data.toString("hex"));
  console.log("Repay Instruction Data:", repayInstruction.data.toString("hex"));

  const tx = new Transaction();
  tx.add(borrowInstruction, repayInstruction);

  try {
    console.log("Simulating transaction...");
    const simulationResult = await connection.simulateTransaction(tx, [payerKeypair]);
    console.log("Simulation Logs:", simulationResult.value.logs);

    if (simulationResult.value.err) {
      console.error("Simulation Error:", simulationResult.value.err);
    }
  } catch (simulationError) {
    console.error("Simulation failed:", simulationError);
  }

  try {
    console.log("Sending transaction...");
    const signature = await connection.sendTransaction(tx, [payerKeypair]);
    console.log(`Transaction Signature: https://solscan.io/tx/${signature}`);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}

testFlashLoan().catch(console.error);
