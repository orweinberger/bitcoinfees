const request = require('request');
const Promise = require('bluebird');
exports.getMempool = function () {
	return new Promise((resolve, reject) => {
		let options = {
			uri: 'http://bitcoin:password@localhost:8332',
			method: 'POST',
			body: {
				jsonrpc: "1.0",
				id: "getrawmempool",
				method: "getrawmempool",
				params: []
			},
			json: true
		}
		request(options, function (err, head, body) {
			if (err || body.error)
				return reject(err);
			return resolve(body.result);
		})
	});
};

exports.getTXinfo = function (txs) {
	return new Promise((resolve, reject) => {
		Promise.map(txs, function (txid) {
				return new Promise((resolve, reject) => {
					//console.log('running', txid);
					let options = {
						uri: 'http://bitcoin:password@localhost:8332',
						method: 'POST',
						body: {
							jsonrpc: "1.0",
							id: txid,
							method: "getmempoolentry",
							params: [txid]
						},
						json: true
					};
					request(options, function (err, head, body) {
						if (err || body.error) return reject(err || body.error);
						body.result.dependslen = body.result.depends.length
						body.result.timestamp = new Date(body.result.time * 1000).toISOString();
						body.result.satperbyte = body.result.fee * 100000000 / body.result.size;
						body.result.mined = false;
						return resolve(body);
					});
				});
			}, {
				concurrency: 5
			}).then(results => {
				return resolve(results);
			})
			.catch(x => {
				console.log('err', x)
			});
	});
};

exports.blockHeight = function (hash) {
	return new Promise((resolve, reject) => {
		let options = {
			uri: 'http://bitcoin:password@localhost:8332',
			method: 'POST',
			body: {
				jsonrpc: "1.0",
				id: txid,
				method: "getblockheader",
				params: [txid, true]
			},
			json: true
		};
		request(options, function (err, head, body) {
			if (err || body.error)
				return reject(err);
			return resolve(body.result.height);
		});
	});
};

exports.gettxs = function (txs) {
	return new Promise((resolve, reject) => {
		Promise.map(txs, function (txid) {
				return new Promise((resolve, reject) => {
					//console.log('running', txid);
					let options = {
						uri: 'http://bitcoin:password@localhost:8332',
						method: 'POST',
						body: {
							jsonrpc: "1.0",
							id: txid,
							method: "getrawtransaction",
							params: [txid, true]
						},
						json: true
					};
					request(options, function (err, head, body) {
						if (err || body.error) return reject(txid);
						body.result.mined = true;
						this.blockHeight(body.result.blockhash)
							.then(height => {
								body.result.mined_at = height;
								return resolve(body);
							});
					});
				});
			}, {
				concurrency: 1
			}).then(results => {
				return resolve(results);
			})
			.catch(x => {
				return reject(x);
			});
	});
}

exports.getBlockHeight = function () {
	return new Promise((resolve, reject) => {
		let options = {
			uri: 'http://bitcoin:password@localhost:8332',
			method: 'POST',
			body: {
				jsonrpc: "1.0",
				id: "getinfo",
				method: "getinfo",
				params: []
			},
			json: true
		};
		request(options, function (err, head, body) {
			if (err) return reject(err);
			if (body && body.blocks > 0)
				return resolve(body.blocks);
		});
	});
}