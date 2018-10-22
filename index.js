const io = require('socket.io-client');
class client {

    constructor(ip) {
        this.access_token = null;
        this.socket = io(ip);
    }

    publishSpec(pathToFile) {
            if (this.access_token !== null) {
                var fs = require('fs');
                var fetch = require('node-fetch');
                fs.readFile('../../'+pathToFile, "utf8", function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(data);
                    let applicationName = {
                        yaml: data,
                    }

                    fetch('http://172.23.238.217:8002/register-yaml', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(applicationName)
                    })
                })

            }
        }

    configure(tokenFilePath) {
        let config = require('../../'+tokenFilePath);
        this.access_token = config.access_token;
        console.log('token sent');
        this.socket.emit('config', this.access_token);
    }

    push(eventType, activity) {
        if (this.access_token !== '') {
            // console.log('in push');
            this.socket.emit('activities', activity);
            this.socket.emit('eventType', eventType);
            // console.log('exit push');
        }

    }

    on(tokenFilePath, callback) {
        this.configure(tokenFilePath);
        this.socket.on('act stream', (activity) => {
            callback(activity);
        });
    }

}


module.exports = client;
