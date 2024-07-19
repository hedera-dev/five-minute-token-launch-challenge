const crypto = require('node:crypto');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
const {
    Client,
    PrivateKey,
    AccountId,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} = require('@hashgraph/sdk');

const DEFAULT_VALUES = {
    dotEnvFilePath: path.resolve(__dirname, '../.metrics.env'),
    metricsAccountId: '0.0.4515983',
    metricsAccountKey: '3030020100300706052b8104000a0422042084ef968aa153ace24ed5a6299dfaa7c9e123be03a4ad95b937be3c1dc281aee6',
    metricsHcsTopicId: '0.0.4576382',
    metricsHcsTopicMemo: '5MHTSTLC',
};

const ANSI_ESCAPE_CODE_BLUE = '\x1b[34m%s\x1b[0m';
const HELLIP_CHAR = '…';

function blueLog(...strings) {
    console.log(ANSI_ESCAPE_CODE_BLUE, '🔵', ...strings, HELLIP_CHAR);
}

function convertTransactionIdForMirrorNodeApi(txId) {
    // The transaction ID has to be converted to the correct format to pass in the mirror node query (0.0.x@x.x to 0.0.x-x-x)
    let [txIdA, txIdB] = txId.toString().split('@');
    txIdB = txIdB.replace('.', '-');
    const txIdMirrorNodeFormat = `${txIdA}-${txIdB}`;
    return txIdMirrorNodeFormat;
}

async function queryAccountByEvmAddress(evmAddress) {
    let accountId;
    let accountBalance;
    let accountEvmAddress;
    const accountFetchApiUrl =
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}?limit=1&order=asc&transactiontype=cryptotransfer&transactions=false`;
    console.log('Fetching: ', accountFetchApiUrl);
    try {
        const accountFetch = await fetch(accountFetchApiUrl);
        const accountObj = await accountFetch.json();
        const account = accountObj;
        accountId = account?.account;
        accountBalance = account?.balance?.balance;
        accountEvmAddress = account?.evm_address;
    } catch (ex) {
        // do nothing
    }
    return {
        accountId,
        accountBalance,
        accountEvmAddress,
    }
}

async function queryAccountByPrivateKey(privateKeyStr) {
    const privateKeyObj = PrivateKey.fromStringECDSA(privateKeyStr);
    const publicKey = `0x${ privateKeyObj.publicKey.toStringRaw() }`;
    let accountId;
    let accountBalance;
    let accountEvmAddress;
    const accountFetchApiUrl =
        `https://testnet.mirrornode.hedera.com/api/v1/accounts?account.publickey=${publicKey}&balance=true&limit=1&order=desc`;
    console.log('Fetching: ', accountFetchApiUrl);
    try {
        const accountFetch = await fetch(accountFetchApiUrl);
        const accountObj = await accountFetch.json();
        const account = accountObj?.accounts[0];
        accountId = account?.account;
        accountBalance = account?.balance?.balance;
        accountEvmAddress = account?.evm_address;
    } catch (ex) {
        // do nothing
    }
    return {
        accountId,
        accountBalance,
        accountEvmAddress,
    }
}

async function getMetricsConfig() {
    // read in current metrics config
    dotenv.config({ path: DEFAULT_VALUES.dotEnvFilePath });

    // read ID, account credentials and HCS topic ID from config
    // falling back on defaults in not present
    const metricsId = process.env.METRICS_ID ||
        crypto.randomBytes(16).toString('hex');
    const metricsAccountId = process.env.METRICS_ACCOUNT_ID ||
        DEFAULT_VALUES.metricsAccountId;
    const metricsAccountKey = process.env.METRICS_ACCOUNT_PRIVATE_KEY ||
        DEFAULT_VALUES.metricsAccountKey;
    const metricsHcsTopicId = process.env.METRICS_HCS_TOPIC_ID ||
        DEFAULT_VALUES.metricsHcsTopicId;
    const metricsAccountIdObj = AccountId.fromString(metricsAccountId);
    const metricsAccountKeyObj = PrivateKey.fromStringDer(metricsAccountKey);
    const client = Client.forTestnet().setOperator(metricsAccountIdObj, metricsAccountKeyObj);

    return {
        metricsId,
        metricsAccountId,
        metricsAccountKey,
        metricsHcsTopicId,
        client,
        metricsAccountIdObj,
        metricsAccountKeyObj,
    };
}

async function saveMetricsConfig({
    metricsId,
    metricsAccountId,
    metricsAccountKey,
    metricsHcsTopicId,
}) {
    // save/ overwrite config file
    const dotEnvFileText =
`
METRICS_ID=${metricsId}
METRICS_ACCOUNT_ID=${metricsAccountId}
METRICS_ACCOUNT_PRIVATE_KEY=${metricsAccountKey}
METRICS_HCS_TOPIC_ID=${metricsHcsTopicId}
`;
    const fileName = DEFAULT_VALUES.dotEnvFilePath;
    await fs.writeFile(fileName, dotEnvFileText);
}

async function metricsTopicCreate() {
    const {
        metricsId,
        metricsAccountId,
        metricsAccountKey,
        client,
        metricsAccountKeyObj,
    } = await getMetricsConfig();

    const topicCreateTx = await new TopicCreateTransaction()
        .setTopicMemo(DEFAULT_VALUES.metricsHcsTopicMemo)
        .freezeWith(client);
    const topicCreateTxSigned = await topicCreateTx.sign(metricsAccountKeyObj);
    const topicCreateTxSubmitted = await topicCreateTxSigned.execute(client);
    const topicCreateTxReceipt = await topicCreateTxSubmitted.getReceipt(client);
    const metricsHcsTopicId = topicCreateTxReceipt.topicId;
    console.log('Metrics HCS topic ID:', metricsHcsTopicId.toString());

    client.close();

    // save/ overwrite config file
    await saveMetricsConfig({
        metricsId,
        metricsAccountId,
        metricsAccountKey,
        metricsHcsTopicId,
    });
}

async function metricsTrackOnHcs(action, detail) {
    if (typeof action !== 'string' || typeof detail !== 'string') {
        throw new Error();
    }
    let client;

    try {
        const metricsConfig = await getMetricsConfig();
        const {
            metricsId,
            metricsAccountId,
            metricsAccountKey,
            metricsHcsTopicId,
            metricsAccountKeyObj,
        } = metricsConfig;
        client = metricsConfig.client;

        await saveMetricsConfig({
            metricsId,
            metricsAccountId,
            metricsAccountKey,
            metricsHcsTopicId,
        });

        // Submit metrics message to HCS topic
        const message = {
            id: metricsId,
            action,
            detail,
            time: Date.now(),
        };
        const topicMsgSubmitTx = await new TopicMessageSubmitTransaction()
            .setTopicId(metricsHcsTopicId)
            .setMessage(JSON.stringify(message))
            .freezeWith(client);
        const topicMsgSubmitTxSigned = await topicMsgSubmitTx.sign(metricsAccountKeyObj);
        const topicMsgSubmitTxSubmitted = await topicMsgSubmitTxSigned.execute(client);
        /* const topicMsgSubmitTxReceipt = */ await topicMsgSubmitTxSubmitted.getReceipt(client);
        // const topicMsgSeqNum = topicMsgSubmitTxReceipt.topicSequenceNumber;
    } catch (ex) {
        console.error('Failed to track', action, detail);
    }
    if (client) {
        client.close();
    }
}

module.exports = {
    ANSI_ESCAPE_CODE_BLUE,
    HELLIP_CHAR,
    blueLog,
    convertTransactionIdForMirrorNodeApi,
    queryAccountByEvmAddress,
    queryAccountByPrivateKey,
    metricsTopicCreate,
    metricsTrackOnHcs,
};
