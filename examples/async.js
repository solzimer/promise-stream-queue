const Stream = require('../main.js');

var stream = new Stream(5000);
var i=0;

// Iterate on the stream
stream.forEach((err,data,errcatch)=>{
	if(errcatch) console.log("RESULT => Catch\t",err);
	else if(err) console.log("RESULT => Reject\t",err);
	else console.log("RESULT => Resolve\t",data);
}).done(()=>{
	console.log("Done!");
});

// Creates asynchronous promises
setInterval(()=>{
	var seq = i++;
	stream.push(new Promise((resolve,reject)=>{
		var rnd = Math.random();
		var to = Math.floor(Math.random()*10000);
		var data = "PR => "+seq+", "+to;
		setTimeout(()=>{
			//if(rnd<=0.5) {resolve(data);}
			//else {reject(data);}
			resolve(data);
		},to);
	}));
},100);

// Close and drain stream after 10 seconds. No new promises
// are pushed to the stream, and the pending ones are
// cancelled
setTimeout(()=>{
	console.log("Closing stream...");
	stream.close();
	stream.drain();
},10000);
