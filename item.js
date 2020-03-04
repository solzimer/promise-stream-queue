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
		if(cbsuccess) onsuccess.push(cbsuccess);
		if(cberror) onerror.push(cberror);
		checkNotify();
		return this;
	}

	this.catch = function(cbcatch) {
		if(cbcatch) oncatch.push(cbcatch);
		checkNotify();
		return this;
	}

	function thenhdl(data) {
		if(status=="killed") return;
		set("resolve",data);
		let len = onsuccess.length;
		for(let i=0;i<len;i++) {
			onsuccess[i](data);
		}
		onsuccess = [];
	}

	function errhdl(error) {
		if(status=="killed") return;
		set("reject",error);
		let len = onerror.length;
		for(let i=0;i<len;i++) {
			onerror[i](error);
		}
		onerror = [];
	}

	function catchhdl(error) {
		if(status=="killed") return;
		set("catch",error);
		let len = oncatch.length;
		for(let i=0;i<len;i++) {
			oncatch[i](error);
		}
		oncatch = [];
	}

	function killhdl(error) {
		set("killed",error);
		let len = onerror.length;
		for(let i=0;i<len;i++) {
			onerror[i](error);
		}
		onerror = [];		
	}

	if(this.pr.then) {
		this.pr.then(thenhdl,errhdl).catch(catchhdl);
		if(this.timeout>0) {
			to = setTimeout(()=>{
				self.kill("Promise timeout");
			},this.timeout);
		};
	}
	else {
		thenhdl(this.pr);
	}
}

module.exports = Item;
