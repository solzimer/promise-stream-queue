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
