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
    createLogger,
} from '../util/util.js';

const logger = await createLogger({
    scriptId: '5minHtsTokenLaunchChallenge',
    scriptCategory: 'task',
});
let client;

async function script5minHtsTokenLaunchChallenge() {
    logger.logStart('Welcome to the 5minHtsTokenLaunchChallenge task!');

    // Read in environment variables from `.env` file in parent directory
    dotenv.config({ path: '../.env' });
    logger.log('Read .env file');

    // Initialise the operator account
    const operatorIdStr = process.env.OPERATOR_ACCOUNT_ID;
    const operatorKeyStr = process.env.OPERATOR_ACCOUNT_PRIVATE_KEY;
    if (!operatorIdStr || !operatorKeyStr) {
        throw new Error('Must set OPERATOR_ACCOUNT_ID and OPERATOR_ACCOUNT_PRIVATE_KEY environment variables');
    }
    const operatorId = AccountId.fromString(operatorIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);
    client = Client.forTestnet().setOperator(operatorId, operatorKey);
    logger.log('Using account:', operatorIdStr);

    await logger.logSectionWithWaitPrompt('Configuring the new HTS token');

    const name = '';
    const symbol = '';
    const initialSupply = 0;
    if (!name || !symbol || initialSupply < 1) {
        throw new Error('Must configure a name, symbol, and initial supply for the new token.');
    }

    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenMemo(`5minTokenLaunchChallenge token - ${logger.version}`)
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
    logger.log('The token create transaction ID: ', tokenCreateTxId.toString());
    const tokenCreateTxHashscanUrl = `https://hashscan.io/testnet/transaction/${tokenCreateTxId.toString()}`;
    logger.log('The token create transaction Hashscan URL: ', ...logger.applyAnsi('URL', tokenCreateTxHashscanUrl));

    await logger.logSectionWithWaitPrompt('Creating the new HTS token');
    // Sign the transaction with the account key that will be paying for this transaction
    const tokenCreateTxSigned = await tokenCreateTx.sign(operatorKey);
    // Submit the signed transaction to the Hedera Testnet
    const tokenCreateTxSubmitted = await tokenCreateTxSigned.execute(client);
    // Get the transaction receipt after it has completed
    const tokenCreateTxReceipt = await tokenCreateTxSubmitted.getReceipt(client);
    // Extract token ID from transaction receipt, and display it
    const tokenId = tokenCreateTxReceipt.tokenId;
    logger.log('The new token ID:', tokenId.toString());
    client.close();

    await logger.logSectionWithWaitPrompt('View the new HTS token on Hashscan');
    // Display the Hashscan URL
    const tokenHashscanUrl = `https://hashscan.io/testnet/token/${tokenId.toString()}`;
    logger.log('The new token Hashscan URL:', ...logger.applyAnsi('URL', tokenHashscanUrl));

    logger.logComplete('5minHtsTokenLaunchChallenge task complete!');
}

script5minHtsTokenLaunchChallenge().catch((ex) => {
    client && client.close();
    logger ? logger.logError(ex) : console.error(ex);
});
