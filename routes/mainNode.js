const express = require("express");
const { verifySignature, issueSignature } = require("../util/mainNode");

const { blockchain, transactionPool, wallet, pubsub, transactionMiner } = require('../util/instances')

const isDevelopment = process.env.ENV === "development";

const router = express.Router();

router.get('/verify-transaction-pool', (req, res) => {

    const { newCommerTransactions: transactions } = transactionPool.transactions
    let verification = false;
    if (Object.keys(transactions).length) {
        verification = verifySignature(transactions, transactionPool.transactions.newCommerSignature)
    } else {
        verification = true;
    }


    return res.json({ verification, transactions })
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
        let signature = ''
        transactionPool.setNewCommerTransaction({ transaction, signature });
        signature = issueSignature(transactionPool.transactions.newCommerTransactions)
        transactionPool.setNewCommerTransaction({ transaction, signature });
        pubsub.broadcastNewCommerTransaction({ transaction, signature });
        return res.json({ "status": "success", transaction, signature })
    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: "An error occured" })
    }
})


module.exports = router;