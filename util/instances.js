const Blockchain = require("../blockchain");
const PubSub = require("../app/pubsub");
const TransactionPool = require("../wallet/transaction-pool");
const Wallet = require("../wallet");
const TransactionMiner = require("../app/transaction-miner");

const isDevelopment = process.env.ENV === "development";

const REDIS_URL = null;

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });

const transactionMiner = new TransactionMiner({
    blockchain,
    transactionPool,
    wallet,
    pubsub,
});

module.exports = { blockchain, transactionPool, wallet, pubsub, transactionMiner }