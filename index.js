const bitcoind = require('./lib/bitcoind');
const elastic = require('./lib/elastic');
const chalk = require('chalk');
let previous_mempool = [];
let current_mempool = [];
//initial build
bitcoind.getMempool()
	.then(mempool => {
		previous_mempool = mempool;
		bitcoind.getTXinfo(mempool, false)
			.then(elastic.bulkInsert)
			.then(result => {
				if (result.items.length === mempool.length && result.errors === false)
					console.log(`successfuly pushed ${mempool.length} items into Elasticsearch`)
				else
					console.log('Could not push all items', result);
				setInterval(run, 60000);
			})
			.catch(err => {
				console.log(chalk.red('Mempool is empty, bitcoin-core is probably still syncing... Sleeping for 5 minutes'));
				setTimeout(process.exit, 300000);
			});
	});

//Periodic build runs every minute
function run() {
	bitcoind.getMempool()
		.then(txs => {
			if (current_mempool.length === 0) {
				current_mempool = txs;
			} else {
				previous_mempool = current_mempool;
				current_mempool = txs;
			}
			console.log(chalk.blue('Previous count: '), previous_mempool.length, chalk.green('Current count: '), current_mempool.length);

			let new_txs = current_mempool.filter(x => previous_mempool.indexOf(x) < 0);
			let missing = previous_mempool.filter(x => current_mempool.indexOf(x) < 0);

			if (new_txs.length > 0) {
				bitcoind.getTXinfo(new_txs, false)
					.then(elastic.bulkInsert)
					.then(result => {
						if (result.items.length === new_txs.length && result.errors === false)
							console.log(`successfuly pushed ${new_txs.length} new transactions into Elasticsearch`)
						else
							console.log('Could not push all items', result.errors);
					})
					.catch(err => {
						console.log('ES ERROR', err);
					});
			}

			if (missing.length > 0) {
				//check if missing transaction is due to confirmation or deletion from mempool
				bitcoind.gettxs(missing)
					.then(confdel => {
						elastic.bulkUpdate(confdel)
							.then(result => {
								if (result.items.length === confdel.length && result.errors === false)
									console.log(`successfuly pushed ${confdel.length} confirmed and deleted transactions into Elasticsearch`)
								else
									console.log('Could not push all items', result.errors);
							});
					});
			}
		});
}