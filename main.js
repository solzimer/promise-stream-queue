const
	EventEmitter = require('events').EventEmitter;
	Util = require('util');

const voidfn = function(){};

function Item(id,pr,timeout) {
	this.id = id;
	this.ts = Date.now();
	this.timeout = timeout||0;
	this.pr = pr;

	var self = this;
	var onsuccess = [];
	var onerror = [];
	var oncatch = [];
	var status = "pending";
	var result = null;
	var to = null;

	function checkNotify() {
		if(status=="resolve")	thenhdl(result);
		else if(status=="reject")	errhdl(result);
		else if(status=="catch") catchhdl(result);
		else if(status=="killed") killhdl(result);
	}

	function set(st,res) {
		status = st;
		result = res;
		if(to) clearTimeout(to);
		to = null;
	}

	this.kill = function(msg) {
		killhdl(msg||"Promise killed");
	}

	this.then = function(cbsuccess,cberror) {
		if(cbsuccess) onsuccess.unshift(cbsuccess);
		if(cberror) onerror.unshift(cberror);
		checkNotify();
		return this;
	}

	this.catch = function(cbcatch) {
		if(cbcatch) oncatch.unshift(cbcatch);
		checkNotify();
		return this;
	}

	function thenhdl(data) {
		if(status=="killed") return;
		set("resolve",data);
		while(onsuccess.length) {
			onsuccess.pop()(data);
		}
	}

	function errhdl(error) {
		if(status=="killed") return;
		set("reject",error);
		while(onerror.length) {
			onerror.pop()(error);
		}
	}

	function catchhdl(error) {
		if(status=="killed") return;
		set("catch",error);
		while(oncatch.length) {
			oncatch.pop()(error);
		}
	}

	function killhdl(error) {
		set("killed",error);
		while(onerror.length) {
			onerror.pop()(error);
		}
	}

	this.pr.then(thenhdl,errhdl).catch(catchhdl);
	if(this.timeout>0) {
		to = setTimeout(()=>{
			self.kill("Promise timeout");
		},this.timeout);
	};
}

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
		process.nextTick(fetchNext);
	}

	function fetchNext() {
		if(pending) return;

		if(buffer.length) {
			item = buffer[buffer.length-1];
			pending = true;

			item.then(data=>{
				notify("resolve",data);
				callbacks.forEach(cb=>cb(null,data,null));
			},err=>{
				notify("reject",err);
				callbacks.forEach(cb=>cb(err,null,null));
			}).catch(err=>{
				notify("catch",err);
				callbacks.forEach(cb=>cb(err,null,err));
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
		callbacks.push(callback);
	}
}
Util.inherits(Stream, EventEmitter);

if(!module.parent) {
	var stream = new Stream(5000);
	var nums = [];

	stream.forEach((err,data,errcatch)=>{
		if(errcatch) console.log("RESULT => Catch\t",err);
		else if(err) console.log("RESULT => Reject\t",err);
		else console.log("RESULT => Resolve\t",data);
	});

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
