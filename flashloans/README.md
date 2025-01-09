# Solana Flashloan Example

This project demonstrates how to use flashloans on the Solana blockchain using the Solend SDK.

---

## Dependencies

To run this project, you'll need the following:

- **Node.js**
- **TypeScript**
- **BN.js**
- **Solana SDK** (`@solana/web3.js`)
- **Solend SDK** (`@solendprotocol/solend-sdk`)

---

## Setup Guide

### Step 1: Install Node.js
Make sure Node.js is installed on your system. You can download it [here](https://nodejs.org/).

### Step 2: Install Required Packages
Navigate to the project directory in your terminal and run the following command to install the necessary dependencies:

```bash
npm install typescript bn.js @solana/web3.js@1.98.0 @solendprotocol/solend-sdk@0.13.35

### Step 3 Configure Keypair and RPC Endpoint
Generate a New Keypair:
If you don't already have a Solana keypair, generate one using the Solana CLI:

```bash
solana-keygen new --outfile ./keypair.json

Save the keypair file in your project folder. Update your script to reference the path to this keypair file.

### Step 4 Set Up an RPC Endpoint:

Obtain an RPC endpoint from Chainstack, or any other provider offering Solana RPC services.
Alternatively, you might try using the default Solana Mainnet RPC, but it might not work for all functionality.
Make sure to update your script with the RPC endpoint URL.

### Run the Script
Once everything is set up, execute the flashloan example script by running the following command in your terminal:

```bash
ts-node borrow1solami.ts
