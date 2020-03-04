class Item {
	constructor(id, pr, timeout) {
		this.id = id;
		this.ts = Date.now();
		this.timeout = timeout || 0;
		this.pr = pr;

		this._onsuccess = [];
		this._onerror = [];
		this._oncatch = [];
		this._to = null;
		this.status = "pending";
		this.result = null;

		this.tryResolve(pr);
	}

	async tryResolve(pr) {
		if(pr.then) {
			if(this.timeout>0) {
				this._to = setTimeout(()=>{
					this.kill("Promise timeout");
				},this.timeout);
			}

			try {
				let data = await pr;
				this.thenhdl(data);
			}catch(err) {
				this.catchhdl(err);
			}
		}
		else {
			this.thenhdl(this.pr);
		}
	}

	checkNotify() {
		let status = this.status;
		if(status=="resolve")	this.thenhdl(this.result);
		else if(status=="reject")	this.errhdl(this.result);
		else if(status=="catch") this.catchhdl(this.result);
		else if(status=="killed") this.killhdl(this.result);
	}

	set(st,res) {
		this.status = st;
		this.result = res;
		if(this._to) clearTimeout(this._to);
		this._to = null;
	}

	kill(msg) {
		this.killhdl(msg||"Promise killed");
	}

	then(cbsuccess,cberror) {
		if(cbsuccess) this._onsuccess.push(cbsuccess);
		if(cberror) this._onerror.push(cberror);
		this.checkNotify();
		return this;
	}

	catch(cbcatch) {
		if(cbcatch) this._oncatch.push(cbcatch);
		this.checkNotify();
		return this;
	}

	thenhdl(data) {
		if(this.status=="killed") return;
		this.set("resolve",data);
		let len = this._onsuccess.length;
		for(let i=0;i<len;i++) {
			this._onsuccess[i](data);
		}
		this._onsuccess = [];
	}

	errhdl(error) {
		if(this.status=="killed") return;
		this.set("reject",error);
		let len = this._onerror.length;
		for(let i=0;i<len;i++) {
			this._onerror[i](error);
		}
		this._onerror = [];
	}

	catchhdl(error) {
		if(this.status=="killed") return;
		this.set("catch",error);
		let len = this._oncatch.length;
		for(let i=0;i<len;i++) {
			this._oncatch[i](error);
		}
		this._oncatch = [];
	}

	killhdl(error) {
		this.set("killed",error);
		let len = this._onerror.length;
		for(let i=0;i<len;i++) {
			this._onerror[i](error);
		}
		this._onerror = [];
	}
}

module.exports = Item;
