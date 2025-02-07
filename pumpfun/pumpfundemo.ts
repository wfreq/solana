import dotenv from "dotenv";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DEFAULT_DECIMALS, PumpFunSDK } from "pumpdotfun-sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getOrCreateKeypair,
  getSPLBalance,
  printSOLBalance,
  printSPLBalance,
} from "./util";
import * as fs from "fs";
//import { Key } from "readline";
dotenv.config();

const rpcurl = "https://api.mainnet-beta.solana.com";

const KEYS_FOLDER = __dirname + "/.keys";
const SLIPPAGE_BASIS_POINTS = 100n;

const buyAmount = BigInt(0.0001 * LAMPORTS_PER_SOL);
const sellAmount = BigInt(0.0001 * LAMPORTS_PER_SOL);
const wallet = new NodeWallet(Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync("./mev.json", "utf-8")))));



const getProvider = () => {
    if (!rpcurl) {
        throw new Error("Please set HELIUS_RPC_URL in .env file");
    }
    const connection = new Connection(rpcurl);
  return new AnchorProvider(connection, wallet, { commitment: "finalized" });


};



const createAndBuyToken = async (sdk: PumpFunSDK, wallet: Keypair, mint: Keypair) => {
  const tokenMetadata = {
    name: "TST-7",
    symbol: "TST-7",


    description: "TST-7: This is a test token",
    filePath: "./image.png",
    file: new Blob([fs.readFileSync("image.png")])
  };



  const createResults = await sdk.createAndBuy(
    wallet,
    mint,
    tokenMetadata,
    BigInt(0.0001 * LAMPORTS_PER_SOL),
    SLIPPAGE_BASIS_POINTS,
    {

      unitLimit: 250000,
      unitPrice: 250000,
    }
  );

  if (createResults.success) {
    console.log("Success:", `https://pump.fun/${mint.publicKey.toBase58()}`);
    printSPLBalance(sdk.connection, mint.publicKey, wallet.publicKey);
  } else {
    console.log("Create and Buy failed");
  }
};

const buyTokens = async (sdk: PumpFunSDK, wallet: Keypair, mint: PublicKey) => {
  const buyResults = await sdk.buy(
    wallet,
    mint,
    BigInt(0.0001 * LAMPORTS_PER_SOL),
    SLIPPAGE_BASIS_POINTS,
    {

      unitLimit: 250000,
      unitPrice: 250000,
    }
  );

  if (buyResults.success) {
    printSPLBalance(sdk.connection, mint, wallet.publicKey);
    console.log("Bonding curve after buy", await sdk.getBondingCurveAccount(mint));
  } else {
    console.log("Buy failed");
  }

};

const sellTokens = async (sdk: PumpFunSDK, wallet: Keypair, mint: PublicKey) => {
  const currentSPLBalance = await getSPLBalance(
    sdk.connection,

    mint,
    wallet.publicKey
  );
  console.log("currentSPLBalance", currentSPLBalance);


  if (currentSPLBalance) {
    const sellResults = await sdk.sell(
      wallet,
      mint,
      BigInt(currentSPLBalance * Math.pow(10, DEFAULT_DECIMALS)),
      SLIPPAGE_BASIS_POINTS,
      {

        unitLimit: 250000,
        unitPrice: 250000,
      }
    );

    if (sellResults.success) {
      await printSOLBalance(sdk.connection, wallet.publicKey, "Test Account keypair");
      printSPLBalance(sdk.connection, mint, wallet.publicKey, "After SPL sell all");
      console.log("Bonding curve after sell", await sdk.getBondingCurveAccount(mint));
    } else {
      console.log("Sell failed");
    }

  }
};

const main = async () => {
  try {
    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);
    const connection = provider.connection;

    const mint = getOrCreateKeypair(KEYS_FOLDER, "mint");


    //await printSOLBalance(connection, wallet.publicKey, "Test Account keypair");


    const globalAccount = await sdk.getGlobalAccount();
    console.log(globalAccount);

    const currentSolBalance = await connection.getBalance(wallet.publicKey);
    if (currentSolBalance === 0) {
      console.log("Please send some SOL to the test-account:", wallet.publicKey.toBase58());
      return;
    }


    console.log(await sdk.getGlobalAccount());

    let bondingCurveAccount = await sdk.getBondingCurveAccount(mint.publicKey);
    if (!bondingCurveAccount) {
      await createAndBuyToken(sdk, (wallet as NodeWallet).payer, mint);
      bondingCurveAccount = await sdk.getBondingCurveAccount(mint.publicKey);
    }



    if (bondingCurveAccount) {
      await buyTokens(sdk, (wallet as NodeWallet).payer, mint.publicKey);
      await sellTokens(sdk, (wallet as NodeWallet).payer, mint.publicKey);
    }


  } catch (error) {
    console.error("An error occurred:", error);
  }
};

main();
