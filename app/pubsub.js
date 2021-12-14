const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  VOTING_TRANSACTION: 'VOTING_TRANSACTION',
  NEW_COMMER_TRANSACTION: 'NEW_COMMER_TRANSACTION',
  POLL_QUESTION: 'POLL_QUESTION',
  POOL_REFRESH: "POOL_REFRESH",
};

class PubSub {
  constructor({ blockchain, transactionPool, redisUrl }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.publisher = redis.createClient({
      url: redisUrl
    });
    this.subscriber = redis.createClient({
      url: redisUrl
    });
    this.publisher.connect();
    this.subscriber.connect();
    this.subscribeToChannels();

    this.publisher.on('connect', () => { console.info('Pub/Sub-Publisher: connect') });
    this.publisher.on('ready', () => { console.info('Pub/Sub-Publisher: ready') });
    this.publisher.on('reconnecting', () => { console.info('Pub/Sub-Publisher: reconnecting') });
    this.publisher.on('error', () => { console.error('Pub/Sub-Publisher: error') });
    this.publisher.on('end', () => { console.info('Pub/Sub-Publisher: end') });

    this.subscriber.on('connect', () => { console.info('Pub/Sub-Subscriber: connect') });
    this.subscriber.on('ready', () => { console.info('Pub/Sub-Subscriber: ready') });
    this.subscriber.on('reconnecting', () => { console.info('Pub/Sub-Subscriber: reconnecting') });
    this.subscriber.on('error', () => { console.error('Pub/Sub-Subscriber: error') });
    this.subscriber.on('end', () => { console.info('Pub/Sub-Subscriber: end') });

  }

  handleMessage(message, channel) {
    console.log(`Message received. Channel: ${channel}.`);

    const parsedMessage = JSON.parse(message);
    switch (channel) {
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

  async subscribeToChannels() {
    const channels = Object.values(CHANNELS)
    for (let i = 0; i < channels.length; i++) {
      await this.subscriber.subscribe(channels[i], this.handleMessage.bind(this))
    }
  }

  async publish({ channel, message }) {
    const t1 = await this.subscriber.unsubscribe(channel);
    try {
      const t2 = await this.publisher.publish(channel, message)
    } catch (e) {
    }
    const t3 = await this.subscriber.subscribe(channel, this.handleMessage.bind(this))
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
