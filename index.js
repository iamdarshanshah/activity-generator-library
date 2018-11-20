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
		//if file doesn't exist...it creates a new one
		try {
			if (!exists) {
				console.log("Creating DB file.");
				fs.openSync(file, "w");
			}
		}
		catch (err) {
			console.log('error in creating db file :-', err);
		}
	}

	//publish the specs file to registry
	publishSpec(specFileData, apiPath) {
		// if (this.access_token !== null) {
		var fetch = require('node-fetch');
		try {
			// console.log(specFileData);
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
			}).then((res) => { console.log(JSON.stringify(res)); console.log('object', JSON.stringify(ActivitySpecs)); }).catch((err) => { console.log(err) });
		}
		catch (error) {
			console.log('error in Publishing Specs file : ' + error);
		}
		// }
	}

	//send token to the server 
	configure(token,callback,version) {
		try {
			if (version === undefined) {
				version = '';
			}
			this.access_token = token;
			console.log('token sent');
			this.socket.emit('config', { token, version }, (ack) => { callback(ack) });

		}
		catch (error) {
			console.log('error in sending token :' + error);
		}
	}

	//pushing activities to server
	push(eventType, activity, callback) {
		// if (this.access_token !== null) {
		// console.log('in push');
		try {
			this.socket.emit(eventType, activity, (ack) => { callback(ack) });
		}
		catch (error) {
			console.log('error in pushing activities/eventType : ' + error);
		}
		// console.log('exit push');
		// }

	}

	//listen for events from server
	clientOn(listenForEvent, callback) {
		try {
			this.socket.on(listenForEvent, (activity, ack) => {
				callback(activity, ack);
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

	/** 
		* open the db
		* @return {Promise}
	*/
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

	//download token with applicationName & version
	downloadToken(applicationName, apiPath, version) {
		var fetch = require('node-fetch');
		try {
			if (version === undefined) {
				fetch(`${apiPath}/${applicationName}`)
					.then(res => res.json())
					.then((json) => {
						console.log(json);
						var fs = require('fs');
						file = fs.createWriteStream('./configure.json');
						file.write(JSON.stringify(json));
					})
					.catch(err => console.error(err));
			}
			else {
				fetch(`${apiPath}/${applicationName}/${version}`)
					.then(res => res.json())
					.then((token) => {
						console.log(token);
						var fs = require('fs');
						file = fs.createWriteStream(`./${version}_configure.json`);
						file.write(JSON.stringify(token));
					})
					.catch(err => console.error(err));
			}
		}
		catch (err) {
			console.log('Error in downloadToken() : ', err);
		}
	}

	/**
 		* This function will remove the given or current job from the database and in-memory array
 		* @param {PersistentQueue} self Instance to work with
 		* @param {integer} [id] Optional job id number to remove, if omitted, remove current job at front of queue
		* @return {Promise}
 	*/
	removeQueueJob(id) {
		return this.q.removeJob(self, id);
	}

	/**
 		* Returns true if there is a job with 'id' still in queue, otherwise false
 		* @param {integer} id The job id to search for
 		* @return {Promise} Promise resolves true if the job id is still in the queue, otherwise false
	*/
	queueHas(id) {
		return this.q.has(id);
	}

	/**
		* Called by user from within their 'next' event handler when error occurred and job to remain at head of queue

		* It will leave the current job in the queue and stop the queue
	*/
	abortQueue() {
		this.q.abort();
	}



}

module.exports = client;
