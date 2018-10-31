const io = require('socket.io-client');
const EventEmitter = require('events').EventEmitter;
class client extends EventEmitter {

	constructor(ip) {
		super(ip);
		this.access_token = null;
		this.socket = io(ip);
	}

	//publish the specs file to registry
	publishSpec(specFileData) {
		if (this.access_token !== null) {
			var fetch = require('node-fetch');
			try {
				console.log(specFileData);
				let ActivitySpecs = {
					yaml: specFileData,
				}
				//fetch-post to the registry
				fetch('http://172.23.238.217:8002/register-yaml', {
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
	configure(tokenValue,callback) {
		try {
			this.access_token = tokenValue;
			console.log('token sent');
			this.socket.emit('config', this.access_token,(ack)=>{callback(ack)});
		}
		catch (error) {
			console.log('error in sending token :' + error);
		}
	}

	//pushing activities to server
	push(eventType, activity,callback) {
		if (this.access_token !== null) {
			// console.log('in push');
			try {
				this.socket.emit(eventType, activity, (ack)=>{callback(ack)});
			}
			catch (error) {
				console.log('error in pushing activities/eventType : ' + error);
			}
			// console.log('exit push');
		}

	}

	//listen for events from server
	on(listenForEvent, callback) {
		try {
			this.socket.on(listenForEvent, (activity) => {
				callback(activity);
			});
		}
		catch (error) {
			console.log('error : ' + error);
		}
	}

}

module.exports = client;
