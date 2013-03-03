module.exports = Outgoing;

var util = require('util');
var Transform = require('./transform');

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
