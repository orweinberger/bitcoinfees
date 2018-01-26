const bitcoind = require('./lib/bitcoind');
const elastic = require('./lib/elastic');
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
					console.log('Could not push all items', result.errors);
			})
			.catch(err => {
				console.log('ES ERROR', err);
			});
	});

//Periodic build runs every minute
setInterval(function () {
	bitcoind.getMempool()
		.then(txs => {
			if (current_mempool.length === 0) {
				current_mempool = txs;
			} else {
				previous_mempool = current_mempool;
				current_mempool = txs;
			}
			console.log('Previous count', previous_mempool.length);
			console.log('Current count', current_mempool.length);

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
				//check if missing transaction is due to confirmation
				bitcoind.gettxs(missing)
					.then(confirmed => {
						elastic.bulkUpdate(confirmed)
							.then(result => {
								if (result.items.length === confirmed.length && result.errors === false)
									console.log(`successfuly pushed ${confirmed.length} confirmed transactions into Elasticsearch`)
								else
									console.log('Could not push all items', result.errors);
							});
					})
					.catch(deleted => {
						deletedtxs = [];
						deleted.forEach(d => {
							let t = {
								id: d,
								result: {
									deleted: true
								}
							};
							deletedtxs.push(t);
						});
						elastic.bulkUpdate(deletedtxs)
							.then(result => {
								if (result.items.length === deleted.length && result.errors === false)
									console.log(`successfuly pushed ${deleted.length} deleted transactions into Elasticsearch`)
								else
									console.log('Could not push all items', result.errors);
							});
					});
			}
		});
}, 60000);