const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = {
      votingTransactions: {},
      newCommerTransactions: {},
      newCommerSignature: ''
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
    this.transactions.questionMap = questionData;
  }

  setNewCommerTransaction({ transaction, signature }) {
    //newCommerTransaction obj [{'sender_address','address', 'id' aka timestamp, 'signature assigned by central server'}]
    this.transactions.newCommerTransactions[transaction.id] = transaction;
    this.transactions.newCommerSignature = signature
  }

  setMap({ transactions, questionMap }) {
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
    return Object.values(this.transactions.votingTransactions).filter((transaction) =>
      Transaction.validVotingTransaction(transaction)
    );
  }

  validnewCommerTransactions() {
    return Object.values(this.transactions.newCommerTransactions).filter((transaction) =>
      Transaction.validNewCommerTransaction(transaction)
    );
  }

  clearBlockchainTransactions({ chain }) {
    this.clear();
  }
}

module.exports = TransactionPool;
