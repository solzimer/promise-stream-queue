const Stream = require('../main.js');

var stream = new Stream(5000);
var nums = [];

// Iterate on the stream
stream.forEach((err,data,errcatch)=>{
	if(errcatch) console.log("RESULT => Catch\t",err);
	else if(err) console.log("RESULT => Reject\t",err);
	else console.log("RESULT => Resolve\t",data);
});

// Creates 100 asynchronous promises
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
