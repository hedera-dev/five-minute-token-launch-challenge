#!/usr/bin/env node


import {
    Client,
    PrivateKey,
    AccountId,
    TokenCreateTransaction,
    TokenType,
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import {
    blueLog,
    metricsTrackOnHcs,
} from '../util/util.js';

const tutorialId = '5MHTSTLC-MAIN';
let client;
let marker = 'initial';

async function script5minHtsTokenLaunchChallenge() {
    metricsTrackOnHcs('script5minHtsTokenLaunchChallenge', 'run');

    blueLog('Welcome to the 5 minute HTS token launch challenge!');

    // Read in environment variables from `.env` file in parent directory
    dotenv.config({ path: '../.env' });
    marker = 'read-dotenv';

    // Initialise the operator account
    const yourName = process.env.YOUR_NAME;
    const operatorIdStr = process.env.OPERATOR_ACCOUNT_ID;
    const operatorKeyStr = process.env.OPERATOR_ACCOUNT_PRIVATE_KEY;
    if (!yourName || !operatorIdStr || !operatorKeyStr) {
        throw new Error('Must set OPERATOR_ACCOUNT_ID and OPERATOR_ACCOUNT_PRIVATE_KEY environment variables');
    }
    const operatorId = AccountId.fromString(operatorIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
    console.log('Using your name as:', yourName);
    console.log('Using account:', operatorIdStr);
    console.log('');
    marker = 'operator';

    blueLog('Configuring the new HTS token');
    const name = '';
    const symbol = '';
    const initialSupply = 0;
    if (!name || !symbol || initialSupply < 1) {
        throw new Error('Must configure a name, symbol, and initial supply for the new token.');
    }
    marker = 'config-vars';

    const tokenCreateTx = await new TokenCreateTransaction()
        .setTransactionMemo(tutorialId)
        .setTokenMemo(`${tutorialId} token by ${yourName}`)
        // HTS `TokenType.FungibleCommon` behaves similarly to ERC20
        .setTokenType(TokenType.FungibleCommon)
        // Configure token options: name, symbol, decimals, initial supply
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setInitialSupply(initialSupply)
        // Configure token access permissions: treasury account, admin
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey)
        // Freeze the transaction to prepare for signing
        .freezeWith(client);

    // Get the transaction ID of the transaction. The SDK automatically generates and assigns a transaction ID when the transaction is created
    const tokenCreateTxId = tokenCreateTx.transactionId;
    console.log('The token create transaction ID: ', tokenCreateTxId.toString());
    const tokenCreateTxHashscanUrl = `https://hashscan.io/testnet/transaction/${tokenCreateTxId.toString()}`;
    console.log('The token create transaction Hashscan URL: ', tokenCreateTxHashscanUrl);
    console.log('');
    marker = 'token-create-tx';

    blueLog('Creating the new HTS token');
    // Sign the transaction with the account key that will be paying for this transaction
    const tokenCreateTxSigned = await tokenCreateTx.sign(operatorKey);

    // Submit the transaction to the Hedera Testnet
    const tokenCreateTxSubmitted = await tokenCreateTxSigned.execute(client);
    marker = 'token-create-tx-execute';

    // Get the transaction receipt
    const tokenCreateTxReceipt = await tokenCreateTxSubmitted.getReceipt(client);
    marker = 'token-create-tx-receipt';

    // Get the token ID
    const tokenId = tokenCreateTxReceipt.tokenId;
    console.log('The new token ID:', tokenId.toString());
    const tokenHashscanUrl = `https://hashscan.io/testnet/token/${tokenId.toString()}`;
    console.log('The new token Hashscan URL:', tokenHashscanUrl);
    console.log('');

    client.close();

    metricsTrackOnHcs('script5minHtsTokenLaunchChallenge', 'complete');
}

script5minHtsTokenLaunchChallenge().catch((ex) => {
    if (client) {
        client.close();
    }
    console.error(ex);
    metricsTrackOnHcs('script5minHtsTokenLaunchChallenge', `error-after-marker-${marker}`);
});
