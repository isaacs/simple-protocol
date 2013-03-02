var test = require('tap').test;

var stream = require('stream');
var Readable = stream.Readable;
if (!Readable)
  Readable = require('readable-stream');

var Incoming = require('../incoming.js');

test('basic', function(t) {

  var s = new Readable();
  var h = { contentLength: '99', color: 'red', type: 'luftballoons' };
  var b = 'B is for\nbody. ';
  var body = b + b + b + b;
  var j = JSON.stringify(h) + '\n\n' + body;
  var chunks = [];
  for (var i = 0; i < j.length; i += 5) {
    chunks.push(new Buffer(j.slice(i, i + 5)));
  }
  chunks.push(null);

  s._read = function(n) {
    var c = chunks.shift();
    setTimeout(function() {
      s.push(c);
    });
  };

  var sp = new Incoming();
  var header;
  sp.on('header', function(h) {
    header = h;
    console.error('header', h);
  });
  sp.setEncoding('utf8');
  s.pipe(sp);

  var out = '';
  sp.on('data', function(c) {
    out += c;
  });

  var b = "B is for\nbody. "
  var expect = b + b + b + b;
  sp.on('end', function() {
    t.equal(out, expect);
    t.same(header, {
      contentLength: '99',
      color: 'red',
      type: 'luftballoons'
    });
    t.end();
  });
});
