import { Keypair, Transaction, VersionedTransaction, sendAndConfirmTransaction, Connection } from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import axios from 'axios'

import { API_URLS } from '@raydium-io/raydium-sdk-v2'
import * as fs from 'fs'



//export const owner: Keypair = Keypair.fromSecretKey(bs58.decode('<YOUR_WALLET_SECRET_KEY>'))

export const owner = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('../keypair.json', "utf-8"))));


export const connection = new Connection('https://api.mainnet-beta.solana.com') //<YOUR_RPC_URL>


const priorityFee = 100000


const inputMint = 'So11111111111111111111111111111111111111112'
const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const amount = 100000
const slippage = 1
const txVersion = 'V0'
const isInputSol = true
const isOutputSol = false   
const isV0Tx = true




async function raySwap(){

      // get statistical transaction fee from API
  /**
   * vh: very high
   * h: high
   * m: medium
   */
  const { data } = await axios.get<{
    id: string
    success: boolean
    data: { default: { vh: number; h: number; m: number } }
  }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`)


//fetch quote
const { data: swapResponse } = await axios.get<any>(
    `${
      API_URLS.SWAP_HOST
    }/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
      slippage * 100}&txVersion=${txVersion}`
  ) // Use the URL xxx/swap-base-in or xxx/swap-base-out to define the swap type. 
 



//fetch transactions
  const { data: swapTransactions } = await axios.post<{
    id: string
    version: string
    success: boolean
    data: { transaction: string }[]
  }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
    computeUnitPriceMicroLamports: String(data.data.default.h),
    swapResponse,
    txVersion,
    wallet: owner.publicKey.toBase58(),
    wrapSol: isInputSol,
    unwrapSol: isOutputSol, // true means output mint receive sol, false means output mint received wsol
  })



  const allTxBuf = swapTransactions.data.map((tx) => Buffer.from(tx.transaction, 'base64'))
  const allTransactions = allTxBuf.map((txBuf) =>
    isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
  )

  console.log(`total ${allTransactions.length} transactions`, swapTransactions)




  let idx = 0
  if (!isV0Tx) {
    for (const tx of allTransactions) {
      console.log(`${++idx} transaction sending...`)
      const transaction = tx as Transaction
      transaction.sign(owner)
      const txId = await sendAndConfirmTransaction(connection, transaction, [owner], { skipPreflight: true })
      console.log(`${++idx} transaction confirmed, txId: ${txId}`)
    }
  } else {
    for (const tx of allTransactions) {
      idx++
      const transaction = tx as VersionedTransaction
      transaction.sign([owner])
      const txId = await connection.sendTransaction(tx as VersionedTransaction, { skipPreflight: true })
      const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash({
        commitment: 'finalized',
      })
      console.log(`${idx} transaction sending..., txId: ${txId}`)
      console.log("🔍http://solscan.io/tx/"+txId);
    //   await connection.confirmTransaction(
    //     {
    //       blockhash,
    //       lastValidBlockHeight,
    //       signature: txId,
    //     },
    //     'confirmed'
    //   )
    //  console.log(`${idx} transaction confirmed`)
    }
}
}

raySwap();
