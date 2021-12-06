const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  VOTING_TRANSACTION: 'VOTING_TRANSACTION',
  NEW_COMMER_TRANSACTION: 'NEW_COMMER_TRANSACTION',
  POLL_QUESTION: 'POLL_QUESTION',
  POOL_REFRESH :"POOL_REFRESH" ,
};

class PubSub {
  constructor({ blockchain, transactionPool, redisUrl }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.subscribeToChannels();

    this.subscriber.on(
      'message',
      (channel, message) => this.handleMessage(channel, message)
    );
  }

  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}.`);

    const parsedMessage = JSON.parse(message);

    switch(channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage
          });
        });
        break;
      case CHANNELS.VOTING_TRANSACTION:
        this.transactionPool.setVotingTransaction(parsedMessage);
        break;
      case CHANNELS.POLL_QUESTION:
        this.transactionPool.setQuestion(parsedMessage);
        break;
      default:
        return;
    }
  }

  subscribeToChannels() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel);
    });
  }

  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastVotingTransaction(transaction) {
    this.publish({
      channel: CHANNELS.VOTING_TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
  
  broadcastNewCommerTransaction(transaction) {
    this.publish({
      channel: CHANNELS.NEW_COMMER_TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }

  broadcastQuestion(question) {
    this.publish({
      channel: CHANNELS.POLL_QUESTION,
      message: JSON.stringify(question)
    });
  }

  broadcastClearPool() {
    this.publish({
      channel: CHANNELS.POOL_REFRESH,
      message: null
    });
  }

}

module.exports = PubSub;
