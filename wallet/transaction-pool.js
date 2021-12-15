const { verifySignature } = require("../util");
const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = {
      votingTransactions: {},
      newCommerTransactions: {},
    };

    this.questionMap = {};
  }

  clear() {
    this.transactions = {
      votingTransactions: {},
      newCommerTransactions: {},
    };

    this.questionMap = {};
  }

  setVotingTransaction(transaction) {
    this.transactions.votingTransactions[transaction.id] = transaction;
  }

  setQuestion(questionData) {
    //questionData obj {question:'dadasd',choices:['yes','no']}
    this.questionMap = questionData;
  }

  setNewCommerTransaction({ newCommer, signature }) {
    //newCommerTransaction obj [{'sender_address','address', 'id' aka timestamp, 'signature assigned by central server'}]
    this.transactions.newCommerTransactions[newCommer] = signature;
  }

  setMap({ transactions, questionMap }) {
    //console.log(transactions, questionMap)
    this.transactions = transactions;
    this.questionMap = questionMap;
  }

  existingVotingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactions.votingTransactions);

    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  existingNewCommerTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactions.newCommerTransactions);

    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  validVotingTransactions() {
    return Object.values(this.transactions.votingTransactions).filter(
      (transaction) => Transaction.validVotingTransaction(transaction)
    );
  }

  validNewCommerTransactions() {
    return Object.keys(this.transactions.newCommerTransactions)
      .map((key) => [key, this.transactions.newCommerTransactions[key]])
      .filter((x) =>
        Transaction.validNewCommerTransaction(
          x[0],
          x[1]
        )
      );
  }

  clearBlockchainTransactions({ chain }) {
    this.clear();
  }
}

module.exports = TransactionPool;
