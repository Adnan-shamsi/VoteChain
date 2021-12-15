const { request } = require("express");
const Transaction = require("../wallet/transaction");
const { verifyNewCommerSignature } = require("../util/mainNode");

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransactions() {
    if (!this.transactionPool.questionMap) {
      return console.error("no Block to be Mined!!");
    }

    const validVotingTransactions =
      this.transactionPool.validVotingTransactions();

    const validRewardTransactions = Transaction.allocateWinnerRewards(
      validVotingTransactions
    );

    validRewardTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );

    let validNewCommers = this.transactionPool.validNewCommerTransactions();
    
    const finalData = {
      data: {
        transactions: {
          votingTransactions: validVotingTransactions,
          rewardTransactions: validRewardTransactions,
          newCommerTransactions: validNewCommers,
        },
        questionMap: this.transactionPool.questionMap,
      },
    };

    this.blockchain.addBlock(finalData);

    this.pubsub.broadcastChain();

    this.transactionPool.clear();
  }
}

module.exports = TransactionMiner;
