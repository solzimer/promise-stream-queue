const Stream = require('../main.js');
const MAX = 10000;


async function run() {
	let stream = new Stream(5000);
	let ti1 = Date.now();

	for(let i=0;i<MAX;i++) {
		await stream.push(new Promise(ok=>{}));
	}

	let tf1 = Date.now();
	console.log(`Time : ${tf1-ti1}`);
}

async function test() {
	await run();
}

test();
