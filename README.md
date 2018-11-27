# GITLAB ACTIVITY LIBRARY

## Methods
- configure(tokenvalue,callback,version)
- subscribe(listenForEvent,callback)
- push(eventType,activity,callback)
- publishSpec(specFileData)
- on(listenForEvent,callback)
- pushToQueue(activity)
- openQueue() <!-- returns a promise -->
- startQueue(activity)
- addToQueue(activity)
- done()
- queueLength()
- downloadToken(applicationName, apiPath, version)
- removeQueueJob(id) <!-- returns a promise -->
- queueHas(id) <!-- returns a promise -->
-	abortQueue() 

### configure(tokenvalue,callback)

method used to send jwt token stored in json file to the connected machine defined in the constructor.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.configure(require('./configure.json').access_token,(ack)=>{console.log(`ack : ${ack}`)});
client.configure(require('./configure.json').access_token,(ack)=>{console.log(`ack : ${ack}`)},'0.0.1');
```

### publishSpec(specFileData,apiPath)

method used for publishing spec. file(yaml/json) to the apiPath defined as the method parameter using fetch.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.publishSpec(require('./specFile.yaml'),'http://172.0.0.1:8000/register-yaml');
```

### push(eventType,activity,callback)

method used to emit eventType and corresponding activity to the connected machine defined in the constructor.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.push('CreateProject',activity, (ack)=>{ ... });
```

### pushToQueue(activity)

method used to emit eventType and corresponding activity to the connected machine defined in the constructor.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.pushToQueue({'hi':'hello world'});
```

### subscribe(tokenValue,listenForEvent,callback)

method will listen for the event defined at listenForEvent and will perform callback on it.

syntax:

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:8000','path/to/sqllite.db');

client.subscribe('event',(activity)=>{ ... });
```

### queueLength()

method will return queue length.

syntax:

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:8000','path/to/sqllite.db');

let length = client.queueLength();
```

### downloadToken(applicationName, apiPath, version)

provided applicationName and apiPath.
User will be able to download token for valid registered application.

if version is not provided, by default, it will download the token for latest version of app.

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:8000','path/to/sqllite.db');

client.downloadToken('AppName','http://path-to-api'); //latest version
client.downloadToken('AppName','http://path-to-api','0.0.1'); //for version 0.0.1 (if it exist)
```

## Events

`Queue` emits events according to the following table:

| Event | Description                                                                                                                                                                                     | Event Handler Parameters                                                                                                        |
|:-----:|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| start | Emitted when the queue starts processing tasks (after calling .startQueue() method)                                                                                                                  | client.on('start',function(){<br/> }) ;                                                                                              |
|  next | Emitted when the next task is to be executed.  This occurs:<br/> * when there are items in the queue and .start() has been called; or<br/> * after .add() has been called to add a task to an empty queue and queue `isStarted()` already | client.on('next',function(job) {<br/>&nbsp;&nbsp;job.id,<br/>&nbsp;&nbsp;job.job <br/>}) ; |
|   add | Emitted when a task has been added to the queue (after calling .addToQueue() method)                                                                                                                   | client.on('add',function(job) {<br/>&nbsp;&nbsp;job.id,<br/>&nbsp;&nbsp;job.job <br/>}) ;                                            |
|  open | Emitted when the sqlite database has been opened successfully (after calling .openQueuue() method)                                                                                                    | client.on('open',function(sqlite) {<br/>&nbsp;&nbsp;sqlite //instance of sqlite3.Database <br/>}) ;                                  |
| close | Emitted when the sqlite database has been closed successfully (after calling .closeQueue() method)                                                                                                   | client.on('close',function() {<br/> }) ;                                                                                             |


## Contrived Example

This example illustrates the use of the the client library in reading a file and emmiting events.

```javascript

const { Tail } = require('tail');
let Client = require('act-streams-client');
const client = new Client('127.0.0.0:8000','./sqllite.db');

const tail = new Tail('./path/to/file');

// console.log('docker-running');

//Emitted when the sqlite database has been opened successfully (after calling .open() method)
client.on('open', function () {
  console.log('Opening SQLite DB');
  console.log('Queue contains ' + client.queueLength() + ' job/s');
});

//Emitted when a task has been added to the queue (after calling .add() method)
client.on('add', function (task) {
  console.log('Adding task: ' + JSON.stringify(task));
  console.log('Queue contains ' + client.queueLength() + ' job/s');

});

//Emitted when the queue starts processing tasks (after calling .start() method)
client.on('start', function () {
  console.log('Starting queue');
});

//Emitted when the next task is to be executed.
client.on('next', function (task) {
  console.log('Queue contains ' + client.queueLength() + ' job/s');
  console.log('Process task: ');
  console.log(JSON.stringify(task));

  console.log(`in next----------------------------------------------------\n`);

  client.push('activities', task, (ack) => {
    if (ack === 'received') {
      // tell Queue that we have finished this task
      // This call will schedule the next task (if there is one)
      client.done();
    }
  });

});

//opening queue
client.openQueue()
  .then(function () {
    //Streaming Log File Data
    tail.on('line', (data) => {
      const activity = JSON.parse(data);
      console.log('activity\n', activity);
      // client.push('activities', activity);
      if (activity !== undefined) {
        client.addToQueue(activity);
        client.startQueue(activity);
      }
    })
    // error handling
    tail.on('error', error => error);
  })
  .catch(function (err) { //error handling
    console.log('Error occurred:');
    console.log(err);
    process.exit(1);
  });

//sending token to the server
console.log(require('./configure.json').token);
client.configure(require('./configure.json').token);

```


