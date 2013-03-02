module.exports = Outgoing;

var util = require('util');

var Transform;
var Readable;
switch (process.version.match(/v([0-9]+\.[0-9]+)\.[0-9]+/)[1]) {
  case '0.0': case '0.1':
  case '0.2': case '0.3':
  case '0.4': case '0.5':
  case '0.6': case '0.7':
    throw new Error('your node is too old and crusty for this hotness');

  case '0.8':
    Readable = require('readable-stream');
    Transform = require('readable-stream/transform.js');
    break;

  default:
    Transform = require('stream').Transform;
    Readable = require('stream').Readable;
    break;
}

util.inherits(Outgoing, Transform);

function Outgoing(options) {
  if (!(this instanceof Outgoing))
    return new Outgoing(options);

  Transform.call(this, options);
  this._sentHeader = false;
  this.header = {};
}

Outgoing.prototype._transform = function(chunk, output, done) {
  if (!this._sentHeader)
    this._sendHeader(chunk, output, done);
  else {
    output(chunk);
    done();
  }
};

Outgoing.prototype._sendHeader = function(chunk, output, done) {
  if (this._sentHeader) {
    this.emit('error', new Error('header already sent'));
  } else {
    try {
      var h = JSON.stringify(this.header) + '\n\n';
      output(new Buffer(h));
      this._sentHeader = true;
      output(chunk);
      done();
    } catch (er) {
      this.emit('error', er);
    }
  }
};
