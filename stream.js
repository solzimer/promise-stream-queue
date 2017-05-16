const
	Duplex = require('stream').Duplex;

class Stream extends Duplex {
	constructor(psq, options) {
		options = options || {};
		if(options.objectMode===undefined) {
			if(options.readableObjectMode===undefined) options.readableObjectMode = true;
			if(options.writableObjectMode===undefined) options.writableObjectMode = true;
		}

		super(options);

		this._psq = psq;
		this._pr = this._newPromise();
		this._trfn = function(chunk,cb){cb(chunk);}

		this._psq.forEachSync((err,res,ex,next)=>{
			if(res) {
				this._pr.then(()=>{
					this._trfn(res,chunk=>{
						this._newPromise();
						this.push(chunk);
						next();
					});
				});
			}
			else {
				next();
			}
		});
	}

	transform(callback) {
		this._trfn = callback;
		return this;
	}

	_newPromise() {
		this._pr = new Promise((res,rej)=>{
			this._resolve = res;
		});
		return this._pr;
	}

	_write(chunk, encoding, callback) {
		this._psq.push(chunk);
		if(callback) callback();
  }

	_read(size) {
		this._resolve();
	}
}

module.exports = Stream;
