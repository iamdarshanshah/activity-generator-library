# GITLAB ACTIVITY LIBRARY
## Steps for using
- install the library

```
npm install github:gettodarshanshah/activity-generator-library#master --save
```

## Methods
- configure(tokenFilePath)
- on(tokenValue,listenForEvent,callback)
- push(eventType,activity)
- publishSpec(pathToSpecFile)

### configure(tokenFilePath)

method used to send jwt token stored in json file to the connected machine defined in the constructor.

syntax :

```
const Client = import('gitlab-activity-library');
const client = new client('192.0.0.1:4000');

client.configure('./tokenfile.json');
```




### publishSpec(pathToSpecFile)

method used for publishing spec. file(yaml/json) to the connected machine defined in the constructor using fetch.

syntax :

```
const Client = import('gitlab-activity-library');
const client = new client('192.0.0.1:4000');

client.publishSpec('./specfile.yaml');
```

### push(eventType,activity)

method used to emit eventType and corresponding activity to the connected machine defined in the constructor.

syntax :

```
const Client = import('gitlab-activity-library');
const client = new client('192.0.0.1:4000');

client.push(eventType,activity);
```

### on(tokenValue,listenForEvent,callback)

method will first emit the token value to connected machine and then listen for the event defined at listenForEvent and will perform callback on it.

syntax:

```
const Client = import('gitlab-activity-library');
const client = new client('ip:port');

client.on(tokenValue,'event',(activity)=>{console.log(activity)});
```