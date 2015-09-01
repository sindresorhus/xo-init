'use strict';
var path = require('path');
var fs = require('fs');
var test = require('ava');
var tempWrite = require('temp-write');
var dotProp = require('dot-prop');
var fn = require('./');

var originalArgv = process.argv.slice();

function run(t, pkg, cb) {
	var filepath = tempWrite.sync(JSON.stringify(pkg), 'package.json');

	fn({
		cwd: path.dirname(filepath)
	}, function (err) {
		t.assert(!err, err);
		var pkg2 = JSON.parse(fs.readFileSync(filepath, 'utf8'));
		t.assert(dotProp.get(pkg2, 'devDependencies.xa'));
		cb(pkg2);
	});
}

test('empty package.json', function (t) {
	t.plan(4);

	run(t, {}, function (pkg) {
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has scripts', function (t) {
	t.plan(4);

	run(t, {
		scripts: {
			start: ''
		}
	}, function (pkg) {
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has default test', function (t) {
	t.plan(4);

	run(t, {
		scripts: {
			test: 'echo "Error: no test specified" && exit 1'
		}
	}, function (pkg) {
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has only xa', function (t) {
	t.plan(4);

	run(t, {
		scripts: {
			test: 'xa'
		}
	}, function (pkg) {
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has test', function (t) {
	t.plan(4);

	run(t, {
		scripts: {
			test: 'ava'
		}
	}, function (pkg) {
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa && ava');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has cli args', function (t) {
	t.plan(4);

	process.argv = originalArgv.concat(['--init', '--space']);

	run(t, {
		scripts: {
			start: ''
		}
	}, function (pkg) {
		process.argv = originalArgv;
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa.space') === true);
	});
});

test('has cli args and test', function (t) {
	t.plan(5);

	process.argv = originalArgv.concat(['--init', '--env=node', '--env=browser']);

	run(t, {
		scripts: {
			test: 'ava'
		}
	}, function (pkg) {
		process.argv = originalArgv;
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa && ava');
		t.assert(dotProp.get(pkg, 'xa.envs.0') === 'node');
		t.assert(dotProp.get(pkg, 'xa.envs.1') === 'browser');
	});
});

test('has cli args and existing config', function (t) {
	t.plan(5);

	process.argv = originalArgv.concat(['--init', '--space']);

	run(t, {
		xa: {
			esnext: true
		}
	}, function (pkg) {
		process.argv = originalArgv;
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa.space') === true);
		t.assert(dotProp.get(pkg, 'xa.esnext') === undefined);
	});
});

test('has existing config without cli args', function (t) {
	t.plan(4);

	process.argv = originalArgv.concat(['--init']);

	run(t, {
		xa: {
			esnext: true
		}
	}, function (pkg) {
		process.argv = originalArgv;
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa') === undefined);
	});
});

test('has everything covered when it comes to config', function (t) {
	t.plan(12);

	process.argv = originalArgv.concat([
		'--init',
		'--space',
		'--esnext',
		'--no-semicolon',
		'--env=foo',
		'--env=bar',
		'--global=foo',
		'--global=bar',
		'--ignore=foo',
		'--ignore=bar'
	]);

	run(t, {}, function (pkg) {
		process.argv = originalArgv;
		t.assert(dotProp.get(pkg, 'scripts.test') === 'xa');
		t.assert(dotProp.get(pkg, 'xa.space') === true);
		t.assert(dotProp.get(pkg, 'xa.esnext') === true);
		t.assert(dotProp.get(pkg, 'xa.semicolon') === false);
		t.assert(dotProp.get(pkg, 'xa.envs.0') === 'foo');
		t.assert(dotProp.get(pkg, 'xa.envs.1') === 'bar');
		t.assert(dotProp.get(pkg, 'xa.globals.0') === 'foo');
		t.assert(dotProp.get(pkg, 'xa.globals.1') === 'bar');
		t.assert(dotProp.get(pkg, 'xa.ignores.0') === 'foo');
		t.assert(dotProp.get(pkg, 'xa.ignores.1') === 'bar');
	});
});
