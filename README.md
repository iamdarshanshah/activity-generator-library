# Client Stream Library

- Through this library a program can connect to Streaming Server.
- It can Send Configuration token, publish activities and can subscribe to activities and events from      streaming server.
- Published activities are sent using a queue mechanism to ensure no data loss.
- Also one can get all types of activities for a particular application. 

## Methods
- configure(tokenvalue,version,callback)
- publishSpec(specFileData,token)
- publishActivity(activity)
- subscribe(activity,callback)
- getActivityHistory()

### configure(tokenvalue,version,callback)

method used to send jwt token stored in json file to the connected machine defined in the constructor.

syntax :

```javascript
const Client = require('client-streamer');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.configure('jwt-token','version',(ack)=>{console.log(`ack : ${ack}`)});
client.configure('jwt-token',null,(ack)=>{console.log(`ack : ${ack}`)});
```

### publishSpec(specFileData,token,apiPath)

method used for publishing spec. file(yaml/json) to the apiPath defined as the method parameter using fetch.

syntax :

```javascript
const Client = require('client-streamer');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.publishSpec(require('./specFile.yaml'),'jwt-token','http://172.0.0.1:8000/register-yaml');
```

### publishActivity(activity)

method used to emit eventType and corresponding activity to the connected machine defined in the constructor.

syntax :

```javascript
const Client = require('client-streamer');
const client = new client('127.0.0.1:4000','path/to/sqllite.db');

client.publishActivity({'hi':'hello world'});
```

### subscribe(listenForEvent,callback)

method will listen for the event defined at listenForEvent and will perform callback on it.

syntax:

```javascript
const Client = require('client-streamer');
const client = new client('127.0.0.1:8000','path/to/sqllite.db');

client.subscribe('event',(activity)=>{ ... });
```

### getActivityHistory(applicationName,from,to,activity_code)

provided applicationName and apiPath.
User will be able to download token for valid registered application.

if version is not provided, by default, it will download the token for latest version of app.

```javascript
const Client = require('client-streamer');
const client = new client('127.0.0.1:8000','path/to/sqllite.db');

client.getActivityHistory('AppName','http://path-to-api'); //latest version
client.getActivityHistory('AppName','http://path-to-api','0.0.1'); //for version 0.0.1 (if it exist)
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
const Client = require('client-streamer');
const { ip } = require('./config.js');

const client = new Client(ip, './sql-lite/sqllite.db');

const createActStream = require('./modules/activity-generator-controller');

const tail = new Tail('./logs/production_json.log');

const tokenFile = require('./configure.json');

let disconnectFlag = true;

// Streaming Log File Data
tail.on('line', (data) => {
  const activity = createActStream(JSON.parse(data));

  // console.log(`generated activity :- ${activity}`);

  if (activity !== undefined) {

    // emitted when server gets disconnected
    client.subscribe('disconnect', () => {
      console.log('Disconnected');
      disconnectFlag = true;
    });
    // polls server for connection, emitted when server is connected
    client.subscribe('connect', () => {
      if (disconnectFlag) {
        console.log('connected & sending token again');
        client.configure(tokenFile.token, (ack) => {
          console.log(`acknowledgement for again connect : ${ack}`);
          if (ack !== 'received') {
            disconnectFlag = true;
          }
        }, tokenFile.version);
        disconnectFlag = false;
      }
    });
    //caching of activities
    client.pushToQueue(activity);
  }
});
// error handling
tail.on('error', (error) => { console.error(`Error in reading file : ${error}`); });

// sending token at the start of service
console.log('initial sending of token');
client.configure(tokenFile.token, (ack) => {
  console.log(`Initial acknowledgement : ${ack}`);
}, tokenFile.version);

```


