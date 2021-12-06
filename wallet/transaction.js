const uuid = require("uuid/v1");
const { verifySignature, cryptoHash } = require("../util");
const {
  REWARD_INPUT_ALLOCATOR,
  MINING_REWARD,
  WINNER_INPUT_ALLOCATOR,
} = require("../config");

class Transaction {
  constructor({ senderWallet, recipient, amount }) {
    this.id = uuid();
    this.outputMap = this.createOutputMap({ senderWallet, recipient, amount });
    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};

    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

    return outputMap;
  }

  createInput({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
    };
  }

  static validVotingTransaction(transaction) {
    const {
      input: { address, amount, signature },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce(
      (total, outputAmount) => total + outputAmount
    );

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }

    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }

    return true;
  }

  static validateWinnerTransactions({ votingTransactions, winners }) {
    const expectedWinners = this.allocateWinnerRewards(votingTransactions);

    if (cryptoHash(expectedWinners) !== cryptoHash(winners)) {
      return false;
    }
  }

  static allocateWinnerRewards(validVotingTransactions) {
    //allocating rewards
    //who all won
    //if tie allocate to all of them

    const countFrequencies = {};
    let mx = 0;

    for (let transaction of validVotingTransactions) {
      let choice = Object.keys(transaction.outputMap).filter(
        (key) => transaction.input.address !== key
      )[0];

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
      const choice = Object.keys(transaction.outputMap).filter(
        (key) => transaction.input.address !== key
      )[0];

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

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT_ALLOCATOR,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD },
    });
  }

  static winnerTransaction({ winnerWallet, award }) {
    return new this({
      input: WINNER_INPUT_ALLOCATOR,
      outputMap: { [winnerWallet.publicKey]: 1 + award },
    });
  }
}

module.exports = Transaction;
