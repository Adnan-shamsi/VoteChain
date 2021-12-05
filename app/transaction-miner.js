const Transaction = require("../wallet/transaction");

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

    const validRewardTransactions = this.transactionPool.processAllValidRewards(
      validVotingTransactions
    );

    validRewardTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );

    const validNewCommers = []; //need to be updated

    const finalData = {
      data: {
        transaction: {
          votingTransactions: validVotingTransactions,
          rewardTransactions: validRewardTransactions,
          newCommers: validNewCommers,
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
