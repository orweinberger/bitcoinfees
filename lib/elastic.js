const elastic = require('elasticsearch');
const client = new elastic.Client({
  host: 'localhost:9200',
  log: 'info'
});

exports.bulkInsert = function(payload) {
	let batch = [];
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
	return new Promise((resolve, reject) => {
		client.bulk({
			body: batch
		}, function(err, response) {
			if (err) return reject(err);
			return resolve(response);
		});
	});
}

exports.bulkUpdate = function(payload) {
	let batch = [];
	payload.forEach(p => {
		batch.push({
			update: {
				_index: "mempool",
				_type: "tx",
				_id: p.id
			}
		});
		batch.push({doc: p.result});
	});
	return new Promise((resolve, reject) => {
		client.bulk({
			body: batch
		}, function(err, response) {
			if (err) return reject(err);
			return resolve(response);
		});
	});
}