const
	Stream = require('../main.js'),
	readline = require('readline');

var stream = new Stream(5000).toStream({
	writableObjectMode:true,
	readableObjectMode:false
});

var nums = [];

function trfn(data,callback) {
	callback(JSON.stringify(data)+"\n");
}

// Pipe stream to stdout
stream.transform(trfn).pipe(process.stdout);

// Creates 100 asynchronous promises
for(var i=0;i<100;i++) nums.push(i);
nums.forEach(i=>{
	var to = Math.floor(Math.random()*5000);
	var data = "PR => "+i+", "+to;
	console.log("PUSH ",data);
	stream.write(new Promise((resolve,reject)=>{
		setTimeout(()=>{
			resolve({data:data});
		},to);
	}));
});
