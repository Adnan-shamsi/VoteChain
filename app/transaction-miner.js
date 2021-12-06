const { request } = require("express");
const Transaction = require("../wallet/transaction");

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  allocateReward(validVotingTransactions) {
    //allocating rewards
    //who all won
    //if tie allocate to all of them

    const countFrequencies = {};
    let mx = 0;

    for (let transaction of validVotingTransactions) {
      const choice = Object.keys(transaction.outputMap);

      if (countFrequencies[choice]) {
        countFrequencies[choice]++;
      } else {
        countFrequencies[choice] = 1;
      }
      mx = Math.max(countFrequencies[choice], mx);
    }

    const optionWon = []; //single item but in case of tie more than one output
    let total_won = 0;
    let total_loss = 0;

    Object.keys(countFrequencies).forEach((key) => {
      if (countFrequencies[key] == mx) {
        total_won += countFrequencies[key];
        optionWon.push(key);
      } else {
        total_loss += countFrequencies[key];
      }
    });

    if (total_won == 0) {
      return [];
    }

    const rewardTransaction = [];

    let award = total_loss / total_won;
    
    award = Math.round(num * 1000) / 1000;

    for (let transaction of validVotingTransactions) {
      const choice = Object.keys(transaction.outputMap);

      if (optionWon.includes(choice)) {
        rewardTransaction.push(
          Transaction.winnerTransaction({
            winnerWallet: transaction.input.address,
            award,
          })
        );
      }
    }

    return rewardTransaction;
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
