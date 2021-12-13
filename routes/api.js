const express = require("express");
const router = express.Router();

const Wallet = require("../wallet");

const { blockchain, transactionPool, wallet, pubsub, transactionMiner } = require('../util/instances')

const isDevelopment = process.env.ENV === "development";

router.use(express.json());

router.get("/blocks", (req, res) => {
	res.json(blockchain.chain);
});

router.get("/blocks/length", (req, res) => {
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

router.post("/transact", (req, res) => {
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

router.post("/set-poll", (req, res) => {
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

router.get("/transaction-pool-map", (req, res) => {
	res.json({
		transactions: transactionPool.transactions,
		questionMap: transactionPool.questionMap,
	});
});

router.get('/mine-transactions', (req, res) => {
	transactionMiner.mineTransactions();

	res.redirect('/api/blocks');
});

router.get('/wallet-info', (req, res) => {
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

module.exports = router;