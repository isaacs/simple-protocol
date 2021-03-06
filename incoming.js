module.exports = Incoming;

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

util.inherits(Incoming, Transform);
function Incoming(options) {
  if (!(this instanceof Incoming))
    return new Incoming(options);

  Transform.call(this, options);
  this._inBody = false;
  this._sawFirstCr = false;
  this._rawHeader = [];
  this.header = null;
}

Incoming.prototype._transform = function(chunk, encoding, done) {
  if (!this._inBody) {
    // check if the chunk has a \n\n
    var split = -1;
    for (var i = 0; i < chunk.length; i++) {
      if (chunk[i] === 10) { // '\n'
        if (this._sawFirstCr) {
          split = i;
          break;
        } else {
          this._sawFirstCr = true;
        }
      } else {
        this._sawFirstCr = false;
      }
    }

    if (split === -1) {
      // still waiting for the \n\n
      // stash the chunk, and try again.
      this._rawHeader.push(chunk);
    } else {
      this._inBody = true;
      var h = chunk.slice(0, split);
      this._rawHeader.push(h);
      var header = Buffer.concat(this._rawHeader).toString();
      try {
        this.header = JSON.parse(header);
      } catch (er) {
        this.emit('error', new Error('invalid simple protocol data'));
        return;
      }
      // and let them know that we are done parsing the header.
      this.emit('header', this.header);

      // now, because we got some extra data, emit this first.
      var b = chunk.slice(split + 1);
      this.push(b);
    }
  } else {
    // from there on, just provide the data to our consumer as-is.
    this.push(chunk);
  }
  done();
};
