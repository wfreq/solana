#Solana Flashloan Example


#Dependencies

youll need Node.js
Typescript
BN
Solana SDK
and solend sdk

#Step 1
Install node.js

#Step 2
Open the directory where the file is in command line 
then run 

npm install typescript bn.js @solana/web3.js@1.98.0 @solendprotocol/solend-sdk@0.13.35

Step 3
Next youll need to configure your keypair and RPC endpoint variables in the file

generate a keypair with solana-cli if you dont have one ready to go and copy it to your folder

For an rpc endpoint you can get one from chainstack.com 

**You might be able to get away with using the default solana mainnet rpc for this but no promises**


#Run it

ts-node borrow1solami.ts
