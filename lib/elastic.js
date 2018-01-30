const elastic = require('elasticsearch');
const client = new elastic.Client({
	host: 'elastic:9200',
	log: 'info'
});

exports.bulkInsert = function (payload) {
	return new Promise((resolve, reject) => {
		let batch = [];
		if (payload.length === 0)
			return reject(new Error('Nothing to push'));
		payload.forEach(p => {
			batch.push({
				index: {
					_index: "mempool",
					_type: "tx",
					_id: p.id
				}
			});
			batch.push(p.result);
		});
		client.bulk({
			body: batch
		}, function (err, response) {
			if (err) return reject(err);
			return resolve(response);
		});
	});
}

exports.bulkUpdate = function (payload) {
	let batch = [];
	payload.forEach(p => {
		batch.push({
			update: {
				_index: "mempool",
				_type: "tx",
				_id: p.id
			}
		});
		batch.push({
			doc: p.result
		});
	});
	return new Promise((resolve, reject) => {
		client.bulk({
			body: batch
		}, function (err, response) {
			if (err) return reject(err);
			return resolve(response);
		});
	});
}