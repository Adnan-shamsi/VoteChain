const express = require("express");
const { verifyNewCommerSignature, issueNewCommerSignature } = require("../util/mainNode");

const { blockchain, transactionPool, wallet, pubsub, transactionMiner } = require('../util/instances')

const isDevelopment = process.env.ENV === "development";

const router = express.Router();

router.post('/add-new-commer', (req, res) => {
    const { newCommer } = req.body
    if (!newCommer) {
        return res.status(400).json({ error: "newCommer address not specified" })
    }
    
    if(blockchain.newCommerNeverExistedInChainBefore(newCommer)){
        const signature = issueNewCommerSignature(newCommer)
        transactionPool.setNewCommerTransaction({  newCommer, signature });
        pubsub.broadcastNewCommerTransaction({ newCommer, signature });
        return res.json({ "status": "success", newCommer, signature })
    }
    return res.status(400).json({ "status": "error", "message": "newCommer Already exist"})
})


module.exports = router;