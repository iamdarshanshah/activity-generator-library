const io = require('socket.io-client');
const EventEmitter = require('events').EventEmitter;
const Queue = require('node-persistent-queue');
class client extends EventEmitter {

	constructor(ip, pathToSqlLiteDB) {
		super(ip);
		this.access_token = null;
		this.socket = io(ip);
		this.q = new Queue(pathToSqlLiteDB);
		var fs = require("fs");
		var file = pathToSqlLiteDB;
		var exists = fs.existsSync(file);

		if (!exists) {
			console.log("Creating DB file.");
			fs.openSync(file, "w");
		}
	}

	//publish the specs file to registry
	publishSpec(specFileData,apiPath) {
		if (this.access_token !== null) {
			var fetch = require('node-fetch');
			try {
				console.log(specFileData);
				let ActivitySpecs = {
					yaml: specFileData,
				}
				//fetch-post to the registry
				fetch(apiPath, {
					method: 'POST',
					headers: {
						'Accept': 'application/json, text/plain, */*',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(ActivitySpecs)
				})
			}
			catch (error) {
				console.log('error in Publishing Specs file : ' + error);
			}
		}
	}

	//send token to the server 
	configure(tokenValue, callback) {
		try {
			this.access_token = tokenValue;
			console.log('token sent');
			this.socket.emit('config', this.access_token, (ack) => { callback(ack) });
		}
		catch (error) {
			console.log('error in sending token :' + error);
		}
	}

	//pushing activities to server
	push(eventType, activity, callback) {
		if (this.access_token !== null) {
			// console.log('in push');
			try {
				this.socket.emit(eventType, activity, (ack) => { callback(ack) });
			}
			catch (error) {
				console.log('error in pushing activities/eventType : ' + error);
			}
			// console.log('exit push');
		}

	}

	//listen for events from server
	clientOn(listenForEvent, callback) {
		try {
			this.socket.on(listenForEvent, (activity) => {
				callback(activity);
			});
		}
		catch (error) {
			console.log('error : ' + error);
		}
	}

	//listen for events from queues
	on(listenForEvent, callback) {
		this.q.on(listenForEvent, (task) => {
			callback(task);
		})
	}

	//open the db
	openQueue() {
		return this.q.open();
	}

	//start queue and processing tasks
	startQueue(activity) {
		this.q.start(activity);
	}

	//adding task to queue
	addToQueue(activity) {
		this.q.add(activity);
	}

	//after processing of task is completed
	done() {
		this.q.done();
	}

	//returns length of the queue i.e. items in queue
	queueLength() {
		return this.q.getLength();
	}
}

module.exports = client;
