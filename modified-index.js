const io = require('socket.io-client');
const EventEmitter = require('events').EventEmitter;
const Queue = require('node-persistent-queue');
class client extends EventEmitter {

    constructor(ip, pathToSqlLiteDB) {
        super(ip);
        this.access_token = null;
        this.version = null;
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

        // Emitted when the sqlite database has been opened successfully (after calling .open() method)
        this.q.on('open', () => {
            console.log('Opening SQLite DB');
            console.log(`Queue contains ${this.q.getLength()} job/s`);
        });

        // Emitted when a task has been added to the queue (after calling .add() method)
        this.q.on('add', (task) => {
            console.log(`Adding task: ${JSON.stringify(task)}`);
            console.log(`Queue contains ${this.q.getLength()} job/s`);
        });

        // Emitted when the queue starts processing tasks (after calling .start() method)
        this.q.on('start', () => {
            console.log('Starting queue');
        });

        // Emitted when the next task is to be executed.
        this.q.on('next', (task) => {
            console.log(`Processing task: ${JSON.stringify(task)}`);
            console.log('----------Pushing Task-----------\n');
            try {
                this.push('activities', task.job, (ack) => {
                    console.log(`push ack : ${ack}`);
                    if (ack === 'received') {
                        // tell Queue that we have finished this task
                        // This call will schedule the next task (if there is one)
                        this.q.done();
                    }
                    else {
                        this.configure(this.access_token, this.version, (ack) => {
                            console.log(`-----no config received acknowledgement----- : ${ack}`);
                        });
                    }
                });
            } catch (err) {
                console.log(`Error occured in pushing task : ${task}`);
                console.log(`Error : ${err}`);
            }
        });

    }

    //publish the specs file to registry
    publishSpec(specFileData, token) {
        // if (this.access_token !== null) {
        var fetch = require('node-fetch');
        try {
            // console.log(specFileData);
            let ActivitySpecs = {
                yaml: specFileData,
                access_token: token
            }
            //fetch-post to the registry
            fetch('', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ActivitySpecs)
            }).then((response) => {
                return response.json();
            })
                .then((res) => { console.log(JSON.stringify(res)); })
                .catch((err) => { console.log(err) });
        }
        catch (error) {
            console.log('error in Publishing Specs file : ' + error);
        }
        // }
    }

    //send token to the server 
    configure(token, version, callback) {
        try {
            if (version === undefined) {
                version = '';
            }
            this.access_token = token;
            this.version = version;
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
    subscribe(listenForEvent, callback) {
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

    //will open queue, add task and start the queue
    pushToQueue(activity) {

        if (activity !== undefined) {
            // opening queues
            this.q.open()
                .then(() => {
                    this.q.start(activity);
                    this.q.add(activity);
                })
                .catch((err) => {
                    // error handling
                    console.log(`Error occurred in opening queue : ${err}`);
                    process.exit(1);
                });
        }
    }

    //download token with applicationName
    downloadToken(applicationName, apiPath) {
        var fetch = require('node-fetch');
        try {
            fetch(`${apiPath}/${applicationName}`)
                .then(res => res.json())
                .then((json) => {
                    console.log(json);
                    var fs = require('fs');
                    let file = fs.createWriteStream('./configure.json');
                    file.write(JSON.stringify(json));
                })
                .catch(err => console.error(err));
        }
        catch (err) {
            console.log('Error in downloadToken() : ', err);
        }
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

    /*
      * Download activities for a particular event from particular application
      * between a specific date range. 
    */
    getHistory(applicationName, eventType) {

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