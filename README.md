# GITLAB ACTIVITY LIBRARY

## Methods
- configure(tokenFilePath)
- on(tokenValue,listenForEvent,callback)
- push(eventType,activity)
- publishSpec(pathToSpecFile)

### configure(tokenFilePath)

method used to send jwt token stored in json file to the connected machine defined in the constructor.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('192.0.0.1:4000');

client.configure('./tokenfile.json');
```

### publishSpec(pathToSpecFile)

method used for publishing spec. file(yaml/json) to the connected machine defined in the constructor using fetch.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('192.0.0.1:4000');

client.publishSpec('./specfile.yaml');
```

### push(eventType,activity)

method used to emit eventType and corresponding activity to the connected machine defined in the constructor.

syntax :

```javascript
const Client = import('act-streams-client');
const client = new client('192.0.0.1:4000');

client.push('CreateProject',activity);
```

### on(tokenValue,listenForEvent,callback)

method will first emit the token value to connected machine and then listen for the event defined at listenForEvent and will perform callback on it.

syntax:

```javascript
const Client = import('act-streams-client');
const client = new client('127.0.0.1:8000');

client.on(tokenValue,'event',(activity)=>{console.log(activity)});
```