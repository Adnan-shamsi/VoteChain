const express = require("express");
const { verifySignature } = require("../util/mainNode");

const { blockchain, transactionPool, wallet, pubsub, transactionMiner } = require('../util/instances')

const isDevelopment = process.env.ENV === "development";

const router = express.Router();

router.post('/verify-transaction-pool', (req, res) => {
    // WIP
    
    const transactions = transactionPool.transactions.newCommerTransactions
    
    for (let transaction in transactions) {
        const isGenuine = verifySignature({ "output": transaction.outputMap, "input": transaction.inputMap }, transaction.signature)
        
    }
})

router.post('/add-miner', (req, res) => {
    const { newMiner } = req.body
    if (!newMiner) {
        return res.status(400).json({ error: "newMiner not specified" })
    }
    try {
        const transaction = wallet.createTransaction({
            recipient: newMiner,
            amount: 1,
            chain: blockchain.chain,
        });
        transactionPool.setNewCommerTransaction(transaction);
        pubsub.broadcastTransaction(transaction);
    } catch (e) {
        return res.status(500).json({ message: "An error occured" })
    }
})


module.exports = router;