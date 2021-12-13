const express = require("express");
const request = require("request");

const apiRouter = require('./routes/api')
const { blockchain, transactionPool } = require('./util/instances')

const isDevelopment = process.env.ENV === "development";
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const app = express();

app.use(express.json());

app.use('/api', apiRouter)

app.use('/main/api',)

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
