const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
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

    //this.subscribeToChannels();
    this.subscriber.subscribe(CHANNELS.TEST)

    this.subscriber.on(
      'message',
      (channel, message) => this.handleMessage(channel, message)
    );
  }

  handleMessage(channel, message) {
    console.log("I got this message:" + message)
  }

}

const pubSubPublisher = new PubSub();
console.log("starting");

setTimeout(() => pubSubPublisher.publisher.publish(CHANNELS.TEST, 'foo'), 2000)

console.log("ending");
module.exports = PubSub;
