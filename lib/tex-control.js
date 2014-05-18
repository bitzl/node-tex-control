'use strict';


var util = require('util');
var spawn = require('child_process').spawn;
var Transform = require('stream').Transform;

function RerunDetector(options) {
	Transform.call(this, options);
	this.buffer = '';
}

util.inherits(RerunDetector, Transform);

RerunDetector.prototype._transform = function(chunk, enc, callback) {
	this.buffer = this.buffer + chunk.toString();
	this.push(chunk, enc);
	callback();
};

RerunDetector.prototype.needsRerun = function() {
	return this.buffer.indexOf('Rerun to get cross-references right.') > -1;
};



function tex() {}

tex.call = function(cmd, args, options) {
	var rerunDetector = new RerunDetector();
	var child = spawn(cmd, args, { stdio: [process.stdin, 'pipe', process.stderr]});
	
	child.stdout
		.pipe(rerunDetector)
		.pipe(process.stdout);

	child.on('exit', function() {
		if (rerunDetector.needsRerun()) {
			console.log();
			console.log('Rerun needed, running again.');
			tex.pdflatex(options);
		}
	});
};

tex.pdflatex = function(options) {
	var cmd = 'pdflatex';
	var args = [];

	if (options.nonstopmode) {
		args.push('--interaction=nonstopmode');
	}

	args.push(options.file);

	tex.call(cmd, args, options);
};

module.exports = tex;