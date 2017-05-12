# promise-stream-queue
Promise Stream. Queue promises and retrieve the resolved/rejected ones in the inserted order

This module is responsible for serializing promises, but allowing their asynchronous execution. Unlike other queues, where promises are executed
serially, one after another, what this module does is insert promises in a
queue, in a certain order, **allowing its asynchronous execution, but making the output be in the same order in which they were inserted**. As soon as the promise in the head of the queue is resolved, it is released, moving on to the next.

In case of promises never resolved/rejected, the stream allows an execution
timeout that releases the promise from the queue.

This modules is compatible with any [A+ Promises](https://www.promisejs.org/) module.

## Installation

    npm install promise-stream-queue

## Usage

Supose we execute 10 asynchronous tasks:

```javascript
var arr = [1,2,3,4,5,6,7,8,9,10];
var promises = arr.map(i=>{
	return new Promise((resolve,reject)=>{
		setTimeout(()=>{
			resolve("Promise => "+i);
		},Math.floor(Math.random(1000)));
	});
});
```

The above code creates 10 promises that are resolved at a random timeout of 1
second.

Then, we could wait for them to be resolved with [**Promise.all**](https://www.promisejs.org/api/), an then
iterate the results in the same order of the "*promises*" array

```javascript
Promise.all(promises).then(results=>{
	results.forEach(res=>console.log(res));
});
```
That's OK, but we had to wait for **all the promises to be resolved**. What
if we need to iterate for the results as soon as the are available?

We could just simply get the head element of the array and wait for its resolution, an then move to the next.

```javascript
function iterate() {
	var promise = promises.shift();
	promise.then(res=>{
		// Process response
		doSomething(res);
		// Move to next
		iterate();
	})
}
```

Here, the problem is that the array of promises is fixed, and we can't take into acount problems as promises never resolved/reject, etc.. What whe want is
a continuous stream where promises are pushed, and then retrieved the results
in the same order they where inserted.

```javascript
const Stream = require("promise-stream-queue");

// Creates the stream with max execution of 5 secs per promise
var stream = new Stream(5000);	// Execution timeout of 5000 ms
var i = 0;

setInterval(()=>{
	stream.push(new Promise((resolve,reject)=>{
		var randomTimeout = Math.floor(Math.random()*1000);
		setTimeout(()=>resolve("Promise => "+i),randomTimeout);
	}));
});

stream.forEach((err,res,ex)=>{
	console.log(res);
});
```

Now, the *stream.forEach* method will, asynchronously iterate an stream of
ordered promises. The iteration never ends as long as promises are being
pushed to the stream.

## API
### new Stream(timeout)
Creates a new stream with a max execution of *timeout* millisecons per promise.
If a promise fails to be resolved/reject after this timeout, it is discarded and rejected with a *timeout* error.

### stream.push(promise)
Pushes a promise to the stream.

### stream.kill(promise)
Search and discards a previously promise from the stream. This doesn't remove
it from the stream, but the promise will be immediately rejected with a *kill* error.

### stream.toArray()
Returns a snapshot of the stream as an static array of promises.

### stream.forEach(callback(err,res,ex))
Iterates infinitely and asynchronously over the stream.

### stream.forEachSync(callback(err,res,ex,next))
Same as before, but now, the *next* argument is a function that must be called
in order to move to the next element. This is useful when we want to wait to
the callback function to finish the process before move to the next promise.

## Events
### resolve
Fired when the head promise is resolved
```javascript
stream.on("resolve",res=>console.log(res));
```

### reject
Fired when the head promise is rejected
```javascript
stream.on("reject",err=>console.log(err));
```

### catch
Fired when the head promise has thrown an error
```javascript
stream.on("catch",ex=>console.log(ex));
```

## Examples
* [Asynchronous stream iteration](https://github.com/solzimer/promise-stream-queue/blob/master/examples/async.js)
* [Synchronous stream iteration](https://github.com/solzimer/promise-stream-queue/blob/master/examples/sync.js)
