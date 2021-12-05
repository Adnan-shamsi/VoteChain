const Transaction = require("./transaction");

class TransactionPool {
  constructor() {
    this.transactions = {
      votingTransactions: {},
      newCommers: {},
      rewardTransactions: {},
    };

    this.questionMap = {};
  }

  clear() {
    this.transactions = {
      votingTransactions: {},
      newCommers: {},
      rewardTransactions: {},
    };

    this.questionMap = {};
  }

  setVotingTransaction(transaction) {
    this.transactions.votingTransactions[transaction.id] = transaction;
  }
  
  processAllValidRewards(validVotingTransactions){
   //give rewards to the winner
  }
  
  validateNewCommers(){
   //to return all valid newCommers
  }
  
  setMap(transactions, questionMap) {
    this.transactions = transactions;
    this.questionMap = questionMap;
  }

  existingVotingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactions.votingTransactions);

    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  validVotingTransactions() {
    return Object.values(this.transactions.votingTransactions).filter((transaction) =>
      Transaction.validTransaction(transaction)
    );
  }

  clearBlockchainTransactions({ chain }) {
    this.clear();
  }
}

module.exports = TransactionPool;
