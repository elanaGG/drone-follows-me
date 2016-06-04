const NUMBER_DB_DATA = 4499;
const MAX_EPOCHS = 30

const AVG_LINES = 1
const AVG_COLS = 1

const REGRESSION_OUTPUT = true

const IMAGE_WIDTH = 80;
const IMAGE_HEIGHT = 45;
const DB_NAME = 'database.csv';



var convnetjs = require('convnetjs')
var fs = require('fs')
var helpers = require('./DroneHelpers.js')
var PNG2 = require('png-js')

var t = new Date();
console.log('time now: ' + t.toGMTString());


var DBdata = [],
	TestData = [],
	ImageData = [];
var net;

/*

Trainers, converges to:
adadelta ~60%
sgd 65%, sometimes 70%+
adagrad 50%

with the all conv layers + pools:
adadelta ~65% fluctuant ... 70% 
sgd 60%

with 2conv & fc-30 layer at the end:
adadelta 70% at epoch 3 ... 75% at 6

with 3conv & fc-30 layer at the end:
adadelta 70%

*/


layer_defs = [];
layer_defs.push({
	type: 'input',
	out_sx: IMAGE_WIDTH / AVG_COLS,
	out_sy: IMAGE_HEIGHT / AVG_LINES,
	out_depth: 3
});
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 20, // 16
	stride: 1,
	pad: 2,
	activation: 'relu'
});
layer_defs.push({
	type: 'pool',
	sx: 2,
	stride: 2
});
layer_defs.push({
	type: 'fc',
	num_neurons: 30,
	activation: 'relu'
});

layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 20,
	stride: 1,
	pad: 2,
	activation: 'relu'
});
layer_defs.push({
	type: 'pool',
	sx: 2,
	stride: 2
});
layer_defs.push({
	type: 'conv',
	sx: 5,
	filters: 20,
	stride: 1,
	pad: 2,
	activation: 'relu'
});
layer_defs.push({
	type: 'pool',
	sx: 2,
	stride: 2
});
if (REGRESSION_OUTPUT)
	layer_defs.push({
		type: 'regression',
		num_neurons: 3
	});
else
	layer_defs.push({
		type: 'softmax',
		num_classes: 4
	});

if (REGRESSION_OUTPUT) console.log('output: regression')
else console.log('output: classes')

net = new convnetjs.Net();
net.makeLayers(layer_defs);
var trainer = new convnetjs.Trainer(net, {
	method: 'adadelta',
	// l1_decay: 0.001,
	l2_decay: 0.0001, // 0.0001
	batch_size: 4,
	learning_rate: 0.01 // 0.01
		,
	momentum: 0.9
});

loadDB()
console.log('load image data')
loadImages(DBdata).then(function() {
	TestData = ImageData.splice(-1 * Math.round(ImageData.length / 8))
		// console.log(ImageData[0])
	console.log('Training rows: ' + ImageData.length + ', Test rows: ' + TestData.length)

	console.log('\ntraining')
	var stats;
	for (var e = 0; e < MAX_EPOCHS; e++) {
		console.log('\nepoch: ' + (e + 1) + ' of ' + MAX_EPOCHS)
		ImageData = shuffle(ImageData)

		for (var i = 0; i < ImageData.length; i++) {
			var x = ImageData[i][0];
			stats = trainer.train(x, ImageData[i][1]);
			if ((i + 1) % 100 == 0 && i > 0) console.log('    ' + (i + 1) + ' / ' + ImageData.length + ' images done')
			if (i % 1000 == 0 && i > 0) testNetwork();
		}

		// console.log(stats);
		if (e % 1 == 0)
			testNetwork();

		saveNetwork('net_e' + e + '.txt');
	}

	testNetwork();

});

function testNetwork() {
	var tempData = TestData
	TestData = shuffle(tempData) //.slice(0, 200)

	console.log('\ntesting')
	var wrongCounter = 0;
	var correctClassCounter = [0, 0, 0, 0];
	var totalClassCounter = [0, 0, 0, 0]
	for (var i = 0; i < TestData.length; i++) {
		var res = net.forward(TestData[i][0])
		var classIsMax = '';

		// linear regression part
		if (REGRESSION_OUTPUT) {
			var err = Math.abs(res.w[0] - TestData[i][1][0])
			err += Math.abs(res.w[1] - TestData[i][1][1])
			err += Math.abs(res.w[2] - TestData[i][1][2])
			if (! isZeroArray(TestData[i][1]) && (isMax(TestData[i][1]) != isMax(res.w) || err > 1)) {
				wrongCounter++;
				classIsMax = 'no';
			} else if (isZeroArray(TestData[i][1]) && err > 0.4) {
				wrongCounter++;
				classIsMax = 'no';
			} else {
				classIsMax = 'yes';
				if (! isZeroArray(TestData[i][1])) correctClassCounter[isMax(TestData[i][1])]++;
				else correctClassCounter[3]++;
			}
			if (! isZeroArray(TestData[i][1])) totalClassCounter[isMax(TestData[i][1])]++;
			else totalClassCounter[3]++;
			// console.log('corr: ' + classIsMax + '  exp: ' + roundArray(TestData[i][1]) + '   ' + JSON.stringify(res.w))
		}

		// classes part
		else {
			if (TestData[i][1] != isMax(res.w)) wrongCounter++;
			if (TestData[i][1] == isMax(res.w)) correctClassCounter[TestData[i][1]]++;
			totalClassCounter[TestData[i][1]]++;
			var classIsMax = TestData[i][1] == isMax(res.w) ? 'Yes' : 'No'
			console.log('corr: ' + classIsMax + '  exp: ' + (TestData[i][1]) + '   ' + JSON.stringify(res.w))
		}
		// console.log('class: ' + TestData[i][1] + ' score: ' + res.w[TestData[i][1]] + ' isMax: ' + classIsMax + '   ' + JSON.stringify(res.w))
	}

	console.log('Correct: ' + Math.round((1 - wrongCounter / TestData.length) * 100) + ' %')

	for (var i = 0; i < totalClassCounter.length; i++) {
		console.log(' class total correct: ' + Math.round(correctClassCounter[i] / totalClassCounter[i] * 100) + ' %  (of ' + totalClassCounter[i] + ')')
	}

	TestData = tempData
}


function loadDB() {
	DBdata = helpers.loadDatabase(DB_NAME);
	DBdata = shuffle(DBdata); // we want to have different test data every time
	if (NUMBER_DB_DATA < DBdata.length) DBdata = DBdata.splice(-NUMBER_DB_DATA);
}


function loadImages(db_array) {
	if (db_array.length % 500 == 0) console.log('   ' + db_array.length + ' images left');
	var row = db_array.shift();
	if (REGRESSION_OUTPUT)
		var p1 = loadImage(row[0], getOutputValues(row));
	else
		var p1 = loadImage(row[0], getClass(row));

	var promise = new Promise(function(resolve, reject) {
		p1.then(function() {
			if (db_array.length > 0)
				loadImages(db_array).then(function() {
					resolve();
				});
			else {
				resolve();
			}
		});

	});

	return promise;
}


function getClass(row) {
	if (row[1] == -1) return 0; // no hand
	// else return 1;
	if (row[1] <= 213) return 1; // left
	if (row[1] <= 426) return 2; // center
	return 3; // right
}

// Dies funktioniert sehr gut! (mit nur zwei Klassen)
// function getClass(row) {
// 	if (row[1] == -1) return 0;
// 	else return 1;
// }

function getOutputValues(row) {
	if (row[1] == -1) return [0, 0, 0];

	// var x0 = Math.max(1 - (row[1] / 320), 0);
	// var x1 = 1 - Math.abs(row[1] - 320) / 320;
	// var x2 = Math.max(1 - (Math.abs(row[1] - 640) / 320), 0);
	// return [x1, x2, x3];

	var output = [];
	for (var x = 0; x < 3; x++) {
		output[x] = Math.max(0, 1 - Math.abs(row[1] - x / 2 * 640) / 320)
	}
	return output;
}

// var showedInputdataLength = false; // stupid
function loadImage(imageName, outputValues) {
	var path = 'records/' + imageName;

	var promise = new Promise(function(resolve, reject) {
		fs.access(path, fs.F_OK, function(err) {
			// hook TEST if the networks works better if only pictures with a hand on it are used
			// if (outputValues.toString() == [0, 0, 0].toString()) {
			// 	// console.log('no hand on this picture, leave out')
			// 	resolve()
			// } else {

			if (err) {
				console.log('file not found: ' + path);
				resolve();
			} else {
				PNG2.decode(path, function(pixels) {
					var inputData = getInputData(pixels);

					// if (!showedInputdataLength) {
					// 	console.log('   (length input data: ' + inputData.w.length + ' must be = # input layer neurons)');
					// 	showedInputdataLength = true;
					// }

					ImageData.push([inputData, outputValues]);
					resolve();
				});
			}
			// }
		});
	});

	return promise;
}

function getInputData(data) {
	// for (var y = margin; y < 360 - margin; y += AVG_LINES) {
	// 	for (var x = margin; x < 640 - margin; x += AVG_COLS) {
	// 		var idx = (640 * y + x) << 2;

	// 		function dt(idx_diff) {
	// 			return data[idx + idx_diff];
	// 		}

	// 		// standardize
	// 		newData.push(dt(0) / 128 - 1)
	// 		newData.push(dt(1) / 128 - 1)
	// 		newData.push(dt(2) / 128 - 1)
	// 	}
	// }

	var x = new convnetjs.Vol(IMAGE_WIDTH / AVG_COLS, IMAGE_HEIGHT / AVG_LINES, 3)

	for (var dc = 0; dc < 3; dc++) {
		for (var xc = 0; xc < IMAGE_WIDTH; xc += AVG_LINES) {
			for (var yc = 0; yc < IMAGE_HEIGHT; yc += AVG_COLS) {
				// var ix = ((W * k) + i) * 4 + dc;
				var ix = (IMAGE_WIDTH * yc + xc) * 4 + dc;
				x.set(yc, xc, dc, data[ix] / 255.0 - 0.5);
			}
		}
	}

	return x;
}


function saveNetwork(name) {
	var json = net.toJSON();
	var str = JSON.stringify(json);

	var promise = new Promise(function(resolve, reject) {
		fs.writeFile('saves/' + name, str, function(err) {
			if (err) return console.log(err)
			else console.log('network saved as ' + name)
			resolve()
		});
	});

	return promise
}


// HELPERS


function isMax(array) {
	for (var i = 0; i < array.length; i++)
		if (array[i] == Math.max.apply(null, array)) return i;
	return false;
}

function roundArray(array) {
	var newArray = [];
	for (var i = 0; i < array.length; i++)
		newArray.push(Math.round(array[i] * 100) / 100)
	return newArray
}

function isZeroArray(array){
	for (var i=0; i<array.length; i++)
		if (array[i] !== 0) return false;

	return true;
}


function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}