const sdk = require('bitmark-sdk-js');
const Bitmark = sdk.Bitmark;
const Transaction = sdk.Transaction;
const Asset = sdk.Asset;

const API_TOKEN = 'YOUR_API_TOKEN';
const NETWORK_MODE = 'testnet'; // testnet or livetest

const {
    createNewAccount,
    getAccountFromRecoveryPhrase,
    getRecoveryPhraseFromAccount
} = require('./samples/account-sample');

const {
    registerAsset
} = require('./samples/register-asset-sample');

const {
    issueBitmarks
} = require('./samples/issue-bitmark-sample');

const {
    transferOneSignature,
    sendTransferOffer,
    respondToTransferOffer,
    cancelTransferOffer
} = require('./samples/transfer-bitmark-sample');

const {
    queryBitmarks,
    queryBitmarkById,
    queryTransactions,
    queryTransactionById,
    queryAssets,
    queryAssetById
} = require('./samples/query-sample');


const main = async () => {
    //////////////////////////////////////
    // 0. SDK INITIALIZATION
    //////////////////////////////////////

    // You must initialize SDK before using it
    sdk.init({network: NETWORK_MODE, apiToken: API_TOKEN});

    //////////////////////////////////////
    // 1. ACCOUNT
    //////////////////////////////////////

    // 1.1 Create totally new account
    let account = createNewAccount();

    /**
     * 1.2 Generate Recovery Phrase(twelve words)
     * Recovery Phrase(twelve words) is your secret key. You should keep it in safe place
     * (ex: write it down to paper, shouldn't store it on your machine) and don't reveal it to anyone else.
     */
    const recoveryPhrase = getRecoveryPhraseFromAccount(account);

    // 1.3 Create account using Recovery Phrase
    account = getAccountFromRecoveryPhrase(recoveryPhrase);


    //////////////////////////////////////
    // 2. REGISTER ASSET & ISSUE BITMARKS
    //////////////////////////////////////

    /**
     * 2.1 Register asset
     * You need to register asset to Bitmark block-chain before you can issue bitmarks for it
     */
    const assetName = 'YOUR_ASSET_NAME'; // Asset length must be less than or equal 64 characters
    const assetFilePath = 'YOUR_ASSET_FILE_PATH';
    const metadata = {key1: 'value1', key2: 'value2'}; // Metadata length must be less than or equal 2048 characters

    let assets = await registerAsset(account, {assetName, assetFilePath, metadata});

    /**
     * 2.2 Issue bitmarks for asset
     * You need provide asset ID to issue bitmarks for asset
     */
    let assetId = 'YOUR_ASSET_ID';
    const quantity = 100; // Number of bitmarks you want to issue, quantity must be greater than or equal 1.
    let bitmarks = await issueBitmarks(account, {assetId, quantity});


    //////////////////////////////////////
    // 3. QUERY
    //////////////////////////////////////

    // 3.1 Query bitmarks/bitmark

    /**
     * 3.1.1 Query bitmarks
     * Ex: Query bitmarks which you are owner
     */
    let bitmarkQueryParams = Bitmark.newBitmarkQueryBuilder().ownedBy(account.getAccountNumber()).build();
    let yourBitmarks = await queryBitmarks(bitmarkQueryParams);

    // 3.1.2 Query bitmark
    let bitmarkId = 'BITMARK_ID';
    let bitmark = await queryBitmarkById(bitmarkId);

    // 3.2 Query transactions/transaction

    /**
     * 3.2.1 Query transactions
     * Ex: Query transactions which you are owner
     */
    let transactionQueryParams = Transaction.newTransactionQueryBuilder().ownedBy(account.getAccountNumber()).build();
    let yourTransactions = await queryTransactions(transactionQueryParams);

    // 3.2.2 Query Transaction
    const txId = 'TRANSACTION_ID';
    let tx = await queryTransactionById(txId);

    // 3.3 Query assets/asset
    /**
     * 3.3.1 Query assets
     * Ex: Query assets which you registered
     */
    let assetQueryParams = Asset.newAssetQueryBuilder().registeredBy(account.getAccountNumber()).build();
    let yourAssets = await queryAssets(assetQueryParams);

    // 3.3.2 Query asset
    assetId = 'ASSET_ID';
    let asset = await queryAssetById(assetId);


    //////////////////////////////////////
    // 4. TRANSFER BITMARKS
    //////////////////////////////////////

    /**
     * 4.1 Transfer bitmark using 1 signature
     * You can transfer your bitmark to another account without their acceptance.
     * Note: Your bitmark must be confirmed on Bitmark block-chain(status=settled) before you can transfer it. You can query bitmark by bitmark ID to check it's status.
     */
    bitmarkId = 'YOUR_BITMARK_ID';
    let receiverAccountNumber = 'ACCOUNT_NUMBER_YOU_WANT_TO_TRANSFER_BITMARK_TO';
    let transferResponse = await transferOneSignature(account, {bitmarkId, receiverAccountNumber});

    /**
     * 4.2 Transfer bitmark using 2 signatures
     * When you transfer your bitmark to another account(receiver) using 2 signatures transfer, the receiver is able to accept or reject your transfer.
     * The flow is:
     * a. You(sender): Send a transfer offer to receiver
     * b. Receiver: Accept/Reject your transfer offer
     * Notes:
     * 1. Your bitmark must be confirmed on Bitmark block-chain(status=settled) before you can transfer it. You can query bitmark by bitmark ID to check it's status.
     * 2. You can cancel your transfer offer if the receiver doesn't accept/reject it yet.
     */

    // YOUR CODE: Send transfer offer to receiver
    bitmarkId = 'YOUR_BITMARK_ID';
    receiverAccountNumber = 'ACCOUNT_NUMBER_YOU_WANT_TO_TRANSFER_BITMARK_TO';
    let offerResponse = await sendTransferOffer(account, {bitmarkId, receiverAccountNumber});

    // 4.2.1 Receiver respond(accept/reject) your transfer offer
    // RECEIVER's CODE
    bitmarkId = 'WILL_RECEIVE_BITMARK_ID';
    const receiverAccount = getAccountFromRecoveryPhrase('RECEIVER_RECOVERY_PHRASE');
    const confirmation = 'accept'; // accept or reject
    let confirmationResponse = await respondToTransferOffer(receiverAccount, {bitmarkId, confirmation});

    // 4.2.2 You cancel your own transfer offer
    // YOUR CODE
    bitmarkId = "YOUR_BITMARK_ID_SENT";
    let cancelResponse = cancelTransferOffer(account, bitmarkId);
};

process.on('unhandledRejection', error => {
    let printError = error;

    if (error.response) {
        printError = error.response
    }
    console.log('unhandledRejection', printError);
});

main();
