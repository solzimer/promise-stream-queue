const
	EventEmitter = require('events').EventEmitter;
	Util = require('util'),
	Item = require('./item.js');

function Stream(timeout) {
	EventEmitter.call(this);

	var self = this;
	var id = 0;
	var timeout = timeout || 0;
	var buffer = [];
	var pending = false;
	var callbacks = [];

	function notify(event,data) {
		buffer.pop();
		self.emit(event,data);
		pending = false;

		var res = event=="resolve"? data : null;
		var err = event!="resolve"? data : null;
		var ex  = event=="catch"? data : null;

		var defs = [];
		callbacks.forEach(cb=>{
			if(!cb.sync) cb.fn(err,res,ex);
			else {
				defs.push(new Promise((resolve,reject)=>{
					cb.fn(err,res,ex,()=>{
						resolve();
					});
				}));
			}
		});

		Promise.all(defs).then(()=>{
			process.nextTick(fetchNext);
		});
	}

	function fetchNext() {
		if(pending) return;

		if(buffer.length) {
			item = buffer[buffer.length-1];
			pending = true;

			item.then(data=>{
				notify("resolve",data);
			},err=>{
				notify("reject",err);
			}).catch(err=>{
				notify("catch",err);
			});
		}
	}

	this.toArray = function() {
		return buffer.map(item=>item.pr);
	}

	this.push = function(pr) {
		id++;
		var item = new Item("Item_"+id,pr,timeout);
		buffer.unshift(item);
		fetchNext();
	}

	this.kill = function(pr,reason) {
		var idx = -1, item = null;
		if(pr) {
			idx = buffer.indexOf(item=>item.pr==pr);
		}
		if(idx==-1) item = buffer[buffer.length-1];
		else item = buffer[idx];
		if(item) item.kill(reason);
	}

	this.forEach = function(callback) {
		callbacks.push({fn:callback,sync:false});
	}

	this.forEachSync = function(callback) {
		callbacks.push({fn:callback,sync:true});
	}
}
Util.inherits(Stream, EventEmitter);

if(!module.parent) {
	const readline = require('readline');
	var stream = new Stream(5000);
	var nums = [];

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if(process.argv[2]=="sync") {
		stream.forEachSync((err,data,errcatch,next)=>{
			if(errcatch) console.log("RESULT => Catch\t",err);
			else if(err) console.log("RESULT => Reject\t",err);
			else console.log("RESULT => Resolve\t",data);

			rl.question('Next? <yes> / no : ', (answer) => {
				if(!answer||answer=="next") next();
				else process.exit(0);
			});
		});
	}
	else {
		stream.forEach((err,data,errcatch)=>{
			if(errcatch) console.log("RESULT => Catch\t",err);
			else if(err) console.log("RESULT => Reject\t",err);
			else console.log("RESULT => Resolve\t",data);
		});
	}

	for(var i=0;i<100;i++) nums.push(i);

	nums.forEach(i=>{
		stream.push(new Promise((resolve,reject)=>{
			var rnd = Math.random();
			var to = Math.floor(Math.random()*10000);
			var data = "PR => "+i+", "+to;
			console.log(data);
			setTimeout(()=>{
				if(rnd<=0.5) {resolve(data);}
				else {reject(data);}
			},to);
		}));
	});
}
else {
	module.exports = Stream;
}
