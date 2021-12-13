const express = require("express");
const request = require("request");
const path = require("path");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const TransactionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const TransactionMiner = require("./app/transaction-miner");

const isDevelopment = process.env.ENV === "development";

const REDIS_URL = null;
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const app = express();
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

app.use(express.json());

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.get("/api/blocks/length", (req, res) => {
  res.json(blockchain.chain.length);
});

// app.get('/api/blocks/:id', (req, res) => {
//   const { id } = req.params;
//   const { length } = blockchain.chain;

//   const blocksReversed = blockchain.chain.slice().reverse();

//   let startIndex = (id-1) * 5;
//   let endIndex = id * 5;

//   startIndex = startIndex < length ? startIndex : length;
//   endIndex = endIndex < length ? endIndex : length;

//   res.json(blocksReversed.slice(startIndex, endIndex));
// });

app.post("/api/transact", (req, res) => {
  const { choice } = req.body;
  const amount = 1;

  let recipient = "";

  switch (choice) {
    case 1:
      recipient = "*option1*";
      break;
    case 2:
      recipient = "*option2*";
      break;
  }

  if (!recipient) {
    return res.status(400).json({ type: "error", message: "invalid choice" });
  }

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    if (!transaction) {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
      transactionPool.setTransaction(transaction);
      pubsub.broadcastTransaction(transaction);
    } else {
      throw new Error("You have already casted your vote");
    }
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message });
  }

  res.json({ type: "success", transaction });
});

app.post("/api/set-poll", (req, res) => {
  if (transactionPool.questionMap) {
    return res
      .status(400)
      .json({ type: "error", message: "only one poll at a time" });
  }
  //question: "fsdf"
  //choices = [1,2];
  const { question, choices } = req.body;
  const q = { question, choices };

  transactionPool.setQuestion(q);
  pubsub.broadcastQuestion(q);

  res.json({ type: "success", q });
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json({
    transactions: transactionPool.transactions,
    questionMap: transactionPool.questionMap,
  });
});

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey;

  res.json({
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
  });
});

// app.get('/api/known-addresses', (req, res) => {
//   const addressMap = {};

//   for (let block of blockchain.chain) {
//     for (let transaction of block.data) {
//       const recipient = Object.keys(transaction.outputMap);

//       recipient.forEach(recipient => addressMap[recipient] = recipient);
//     }
//   }

//   res.json(Object.keys(addressMap));
// });


const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  });
};

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});
