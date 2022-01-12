const MINE_RATE = 10 * 1000 * 60;  //10 minute
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
	timestamp: 1,
	lastHash: '-----',
	hash: 'hash-one',
	difficulty: INITIAL_DIFFICULTY,
	nonce: 0,
	data: []
};

const STARTING_BALANCE = 0;
const NEW_COMMER_BALANCE = 1;
const REWARD_INPUT_ALLOCATOR = { address: '*miner-reward*' };
const WINNER_INPUT_ALLOCATOR = { address: '*winner-reward*' };
const VERIFICATION_INPUT_ALLOCATOR = { address: '*verification-reward*' };

const MINING_REWARD = 2;

const MAIN_NODE_LOCATION = '127.0.0.1'

module.exports = {
	GENESIS_DATA,
	MINE_RATE,
	STARTING_BALANCE,
	REWARD_INPUT_ALLOCATOR,
	MINING_REWARD,
	WINNER_INPUT_ALLOCATOR,
	VERIFICATION_INPUT_ALLOCATOR,
	MAIN_NODE_LOCATION,
	NEW_COMMER_BALANCE,
};
