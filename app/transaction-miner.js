const Transaction = require("../wallet/transaction");

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  allocateReward(validVotingTransactions){
    //allocating rewards
    //who all won 
    //if tie allocate to all of them
  }
  
  mineTransactions() {
    if (!this.transactionPool.questionMap) {
      return console.error("no Block to be Mined!!");
    }

    const validVotingTransactions =
      this.transactionPool.validVotingTransactions();

    const validRewardTransactions = this.allocateRewards(
      validVotingTransactions
    );

    validRewardTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );

    const validNewCommers = []; //need to be updated

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