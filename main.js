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

module.exports = Stream;
