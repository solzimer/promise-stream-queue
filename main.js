const
	EventEmitter = require('events').EventEmitter;
	Util = require('util'),
	Item = require('./item.js'),
	Stream = require('./stream.js');

function PromiseStream(timeout) {
	EventEmitter.call(this);

	var self = this;
	var id = 0;
	var timeout = timeout || 0;
	var buffer = [];
	var pending = false;
	var callbacks = [];
	var dones = [];
	var closed = false;

	function voidfn(){};

	function notify(event,data) {
		buffer.pop();
		self.emit(event,data);
		pending = false;

		var res = event=="resolve"? data : null;
		var err = event!="resolve"? data : null;
		var ex  = event=="catch"? data : null;

		var defs = [];
		var last = closed && !buffer.length;
		callbacks.forEach(cb=>{
			if(!cb.sync) cb.fn(err,res,ex);
			else {
				defs.push(new Promise((resolve,reject)=>{
					cb.fn(err,res,ex,(res)=>{
						resolve();
						if(res===false) {
							callbacks.splice(callbacks.indexOf(cb),1);
						}
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
		else {
			if(closed) {
				while(dones.length)
					dones.pop()();
				self.emit("done");
			}
		}
	}

	this.toArray = function() {
		return buffer.map(item=>item.pr);
	}

	this.toStream = function(options) {
		return new Stream(this,options);
	}

	this.push = function(pr) {
		if(closed) {
			pr.then(voidfn,voidfn).catch(voidfn);
			return;
		}

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

	this.close = function() {
		closed = true;
		self.emit("closed");
	}

	this.done = function(callback) {
		dones.push(callback);

		if(closed) {
			while(dones.length)
				dones.pop()();
			self.emit("done");
		}
	}

	this.drain = function() {
		buffer.forEach(b=>b.kill("Drain"));
	}

	this.forEach = function(callback) {
		callbacks.push({fn:callback,sync:false});
		return this;
	}

	this.forEachSync = function(callback) {
		callbacks.push({fn:callback,sync:true});
		return this;
	}
}
Util.inherits(PromiseStream, EventEmitter);

module.exports = PromiseStream;
