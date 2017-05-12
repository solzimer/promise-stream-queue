const
	Stream = require('../main.js'),
	readline = require('readline');

var stream = new Stream(5000);
var nums = [];

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Iterates over the stream
stream.forEachSync((err,data,errcatch,next)=>{
	if(errcatch) console.log("RESULT => Catch\t",err);
	else if(err) console.log("RESULT => Reject\t",err);
	else console.log("RESULT => Resolve\t",data);

	// We must press type "yes" or press <intro> to move
	// to the next promise
	rl.question('Next? <yes> / no : ', (answer) => {
		if(!answer||answer=="next") next();
		else process.exit(0);
	});
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
