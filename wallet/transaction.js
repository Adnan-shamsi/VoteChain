const uuid = require("uuid/v1");
const { verifySignature } = require("../util");
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

  static rewardTransaction({ minerWallet }) {
    return new this({
      input: REWARD_INPUT_ALLOCATOR,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD },
    });
  }

  winnerTransaction({ winnerWallet, award }) {
    return new this({
      input: WINNER_INPUT_ALLOCATOR,
      outputMap: { [winnerWallet.publicKey]: 1 + award },
    });
  }
}

module.exports = Transaction;
