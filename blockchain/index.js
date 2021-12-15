const Block = require("./block");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");
const { cryptoHash } = require("../util");
const { REWARD_INPUT_ALLOCATOR, MINING_REWARD,STARTING_BALANCE } = require("../config");

class Blockchain {
	constructor() {
		this.chain = [Block.genesis()];
	}

	addBlock({ data }) {
		const newBlock = Block.mineBlock({
			lastBlock: this.chain[this.chain.length - 1],
			data,
		});

		this.chain.push(newBlock);
	}

	replaceChain(chain, validateTransactions, onSuccess) {
		if (chain.length <= this.chain.length) {
			console.error("The incoming chain must be longer");
			return;
		}

		if (!Blockchain.isValidChain(chain)) {
			console.error("The incoming chain must be valid");
			return;
		}

		if (validateTransactions && !Blockchain.validTransactionData({ chain })) {
			console.error("The incoming chain has invalid data");
			return;
		}

		if (onSuccess) onSuccess();
		console.log("replacing chain with", chain);
		this.chain = chain;
	}

	static validTransactionData({ chain }) {
		// incomplete
		// validateNewCommerSignatures

		const newCommerSet = new Set();
		const currentBalance = {};

		for (let i = 1; i < chain.length; i++) {
			const { votingTransactions, rewardTransactions, newCommerTransactions } =
				chain[i].data.transactions;

			const votingTransactionSet = new Set();

			let rewardTransactionCount = 0;

			const winners = [];
			for (let transaction of votingTransactions) {
				const addressOfVoter = transaction.input.address;

				if (!currentBalance[addressOfVoter]) {
					currentBalance[addressOfVoter] = STARTING_BALANCE;
				}

				if (votingTransactionSet.has(addressOfVoter)) {
					console.error(
						"An identical transaction appears more than once in the block"
					);
					return false;
				} else {
					votingTransactionSet.add(addressOfVoter);
				}

				if (!currentBalance[addressOfVoter]) {
					console.error("InSufficient Transaction");
					return false;
				} else if (currentBalance[addressOfVoter] !== transaction.input.amount && false) {
					console.error("Miss Match amount");
					return false;
				} else if (transaction.outputMap[addressOfVoter] + 1 !== currentBalance[addressOfVoter] && false) {
					console.error("Amount is not 1");
					return false;
				} else {
					currentBalance[addressOfVoter] = transaction.outputMap[addressOfVoter];
				}
			}

			for (let transaction of rewardTransactions) {
				if (transaction.input.address === REWARD_INPUT_ALLOCATOR.address) {
					rewardTransactionCount += 1;
					const recipient = Object.keys(transaction.outputMap)[0];

					if (currentBalance[recipient])
						currentBalance[recipient] += MINING_REWARD;
					else {
						currentBalance[recipient] = MINING_REWARD + STARTING_BALANCE;
					}

					if (rewardTransactionCount > 1) {
						console.error("Miner rewards exceed limit");
						return false;
					}

					if (transaction.outputMap[recipient] !== MINING_REWARD) {
						console.error("Miner reward amount is invalid");
						return false;
					}
				} else {
					const recipient = Object.keys(transaction.outputMap)[0];

					if (currentBalance[recipient])
						currentBalance[recipient] += transaction.outputMap[recipient];
					else {
						currentBalance[recipient] = transaction.outputMap[recipient];
					}
					winners.push(transaction);
				}
			}
			
			
			if (!Transaction.validateWinnerTransactions({ votingTransactions, winners })) {
				console.error("Winners data missMatch");
				return false;
			}

			for (let transaction of newCommerTransactions) {
				//const addressOfNewCommer = ....
				if (newCommerSet.has(addressOfNewCommer)) {
					console.error(
						"An identical transaction appears more than once in the block"
					);
					return false;
				} else {
					newCommer.add(addressOfNewCommer);
				}
			}
		}
		return true;
	}

	static isValidChain(chain) {
		if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
			return false;
		}

		for (let i = 1; i < chain.length; i++) {
			const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
			const actualLastHash = chain[i - 1].hash;
			const lastDifficulty = chain[i - 1].difficulty;

			if (lastHash !== actualLastHash) return false;

			const validatedHash = cryptoHash(
				timestamp,
				lastHash,
				data,
				nonce,
				difficulty
			);

			if (hash !== validatedHash) return false;

			if (Math.abs(lastDifficulty - difficulty) > 1) return false;
		}

		return true;
	}
}

module.exports = Blockchain;
